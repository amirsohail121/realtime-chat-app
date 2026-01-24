import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Section */}
      <Topbar />

      {/* Bottom Section */}
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: "25%", borderRight: "1px solid #ddd" }}>
          <Sidebar />
        </div>

        <div style={{ flex: 1 }}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Chat;