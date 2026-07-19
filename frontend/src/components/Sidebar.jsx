import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { BsFillChatTextFill } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { decryptPreview } from "../utils/crypto";
import {
  IoLogOutOutline,
  IoCloseOutline,
  IoPersonCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";

const Sidebar = () => {
  const { chatList, setChatList, selectedChat, setSelectedChat } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  //groupChat
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);

  //groupchat function
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (groupMembers.length < 2) {
      alert("Add at least 2 members!");
      return;
    }

    try {
      const res = await api.post("/chats/group", {
        name: groupName,
        users: groupMembers.map(m => m._id),
      });
      setChatList(prev => [res.data, ...prev]);
      setSelectedChat(res.data);
      setGroupOpen(false);
      setGroupName("");
      setGroupMembers([]);
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  // groupchatSearch
  const handleGroupSearch = async (query) => {
    setGroupSearch(query);
    if (!query.trim()) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${query}`);
      setGroupSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };


  //Group Name
  const getChatName = (chat, currentUser) => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users.find(u => u._id !== currentUser._id);
    return otherUser?.name || "Unknown";
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/users/search?query=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const res = await api.post("/chats", { userId });
      setChatList(prev => {
        const exists = prev.find(c => c._id === res.data._id);
        if (exists) return prev;
        return [res.data, ...prev];
      });
      setSelectedChat(res.data);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };


  const Avatar = ({ src, size = 44, isGroup = false }) => {
    const px = `${size}px`;
    if (src) {
      return (
        <img
          src={src}
          alt=""
          style={{ width: px, height: px }}
          className="rounded-full object-cover flex-shrink-0"
        />
      );
    }
    return (
      <div
        style={{ width: px, height: px }}
        className={`rounded-full flex items-center justify-center flex-shrink-0 ${isGroup ? "bg-teal-100 text-teal-500" : "bg-slate-200 text-slate-400"
          }`}
      >
        {isGroup ? (
          <HiUserGroup size={Math.round(size * 0.42)} />
        ) : (
          <IoPersonCircleOutline size={Math.round(size * 1.15)} />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row h-screen bg-white">

      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-20 px-4 py-6 flex flex-col items-center gap-8 bg-teal-600 border-r border-teal-700">

        {/* TOP ICONS */}
        <div className="flex flex-col gap-4">
          <BsFillChatTextFill
            size={20}
            className="w-11 h-11 p-2.5 rounded-2xl bg-white text-teal-600 shadow-lg shadow-black/20 cursor-pointer"
          />
          <HiUserGroup
            onClick={() => setGroupOpen(!groupOpen)}
            size={20}
            className="w-11 h-11 p-2.5 rounded-2xl text-white cursor-pointer hover:text-teal-600 hover:bg-white transition-colors duration-200"
          />
        </div>

        {/* PROFILE + SETTINGS */}

        <div className="mt-auto flex flex-col items-center gap-4">
          <img
            onClick={() => navigate("/profile")}
            src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="profile"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-teal-600 ring-teal-400 cursor-pointer hover:ring-white hover:shadow-lg hover:shadow-white/20 transition-all duration-200"
          />
          {/* <Link
            to="/settings"
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:text-teal-600 hover:bg-white transition-colors duration-200"
          >
            <IoMdSettings className="text-white hover:text-teal-600" size={30} />
          </Link> */}

          {/* LOGOUT BUTTON */}
          <IoLogOutOutline
            onClick={logout}
            size={30}
            title="Logout"
            className="w-11 h-11 p-2.5 rounded-2xl text-white cursor-pointer hover:text-rose-500 hover:bg-rose-100/20 transition-colors duration-200"
          />
        </div>
        {/* GROUP CHAT MODAL */}
        {groupOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2.5">
                <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-50 text-teal-600">
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
                className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />

              {/* Search Users */}
              <input
                type="text"
                placeholder="Search users to add..."
                value={groupSearch}
                onChange={(e) => handleGroupSearch(e.target.value)}
                className="w-full text-slate-800 p-2.5 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <Avatar src={u.profilePic} size={32} />
                    <p className="text-sm text-slate-800">{u.name}</p>
                  </div>
                ))}
              </div>

              {/* Selected Members */}
              {groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {groupMembers.map((m) => (
                    <span
                      key={m._id}
                      className="flex items-center gap-1.5 bg-teal-50 text-teal-700 pl-3 pr-2 py-1 rounded-full text-sm"
                    >
                      {m.name}
                      <button
                        onClick={() => setGroupMembers(prev => prev.filter(x => x._id !== m._id))}
                        className="w-4 h-4 flex items-center justify-center rounded-full text-teal-500 hover:bg-teal-100 hover:text-teal-700"
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
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Create Group
                </button>
                <button
                  onClick={() => {
                    setGroupOpen(false);
                    setGroupName("");
                    setGroupMembers([]);
                    setGroupSearch("");
                    setGroupSearchResults([]);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition-colors"
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
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Chats
          </h2>

          {/* SEARCH PANEL (always visible) */}
          <div className="relative">
            <IoSearchOutline className="relative left-3 top-10 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Users..."
              className="w-full text-slate-800 pl-10 pr-3 py-2 border border-slate-200 rounded-4xl bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              autoFocus
            />

            {/* SEARCH RESULTS */}
            <div className="mt-2 max-h-60 overflow-y-auto">
              {searching && (
                <p className="text-center text-slate-400 text-sm py-2">Searching...</p>
              )}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-slate-400 text-sm py-2">No users found</p>
              )}
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors"
                >
                  <Avatar src={u.profilePic} size={40} />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )

          {/* CHAT LIST */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {chatList.length > 0 ? (
              chatList.map((chat, index) => {
                const otherUser = chat.isGroupChat
                  ? null
                  : chat.users.find(u => u._id !== user?._id);
                const isActive = selectedChat?._id === chat._id;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-l-2 flex items-center gap-3 ${isActive
                      ? "bg-teal-500 border-teal-500 shadow-md shadow-teal-500/25"
                      : "border-transparent hover:bg-slate-50 hover:border-teal-500 hover:shadow-sm hover:-translate-y-0.5"
                      }`}
                  >
                    {/* AVATAR */}
                    <div className={isActive ? "rounded-full ring-2 ring-white/60" : ""}>
                      <Avatar
                        src={chat.isGroupChat ? chat.groupPic : otherUser?.profilePic}
                        size={44}
                        isGroup={chat.isGroupChat}
                      />
                    </div>

                    {/* NAME + LAST MESSAGE */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isActive ? "text-white" : "text-slate-800"}`}>
                        {getChatName(chat, user)}
                      </p>
                      <p className={`text-xs truncate ${isActive ? "text-teal-50" : "text-slate-400"}`}>
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
              <p className="p-4 text-center text-slate-400">No chats yet</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sidebar;





