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


    <div className="flex flex-row">
      {/* Sidebar section */}
      <div className="">
          <Sidebar />
        </div>

      <div className="">
          <ChatWindow />
        </div>
      </div>

  );
};

export default Chat;