import { useState, useEffect, useContext, useRef } from "react";
import useSidebar from "../hooks/useSidebar";
import { useNavigate } from "react-router-dom";
import { HiUserGroup, HiEllipsisVertical } from "react-icons/hi2";
import { BsChatDotsFill } from "react-icons/bs";
import { IoCloseOutline, IoLogOutOutline, IoSearchOutline } from "react-icons/io5";
import { decryptPreview } from "../utils/crypto";
import { ChatItemSkeleton, SearchResultSkeleton } from "./Skeletons";
import Avatar from "./Avatar";
import logo from "../assets/logo.png";
import chatwaveLogo from "../assets/chatwaveLogo.png";
import { ChatContext } from "../context/ChatContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { chatsLoading, unreadCounts } = useContext(ChatContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Controls the slide between full list and icon-rail width.
  // Only ever true on an actual tablet/iPad — see isTabletDevice below.
  const [tabletCollapsed, setTabletCollapsed] = useState(false);
  const [isTabletDevice, setIsTabletDevice] = useState(false);
  const sidebarRef = useRef(null);
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

  // Detect an actual tablet/iPad: touch-primary (coarse pointer, no hover)
  // AND in the 768–1279px width range. Width alone isn't enough — a laptop
  // browser window resized narrower would also match that width range, but
  // it still reports pointer:fine/hover:hover, so it's correctly excluded.
  // This updates live if the window is resized, rotated, or a mouse/touch
  // input is switched.
  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 768px) and (max-width: 1279.98px) and (pointer: coarse) and (hover: none)"
    );
    const update = () => setIsTabletDevice(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fully automatic: collapse to the icon rail as soon as a chat opens —
  // but ONLY on an actual tablet/iPad. On laptop/desktop this stays false
  // permanently, so the panel never collapses there, regardless of window
  // width or which chat is open.
  // Keyed off the id (not the whole object) so unrelated re-renders of
  // selectedChat (new message, read-receipt, refetch) don't flicker this.
  useEffect(() => {
    setTabletCollapsed(isTabletDevice && !!selectedChat?._id);
  }, [selectedChat?._id, isTabletDevice]);

  // While a chat is open and the panel has been temporarily expanded
  // (via the logo/search tap), clicking ANYWHERE outside the sidebar
  // collapses it back to the icon rail — not just re-picking a chat.
  // (No-op on laptop/desktop since tabletCollapsed can't be true there.)
  useEffect(() => {
    if (tabletCollapsed || !selectedChat?._id || !isTabletDevice) return;

    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setTabletCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tabletCollapsed, selectedChat?._id, isTabletDevice]);

  const expandIfCollapsed = () => {
    if (tabletCollapsed) setTabletCollapsed(false);
  };

  return (
    <div ref={sidebarRef} className="flex flex-row h-screen w-full md:w-auto bg-[var(--color-surface)]">

      {/* ===== LEFT ICON BAR — desktop/tablet only ===== */}
      <div className="hidden md:flex w-20 px-4 py-6 flex-col items-center gap-6 bg-[var(--bubble-sent-bg)] border-r border-black/5">

        <div className="w-11 h-11 rounded-2xl bg-[#DFFCF3] flex items-center justify-center">
          <div className="w-9 h-9 cursor-pointer rounded-xl bg-white flex items-center justify-center">
            <BsChatDotsFill className="w-5 h-5 text-[#CFF7F1]" />
          </div>
        </div>

        <HiUserGroup
          onClick={() => setGroupOpen(!groupOpen)}
          size={20}
          className="w-11 h-11 p-2.5 rounded-2xl text-white cursor-pointer hover:text-[var(--bubble-sent-bg)] hover:bg-white transition-colors duration-200"
        />

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
      </div>

      {/* ===== CHAT LIST AREA — wider tablet width, full 26rem on desktop ===== */}
      <div
        className={`relative flex flex-col border-r border-slate-200 overflow-hidden
          transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-full ${tabletCollapsed ? "md:w-16" : "md:w-96"} xl:w-[26rem]`}
      >

        <div className="bg-[var(--color-surface)] border-b border-slate-200 px-4 md:px-6 py-3 md:py-4">

          {/* HEADER ROW */}
          <div className={`flex items-center transition-all duration-500 ${tabletCollapsed ? "md:justify-center" : "justify-between"}`}>
            {/* Full logo — cross-fades out on tablet-collapsed */}
            <img
              src={logo}
              alt="Chat app logo"
              className={`w-32 md:w-40 select-none object-contain transition-opacity duration-300
                ${tabletCollapsed ? "md:hidden md:opacity-0" : "opacity-100"}`}
              draggable="false"
            />

            {/* Compact mark shown only while tablet-collapsed — tap to expand.
                Sized to match the other 44px rail icons so it's actually visible. */}
            <div
              onClick={expandIfCollapsed}
              className={`hidden ${tabletCollapsed ? "md:flex" : ""} w-11 h-11 shrink-0 rounded-2xl bg-[var(--color-primary-light)] items-center justify-center cursor-pointer
                transition-opacity duration-300 ${tabletCollapsed ? "opacity-100" : "opacity-0"}`}
            >
              <img
                src={chatwaveLogo}
                alt="Chat app logo"
                className="w-8 h-8 select-none object-contain"
                draggable="false"
              />
            </div>

            {/* 3-dot menu — mobile only */}
            <div className="relative md:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="More options"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-heading)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                <HiEllipsisVertical size={22} />
              </button>

              {mobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-40 w-44 bg-[var(--color-surface)] rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden">
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--color-heading)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      <img
                        src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="profile"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      Profile
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <IoLogOutOutline size={18} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SEARCH — collapses to a single icon button on tablet-collapsed */}
          <div className={tabletCollapsed ? "md:flex md:justify-center md:mt-3" : ""}>
            {tabletCollapsed ? (
              <button
                onClick={expandIfCollapsed}
                aria-label="Search users"
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-[var(--color-body)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                <IoSearchOutline size={18} />
              </button>
            ) : (
              <div className="relative mt-3">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-body)]" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search Users..."
                  className="w-full text-[var(--color-heading)] pl-10 pr-3 py-2 border border-[var(--color-surface-muted)] rounded-4xl bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--bubble-sent-bg)] focus:border-[var(--bubble-sent-bg)] transition-colors"
                />
              </div>
            )}

            {!tabletCollapsed && (
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
            )}
          </div>
        </div>

        {/* CHAT LIST — avatars only when tablet-collapsed */}
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
                  onClick={() => {
                    setSelectedChat(chat);
                    // clicking a chat item (even the already-open one) always
                    // returns to the icon rail on tablet only
                    setTabletCollapsed(isTabletDevice);
                  }}
                  title={tabletCollapsed ? getChatName(chat, user) : undefined}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-3
                    ${tabletCollapsed
                      ? "md:w-11 md:h-11 md:p-0 md:mx-auto md:rounded-full md:justify-center md:gap-0 md:overflow-hidden"
                      : ""}
                    ${isActive ? "bg-[var(--bubble-sent-bg)]" : "hover:bg-purple-100"}`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={chat.isGroupChat ? chat.groupPic : otherUser?.profilePic}
                      size={44}
                      isGroup={chat.isGroupChat}
                    />
                    {tabletCollapsed && unreadCount > 0 && !isActive && (
                      <span className="hidden md:flex absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-semibold items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>

                  <div className={`flex-1 min-w-0 transition-opacity duration-300 ${tabletCollapsed ? "md:hidden md:opacity-0" : "opacity-100"}`}>
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
            !tabletCollapsed && <p className="p-4 text-center text-[var(--color-body)]">No chats yet</p>
          )}
        </div>
      </div>

      {/* FLOATING CREATE-GROUP BUTTON — mobile only */}
      <button
        onClick={() => setGroupOpen(true)}
        aria-label="Create group chat"
        className="md:hidden cursor-pointer fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--color-secondary)] text-white shadow-lg shadow-black/25 flex items-center justify-center active:scale-95 transition-transform"
      >
        <HiUserGroup size={22} />
      </button>

      {/* ===== GROUP CHAT MODAL — top-level so it renders on every breakpoint ===== */}
      {groupOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2.5">
              <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-secondary)]">
                <HiUserGroup size={18} />
              </span>
              Create Group Chat
            </h2>

            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full text-[var(--color-heading)] p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-[var(--color-secondary)] transition-colors"
            />

            <input
              type="text"
              placeholder="Search users to add..."
              value={groupSearch}
              onChange={(e) => handleGroupSearch(e.target.value)}
              className="w-full text-[var(--color-heading)] p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-[var(--color-secondary)] transition-colors"
            />

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
  );
};

export default Sidebar;