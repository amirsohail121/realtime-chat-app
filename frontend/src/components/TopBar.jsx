import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { CiSearch } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";

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
    <div className="h-16 text-white bg-[#372aac] border-b border-gray-200 flex items-center justify-between px-4 shadow-sm sticky top-0 z-10">

      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {chatAvatar ? (
          <img
            src={chatAvatar}
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold">
            {chatName?.[0] || "?"}
          </div>
        )}

        {/* Chat Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-200">
            {chatName}
          </h2>
          <p className="text-xs text-gray-200">
            {getStatus()}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="text-white">
          <CiSearch />
        </button>
        <button className="text-white">
          <HiDotsVertical />
        </button>
      </div>
    </div>
  );
};

export default Topbar;