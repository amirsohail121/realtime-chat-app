import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
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