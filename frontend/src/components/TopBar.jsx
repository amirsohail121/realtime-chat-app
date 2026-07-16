import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { HiUserGroup } from "react-icons/hi2";

const Topbar = () => {
  const { selectedChat, onlineUsers } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  const otherUser = selectedChat && !selectedChat.isGroupChat
    ? selectedChat.users.find(u => u?._id?.toString() !== user?._id?.toString())
    : null;

  const chatName = selectedChat
    ? (selectedChat.isGroupChat ? selectedChat.chatName : otherUser?.name)
    : "No Chat Selected";

  const chatAvatar = selectedChat
    ? (selectedChat.isGroupChat ? selectedChat.groupPic : otherUser?.profilePic)
    : null;

  const isOnline = selectedChat && !selectedChat.isGroupChat && onlineUsers.includes(otherUser?._id);

  const getStatus = () => {
    if (!selectedChat) return "Select a chat";

    if (selectedChat.isGroupChat) {
      return `${selectedChat.users.length} members`;  // ← group shows member count
    }

    if (onlineUsers.includes(otherUser?._id)) return "Online";
    if (otherUser?.lastSeen) {
      return `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "Offline";
  };

  return (
    <div className="h-16 text-white bg-teal-600 border-b border-teal-700 flex items-center px-5 shadow-sm sticky top-0 z-10">

      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {chatAvatar ? (
            <img
              src={chatAvatar}
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : selectedChat?.isGroupChat ? (
            <div className="w-10 h-10 rounded-full bg-teal-500 ring-2 ring-white/20 flex items-center justify-center">
              <HiUserGroup size={18} className="text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-teal-500 ring-2 ring-white/20 flex items-center justify-center font-semibold">
              {chatName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-teal-600" />
          )}
        </div>

        {/* Chat Info */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">
            {chatName}
          </h2>
          <p className="text-xs text-teal-100 truncate">
            {getStatus()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Topbar;