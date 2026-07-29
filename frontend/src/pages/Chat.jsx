import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
  return (


    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Chat Window — fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </div>

  );
};

export default Chat;