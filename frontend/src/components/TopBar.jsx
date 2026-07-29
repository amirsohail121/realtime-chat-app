import useTopBar from "../hooks/useTopBar";
import { CiSearch } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";

const TopBar = () => {
  const { chatName, chatAvatar, getStatus, isOnline } = useTopBar();

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
          <p className="text-xs text-gray-200">
            {getStatus()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopBar;