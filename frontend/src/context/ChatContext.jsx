import { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import api from "../api/api";
import { AuthContext } from "./AuthContext";
import { socket } from "../socket/socket";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (typeof value.toString === "function") return value.toString();
  }
  return String(value);
};

const getMessageTime = (message) => {
  const raw = message?.createdAt;
  const timestamp = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortChatsByLatestMessage = (chats = []) => {
  return [...chats].sort((a, b) => {
    const aTime = getMessageTime(a.latestMessage);
    const bTime = getMessageTime(b.latestMessage);
    return bTime - aTime;
  });
};

const moveChatToTopWithLatest = (chats, chatId, latestMessage) => {
  const normalizedChatId = normalizeId(chatId);
  const index = chats.findIndex((chat) => normalizeId(chat._id) === normalizedChatId);
  if (index === -1) return chats;

  const updatedChat = {
    ...chats[index],
    latestMessage,
  };

  return [updatedChat, ...chats.filter((_, i) => i !== index)];
};

const hasUserReadMessage = (message, userId) => {
  const readBy = message?.readBy || [];
  return readBy.some((reader) => normalizeId(reader) === normalizeId(userId));
};

const isMessageFromCurrentUser = (message, userId) => {
  return normalizeId(message?.sender) === normalizeId(userId);
};

const buildInitialUnreadCounts = (chats, userId) => {
  return chats.reduce((acc, chat) => {
    const chatId = normalizeId(chat?._id);
    const latestMessage = chat?.latestMessage;
    if (!chatId || !latestMessage) return acc;

    const unread =
      !isMessageFromCurrentUser(latestMessage, userId) &&
      !hasUserReadMessage(latestMessage, userId);

    if (unread) {
      acc[chatId] = 1;
    }

    return acc;
  }, {});
};

const addReaderToMessage = (message, readerId, chatId) => {
  const messageChatId = normalizeId(message?.chat);
  const incomingChatId = normalizeId(chatId);
  if (!incomingChatId || messageChatId !== incomingChatId) return message;

  const normalizedReaderId = normalizeId(readerId);
  if (!normalizedReaderId) return message;

  const alreadyRead = hasUserReadMessage(message, normalizedReaderId);
  if (alreadyRead) return message;

  return {
    ...message,
    readBy: [...(message.readBy || []), normalizedReaderId],
  };
};

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState({});

  // Always holds the latest selectedChat._id, readable inside stable socket listeners
  const selectedChatRef = useRef(null);
  const chatListRef = useRef([]);
  const userIdRef = useRef(null);

  useEffect(() => {
    chatListRef.current = chatList;
  }, [chatList]);

  useEffect(() => {
    userIdRef.current = user?._id || null;
  }, [user]);

  const markChatAsRead = useCallback(async (chatId) => {
    const normalizedChatId = normalizeId(chatId);
    if (!normalizedChatId) return;

    const readerId = userIdRef.current;
    if (!readerId) return;

    try {
      await api.put(`/messages/read/${normalizedChatId}`);
      socket.emit("messages_read", { chatId: normalizedChatId, readerId });
    } catch (err) {
      console.error("Failed to mark chat as read", err);
    }
  }, []);

  useEffect(() => {
    selectedChatRef.current = selectedChat?._id || null;
  }, [selectedChat, markChatAsRead]);

  // Fetch chats when user logs in
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      setChatsLoading(true);
      try {
        const res = await api.get("/chats");
        const sortedChats = sortChatsByLatestMessage(res.data);
        setChatList(sortedChats);
        setUnreadCounts(buildInitialUnreadCounts(sortedChats, user?._id));

        // Join all chat rooms so incoming messages reorder chat list on receiver side too.
        sortedChats.forEach((chat) => {
          if (chat?._id) socket.emit("join_chat", chat._id);
        });
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

      // Rejoin all known rooms after reconnect.
      chatListRef.current.forEach((chat) => {
        if (chat?._id) socket.emit("join_chat", chat._id);
      });

      if (selectedChatRef.current) {
        socket.emit("join_chat", selectedChatRef.current);
      }
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
    socket.on("messages_read", (payload) => {
      const data =
        typeof payload === "string"
          ? { chatId: payload }
          : payload || {};

      const readerId = data.readerId || null;
      const chatId = data.chatId;
      if (!chatId || !readerId) return;

      setMessages((prev) => prev.map((msg) => addReaderToMessage(msg, readerId, chatId)));
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

    const selectedChatId = normalizeId(selectedChat._id);
    if (selectedChatId) {
      setUnreadCounts((prev) => {
        if (!prev[selectedChatId]) return prev;
        const next = { ...prev };
        delete next[selectedChatId];
        return next;
      });
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await api.get(`/messages/${selectedChat._id}`);
        setMessages(res.data);
        await markChatAsRead(selectedChat._id);
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
      const incomingChatId = normalizeId(newMessage.chat);
      const currentChatId = normalizeId(selectedChatRef.current);
      const isOwnMessage = isMessageFromCurrentUser(newMessage, userIdRef.current);

      if (incomingChatId === currentChatId) {
        setMessages((prev) =>
          prev.some((msg) => msg._id === newMessage._id)
            ? prev
            : [...prev, newMessage]
        );

        // If this chat is open for the receiver, mark new message(s) as read immediately.
        if (!isOwnMessage) {
          markChatAsRead(incomingChatId);
        }
      }

      if (!isOwnMessage && incomingChatId !== currentChatId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [incomingChatId]: (prev[incomingChatId] || 0) + 1,
        }));
      }


      setChatList((prev) => moveChatToTopWithLatest(prev, incomingChatId, newMessage));
    });

    return () => {
      socket.off("receive_message");
    };
  }, [markChatAsRead]);

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
        unreadCounts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}