import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../socket/socket"
import { useEffect } from "react";

const Chat = () => {

  useEffect(() => {
    // connect socket when chat page loads
    socket.connect();
    console.log("Socket connected");

    // disconnect when leaving page
    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, []);
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