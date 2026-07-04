import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { BsFillChatTextFill } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { IoLogOutOutline } from "react-icons/io5";

const Sidebar = () => {
  const { chatList, setChatList, setSelectedChat } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);


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

  return (
    <div className="flex flex-row h-screen bg-white">

      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-20 px-4 py-6 flex flex-col items-center gap-8 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">

        {/* TOP ICONS */}
        <div className="flex flex-col gap-8">
          <BsFillChatTextFill className="text-green-500 text-3xl cursor-pointer hover:text-green-400 transition-colors duration-200" />
          <HiUserGroup className="text-green-500 text-3xl cursor-pointer hover:text-green-400 transition-colors duration-200" />
        </div>

        {/* PROFILE + SETTINGS */}
        <div className="mt-auto flex flex-col items-center gap-6">
          <img
            onClick={() => navigate("/profile")}
            src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-green-500 cursor-pointer hover:border-green-400 transition-colors duration-200"
          />
          <Link to="/settings">
            <IoMdSettings className="text-3xl text-green-500 cursor-pointer hover:text-green-400 transition-colors duration-200" />
          </Link>


          {/* LOGOUT BUTTON */}
          <IoLogOutOutline
            onClick={logout}
            className="text-3xl text-red-400 cursor-pointer hover:text-red-300 transition-colors duration-200"
            title="Logout"
          />
        </div>
      </div>

      {/* ===== CHAT LIST AREA ===== */}
      <div className="flex-1 flex flex-col w-106 border-r border-gray-300">

        {/* HEADER */}
        <div className="bg-linear-to-r from-[#372aac] to-[#4c3fb3] text-white shadow-md flex items-center justify-between px-6">
          <h2 className="text-3xl py-3.5 font-bold">Chats</h2>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-white text-2xl hover:text-green-300 transition"
            title="New Chat"
          >
            ✏️
          </button>
        </div>

        {/* SEARCH PANEL */}
        {searchOpen && (
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full text-black p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />

            {/* SEARCH RESULTS */}
            <div className="mt-2 max-h-60 overflow-y-auto">
              {searching && (
                <p className="text-center text-gray-400 text-sm py-2">Searching...</p>
              )}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-gray-400 text-sm py-2">No users found</p>
              )}
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <img
                    src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                    <p className="text-gray-500 text-xs">{u.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT LIST */}
        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatList.length > 0 ? (
            chatList.map((chat, index) => {
              const otherUser = chat.isGroupChat
                ? null
                : chat.users.find(u => u._id !== user?._id);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedChat(chat)}
                  className="mx-2 p-3 rounded-lg cursor-pointer hover:bg-purple-50 transition-all duration-200 border-l-4 border-transparent hover:border-green-500 flex items-center gap-3"
                >
                  {/* AVATAR */}
                  <img
                    src={otherUser?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={otherUser?.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />

                  {/* NAME + LAST MESSAGE */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{getChatName(chat, user)}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {chat.latestMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-4 text-center text-gray-400">No chats yet</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Sidebar;