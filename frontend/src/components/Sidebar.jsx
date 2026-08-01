import useSidebar from "../hooks/useSidebar";
import { useNavigate } from "react-router-dom";
import { HiUserGroup } from "react-icons/hi2";
import { BsChatDotsFill } from "react-icons/bs";
import { IoCloseOutline, IoLogOutOutline, IoSearchOutline } from "react-icons/io5";
import { decryptPreview } from "../utils/crypto";
import { ChatItemSkeleton, SearchResultSkeleton } from "./Skeletons";
import Avatar from "./Avatar";
import logo from "../assets/logo.png";
import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { chatsLoading, unreadCounts } = useContext(ChatContext);
  const {
    user,
    logout,
    chatList,
    setSelectedChat,
    selectedChat,
    searchQuery,
    searchResults,
    searching,
    handleSearch,
    handleStartChat,
    groupOpen, setGroupOpen,
    groupName, setGroupName,
    groupMembers, setGroupMembers,
    groupSearch,
    groupSearchResults,
    handleGroupSearch,
    handleCreateGroup,
    getChatName,
  } = useSidebar();

  return (
    <div className="flex flex-row h-screen bg-[var(--color-surface)]">

      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-20 px-4 py-6 flex flex-col items-center gap-6 bg-[var(--bubble-sent-bg)] border-r border-black/5">

        {/* LOGO (mint background with white inner rounded square) */}
        <div className="w-11 h-11 rounded-2xl bg-[#DFFCF3] flex items-center justify-center">
          <div className="w-9 h-9 cursor-pointer rounded-xl bg-white flex items-center justify-center">
            <BsChatDotsFill className="w-5 h-5 text-[#CFF7F1]" />
          </div>
        </div>

        {/* NAV ICON */}
        <HiUserGroup
          onClick={() => setGroupOpen(!groupOpen)}
          size={20}
          className="w-11 h-11 p-2.5 rounded-2xl text-white cursor-pointer hover:text-[var(--bubble-sent-bg)] hover:bg-white transition-colors duration-200"
        />

        {/* PROFILE + LOGOUT */}
        <div className="mt-auto flex flex-col items-center gap-4">
          <img
            onClick={() => navigate("/profile")}
            src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-[var(--bubble-sent-bg)] ring-white cursor-pointer hover:ring-white hover:shadow-lg hover:shadow-black/10 transition-all duration-200"
          />

          <IoLogOutOutline
            onClick={logout}
            size={30}
            title="Logout"
            className="w-11 h-11 p-2.5 rounded-2xl text-white cursor-pointer hover:text-rose-500 hover:bg-rose-100 transition-colors duration-200"
          />
        </div>

        {/* GROUP CHAT MODAL */}
        {groupOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-[var(--color-surface)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2.5">
                <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-secondary)]">
                  <HiUserGroup size={18} />
                </span>
                Create Group Chat
              </h2>

              {/* Group Name */}
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full text-[var(--color-heading)] p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-[var(--color-secondary)] transition-colors"
              />

              {/* Search Users */}
              <input
                type="text"
                placeholder="Search users to add..."
                value={groupSearch}
                onChange={(e) => handleGroupSearch(e.target.value)}
                className="w-full text-[var(--color-heading)] p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-[var(--color-secondary)] transition-colors"
              />

              {/* Search Results */}
              <div className="max-h-32 overflow-y-auto mb-3">
                {groupSearchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      if (!groupMembers.find(m => m._id === u._id)) {
                        setGroupMembers(prev => [...prev, u]);
                      }
                    }}
                    className="flex items-center gap-2 p-2 hover:bg-[var(--color-surface-muted)] rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar src={u.profilePic} size={32} />
                    <p className="text-sm text-[var(--color-heading)]">{u.name}</p>
                  </div>
                ))}
              </div>

              {/* Selected Members */}
              {groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {groupMembers.map((m) => (
                    <span
                      key={m._id}
                      className="flex items-center gap-1.5 bg-[var(--color-primary-light)] text-[var(--color-secondary)] pl-3 pr-2 py-1 rounded-full text-sm"
                    >
                      {m.name}
                      <button
                        onClick={() => setGroupMembers(prev => prev.filter(x => x._id !== m._id))}
                        className="w-4 h-4 flex items-center justify-center rounded-full text-[var(--color-secondary)] hover:bg-white hover:text-[var(--color-secondary)]"
                      >
                        <IoCloseOutline size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 bg-[var(--color-secondary)] hover:opacity-90 text-white py-2.5 rounded-xl font-medium transition-opacity"
                >
                  Create Group
                </button>
                <button
                  onClick={() => {
                    setGroupOpen(false);
                    setGroupName("");
                    setGroupMembers([]);
                  }}
                  className="flex-1 bg-[var(--color-surface-muted)] hover:bg-slate-200 text-[var(--color-body)] py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CHAT LIST AREA ===== */}
      <div className="flex-1 flex flex-col w-[26rem] border-r border-slate-200">

        {/* HEADER */}
        <div className="bg-[var(--color-surface)] border-b border-slate-200 px-6 py-4">

          {/* APP LOGO + HEADING */}
          <div className="">
            <img
              src={logo}
              alt="Chat app logo"
              className="w-40  select-none object-contain"
              draggable="false"
            />
          </div>

          {/* SEARCH PANEL */}
          <div>
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-body)]" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search Users..."
                className="w-full text-[var(--color-heading)] pl-10 pr-3 py-2 border border-[var(--color-surface-muted)] rounded-4xl bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--bubble-sent-bg)] focus:border-[var(--bubble-sent-bg)] transition-colors"
                autoFocus
              />
            </div>

            {/* SEARCH RESULTS */}
            <div className="mt-2 max-h-60 overflow-y-auto">
              {searching ? (
                <>
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                </>
              ) : searchResults.length === 0 && searchQuery ? (
                <p className="text-center text-[var(--color-body)] text-sm py-2">No users found</p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-tint)] rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar src={u.profilePic} size={40} />
                    <div>
                      <p className="font-medium text-[var(--color-heading)] text-sm">{u.name}</p>
                      <p className="text-[var(--color-body)] text-xs">{u.bio}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {chatsLoading ? (
            <>
              <ChatItemSkeleton />
              <ChatItemSkeleton />
              <ChatItemSkeleton />
              <ChatItemSkeleton />
              <ChatItemSkeleton />
            </>
          ) : chatList.length > 0 ? (
            chatList.map((chat, index) => {
              const otherUser = chat.isGroupChat
                ? null
                : chat.users.find(u => u._id !== user?._id);
              const isActive = selectedChat?._id === chat._id;
              const unreadCount = unreadCounts?.[chat._id] || 0;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3 ${isActive
                    ? "bg-[var(--bubble-sent-bg)]"
                    : "hover:bg-purple-100"
                    }`}
                >
                  {/* AVATAR */}
                  <div>
                    <Avatar
                      src={chat.isGroupChat ? chat.groupPic : otherUser?.profilePic}
                      size={44}
                      isGroup={chat.isGroupChat}
                    />
                  </div>

                  {/* NAME + LAST MESSAGE */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[var(--color-heading)] truncate">
                        {getChatName(chat, user)}
                      </p>
                      {unreadCount > 0 && !isActive && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate text-[var(--color-body)]">
                      {chat.latestMessage
                        ? decryptPreview(chat.latestMessage, user?._id)
                        : "No messages yet"
                      }
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-4 text-center text-[var(--color-body)]">No chats yet</p>
          )}
        </div>

      </div>
    </div>

  );
};

export default Sidebar;