import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const useTopBar = () => {
  const { selectedChat, onlineUsers } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  // forces a re-render every 30s so relative "last seen" text stays accurate
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const otherUser =
    selectedChat && !selectedChat.isGroupChat
      ? selectedChat.users.find(
          (u) => u?._id?.toString() !== user?._id?.toString(),
        )
      : null;

  const chatName = selectedChat
    ? selectedChat.isGroupChat
      ? selectedChat.chatName
      : otherUser?.name
    : "No Chat Selected";

  const chatAvatar = selectedChat
    ? selectedChat.isGroupChat
      ? selectedChat.groupPic
      : otherUser?.profilePic
    : null;

  const isOnline =
    !!selectedChat &&
    !selectedChat.isGroupChat &&
    onlineUsers.includes(otherUser?._id?.toString());

  const getStatus = () => {
    if (!selectedChat) return "Select a chat";
    if (selectedChat.isGroupChat) return `${selectedChat.users.length} members`;
    if (isOnline) return "Online";

    if (otherUser?.lastSeen) {
      const lastSeen = new Date(otherUser.lastSeen);
      const now = new Date();
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const diffMs = now - lastSeen;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Offline";

      const time = lastSeen.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (lastSeen.toDateString() === today.toDateString()) {
        return `Last seen ${time}`;
      }

      if (lastSeen.toDateString() === yesterday.toDateString()) {
        return `Last seen Yesterday ${time}`;
      }

      const date = lastSeen.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
      return `Last seen ${date} ${time}`;
    }

    return "Offline";
  };

  return {
    selectedChat,
    chatName,
    chatAvatar,
    getStatus,
    isOnline,
  };
};

export default useTopBar;
