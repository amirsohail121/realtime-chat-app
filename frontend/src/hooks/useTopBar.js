import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const useTopBar = () => {
  const { selectedChat, onlineUsers } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

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

  const getStatus = () => {
    if (!selectedChat) return "Select a chat";
    if (selectedChat.isGroupChat) return `${selectedChat.users.length} members`;
    if (onlineUsers.includes(otherUser?._id)) return "Online";
    if (otherUser?.lastSeen) {
      return `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "Offline";
  };

  return {
    selectedChat,
    chatName,
    chatAvatar,
    getStatus,
  };
};

export default useTopBar;
