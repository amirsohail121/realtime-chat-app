import { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { ChatContext } from "../context/ChatContext";

const Chat = () => {
  const { selectedChat } = useContext(ChatContext);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: full width on mobile when nothing selected, hidden once a chat opens */}
      <div className={`${selectedChat ? "hidden md:flex" : "flex"} w-full md:w-auto`}>
        <Sidebar />
      </div>

      {/* ChatWindow: full screen on mobile once a chat is selected, hidden otherwise */}
      <div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
        <ChatWindow />
      </div>
    </div>
  );
};

export default Chat;