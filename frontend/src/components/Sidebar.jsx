import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { BsFillChatTextFill } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const { chatList, setSelectedChat } = useContext(ChatContext);
  const navigate = useNavigate();

  // 🔹 Temporary user data (later from backend/context)
  const user = {
    name: "Amir Sohail",
    photo: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  };

  return (
    <div className="flex flex-row h-screen">

      {/* ===== LEFT SIDEBAR ===== */}
      <div className="basis-1/3 px-4 py-6 flex flex-col bg-gray-50 border-r">

        {/* TOP ICONS */}
        <div className="flex flex-col gap-6">
          <BsFillChatTextFill className="text-green-500 text-3xl cursor-pointer hover:text-green-600 transition" />
          <HiUserGroup className="text-green-500 text-3xl cursor-pointer hover:text-green-600 transition" />
        </div>

        {/* PROFILE SECTION (BOTTOM) */}
        <div className="mt-auto">
          <div
            onClick={() => navigate("/profile")}
            className=" items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition"
          >
            <img
              src={user.photo}
              alt="profile"
              className="w-12 h-12 rounded-full object-cover border"
            />

            <div>
              <p className="font-semibold text-sm text-gray-800">{user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHAT LIST AREA ===== */}
      <div className="basis-2/3 flex flex-col">

        {/* HEADER */}
        <div className="bg-[#372aac] text-white">
          <h2 className="text-3xl py-3 font-semibold px-3">Chat</h2>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          className="my-5 p-2 mx-3 border rounded"
          placeholder="Search chats..."
        />

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatList.length > 0 ? (
            chatList.map((chat, index) => (
              <div
                key={index}
                onClick={() => setSelectedChat(chat)}
                className="p-4 cursor-pointer hover:bg-gray-100 transition"
              >
                {chat?.name}
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-400">No chats yet</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
