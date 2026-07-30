import useTopBar from "../hooks/useTopBar";
import { CiSearch } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";
import { HiUserGroup } from "react-icons/hi2";

const TopBar = () => {
  const { chatName, chatAvatar, getStatus, isOnline, selectedChat } = useTopBar();

  return (
    <div
      className="h-16 flex items-center justify-between px-5 shadow-sm sticky top-0 z-10 border-b border-black/5"
      style={{ background: "var(--bubble-sent-bg)" }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          {chatAvatar ? (
            <img
              src={chatAvatar}
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-black/10"
            />
          ) : selectedChat?.isGroupChat ? (
            <div className="w-10 h-10 rounded-full ring-2 ring-black/10 flex items-center justify-center" style={{ background: "var(--color-secondary-light)" }}>
              <HiUserGroup size={18} className="text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full ring-2 ring-black/10 flex items-center justify-center font-semibold text-white" style={{ background: "var(--color-secondary-light)" }}>
              {chatName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2"
              style={{ background: "var(--color-success)", "--tw-ring-color": "var(--bubble-sent-bg)" }}
            />
          )}
        </div>

        {/* Chat Info */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--color-heading)] truncate">
            {chatName}
          </h2>
          <p className="text-xs flex items-center gap-1.5 truncate" style={{ color: isOnline ? "var(--color-success)" : "var(--color-body)" }}>
            {isOnline && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-success)" }} />
            )}
            {getStatus()}
          </p>
        </div>
      </div>

      
    </div>
  );
};

export default TopBar;