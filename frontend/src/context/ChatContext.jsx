import { createContext, useState, useEffect, useContext, useRef } from "react";
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
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Always holds the latest selectedChat._id, readable inside stable socket listeners
  const selectedChatRef = useRef(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat?._id || null;
  }, [selectedChat]);

  // Fetch chats when user logs in
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      setChatsLoading(true);
      try {
        const res = await api.get("/chats");
        setChatList(res.data);
      } catch (err) {
        console.error("Failed to fetch chats", err);
      } finally {
        setChatsLoading(false);  // ← always stop loading
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
      setChatList((prev) =>
        prev.map((chat) => ({
          ...chat,
          users: chat.users.map((u) =>
            u._id === userId ? { ...u, lastSeen } : u
          ),
        }))
      );

      setSelectedChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) =>
            u._id === userId ? { ...u, lastSeen } : u
          ),
        };
      });
    });

    // Listen for messages_read event
    socket.on("messages_read", (chatId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat === chatId && !msg.readBy.includes(user._id)
            ? { ...msg, readBy: [...msg.readBy, user._id] }
            : msg
        )
      );
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
      setMessagesLoading(true);
      try {
        const res = await api.get(`/messages/${selectedChat._id}`);
        setMessages(res.data);
        await api.put(`/messages/read/${selectedChat._id}`);
        socket.emit("messages_read", selectedChat._id);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setMessagesLoading(false);  // ← always stop loading
      }
    };
    fetchMessages();
    socket.emit("join_chat", selectedChat._id);
  }, [selectedChat]);

  // Listen for real-time messages
  useEffect(() => {
    socket.on("receive_message", (newMessage) => {
      // Only append to the visible thread if it belongs to the chat
      // that's currently open. Prevents messages from one chat
      // bleeding into whatever chat happens to be open when the
      // socket event arrives.
      if (newMessage.chat === selectedChatRef.current) {
        setMessages((prev) => [...prev, newMessage]);
      }

      // Always update the chat list preview / latestMessage,
      // regardless of which chat is currently open.
      setChatList((prev) =>
        prev.map((chat) =>
          chat._id === newMessage.chat
            ? { ...chat, latestMessage: newMessage }
            : chat
        )
      );
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
        chatsLoading,
        messagesLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}