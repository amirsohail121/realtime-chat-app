import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "./AuthContext";
import { socket } from "../socket/socket";

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Fetch chats when user logs in
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      try {
        const res = await api.get("/chats");
        setChatList(res.data);
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    };
    fetchChats();
  }, [user]);

  // Socket connection + online status + lastSeen
  useEffect(() => {
    if (!user) return;

    socket.connect();

    // Emit user_online AFTER socket is confirmed connected
    socket.on("connect", () => {
      socket.emit("user_online", user._id);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("user_last_seen", ({ userId, lastSeen }) => {
      setChatList(prev => prev.map(chat => ({
        ...chat,
        users: chat.users.map(u =>
          u._id === userId ? { ...u, lastSeen } : u
        )
      })));

      setSelectedChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map(u =>
            u._id === userId ? { ...u, lastSeen } : u
          )
        };
      });
    });

    // Listen for messages_read event
    socket.on("messages_read", (chatId) => {
      setMessages(prev => prev.map(msg =>
        msg.chat === chatId && !msg.readBy.includes(user._id)
          ? { ...msg, readBy: [...msg.readBy, user._id] }
          : msg
      ));
    });

    return () => {
      socket.off("connect");
      socket.off("online_users");
      socket.off("user_last_seen");
      socket.off("messages_read");
      socket.disconnect();
    };
  }, [user]);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${selectedChat._id}`);
        setMessages(res.data);

        // Mark messages as read
        await api.put(`/messages/read/${selectedChat._id}`);

        // Notify sender via socket
        socket.emit("messages_read", selectedChat._id);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
    socket.emit("join_chat", selectedChat._id);
  }, [selectedChat]);

  // Listen for real-time messages
  // Listen for real-time messages
  useEffect(() => {
    socket.on("receive_message", (newMessage) => {
      // Update messages array
      setMessages((prev) => [...prev, newMessage]);

      // Update latestMessage in chatList ← ADD THIS
      setChatList(prev => prev.map(chat =>
        chat._id === newMessage.chat
          ? { ...chat, latestMessage: newMessage }
          : chat
      ));
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chatList,
        setChatList,
        selectedChat,
        setSelectedChat,
        messages,
        setMessages,
        onlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}