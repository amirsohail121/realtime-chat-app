import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { BsFillChatTextFill } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { chatList, setSelectedChat } = useContext(ChatContext);
  const navigate = useNavigate();

  
  const { user } = useContext(AuthContext);


  return (
    <div className="flex flex-row h-screen bg-white">

      {/* ===== LEFT SIDEBAR ===== */}
      <div className="w-20 px-4 py-6 flex flex-col items-center gap-8 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">

        {/* TOP ICONS */}
        <div className="flex flex-col gap-8">
          <BsFillChatTextFill className="text-green-500 text-3xl cursor-pointer hover:text-green-400 transition-colors duration-200" />
          <HiUserGroup className="text-green-500 text-3xl cursor-pointer hover:text-green-400 transition-colors duration-200" />
        </div>

        {/* PROFILE SECTION (BOTTOM) and setting */}
        <div className="mt-auto flex flex-col items-center gap-6">
          <Link to="/settings">
            <IoMdSettings className="text-3xl text-green-500 cursor-pointer hover:text-green-400 transition-colors duration-200" />
          </Link>
          <img
            onClick={() => navigate("/profile")}
            src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-green-500 cursor-pointer hover:border-green-400 transition-colors duration-200"
          />
        </div>
      </div>

      {/* ===== CHAT LIST AREA ===== */}
      <div className="flex-1 flex flex-col w-106 border-r border-gray-300">

        {/* HEADER */}
        <div className="bg-linear-to-r from-[#372aac] to-[#4c3fb3] text-white shadow-md">
          <h2 className="text-3xl py-3.5 font-bold px-6">Chats</h2>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          className="m-4 p-3 mx-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          placeholder="Search chats..."
        />

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatList.length > 0 ? (
            chatList.map((chat, index) => (
              <div
                key={index}
                onClick={() => setSelectedChat(chat)}
                className="mx-2 p-4 rounded-lg cursor-pointer hover:bg-linear-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 border-l-4 border-transparent hover:border-green-500"
              >
                <p className="font-medium text-gray-800">{chat?.name}</p>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-gray-400">No chats yet</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
