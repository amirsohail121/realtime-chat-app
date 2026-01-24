import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

const Topbar = () => {
  const { selectedChat } = useContext(ChatContext);

  return (
    <div className="h-16  bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm sticky top-0 z-10">
      
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
          {selectedChat ? selectedChat[0] : "?"}
        </div>

        {/* Chat Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            {selectedChat || "No Chat Selected"}
          </h2>
          <p className="text-xs text-gray-500">
            {selectedChat ? "Online" : "Select a chat"}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-700 transition">
          🔍
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition">
          ⋮
        </button>
      </div>
    </div>
  );
};

export default Topbar;