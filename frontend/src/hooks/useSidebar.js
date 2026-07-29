import { useState, useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

const useSidebar = () => {
  const { chatList, setChatList, setSelectedChat } = useContext(ChatContext);
  const { user, logout } = useContext(AuthContext);

  // ─── Search State ───
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ─── Group State ───
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);

  // ─── Helper ───
  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser?.name || "Unknown";
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) return chat.groupPic || null;
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    return otherUser?.profilePic || null;
  };

  // ─── User Search ───
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

  // ─── Start Chat ───
  const handleStartChat = async (userId) => {
    try {
      const res = await api.post("/chats", { userId });
      setChatList((prev) => {
        const exists = prev.find((c) => c._id === res.data._id);
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

  // ─── Group Search ───
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
      console.error("Group search failed", err);
    }
  };

  // ─── Create Group ───
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (groupMembers.length < 2) {
      alert("Add at least 2 members!");
      return;
    }
    try {
      const res = await api.post("/chats/group", {
        name: groupName,
        users: groupMembers.map((m) => m._id),
      });
      setChatList((prev) => [res.data, ...prev]);
      setSelectedChat(res.data);
      setGroupOpen(false);
      setGroupName("");
      setGroupMembers([]);
      setGroupSearch("");
      setGroupSearchResults([]);
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  return {
    // Context
    user,
    logout,
    chatList,
    setSelectedChat,
    // Search
    searchOpen,
    setSearchOpen,
    searchQuery,
    searchResults,
    searching,
    handleSearch,
    handleStartChat,
    // Group
    groupOpen,
    setGroupOpen,
    groupName,
    setGroupName,
    groupMembers,
    setGroupMembers,
    groupSearch,
    groupSearchResults,
    handleGroupSearch,
    handleCreateGroup,
    // Helpers
    getChatName,
    getChatAvatar,
  };
};

export default useSidebar;
