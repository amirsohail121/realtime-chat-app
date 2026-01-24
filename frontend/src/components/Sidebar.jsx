import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

const Sidebar = () => {
  const { chatList, setSelectedChat } = useContext(ChatContext);

  return (
    <div>
      <h3>Chats</h3>
      {chatList.map((name, index) => (
        <div
          key={index}
          onClick={() => setSelectedChat(name)}
          style={{ cursor: "pointer", padding: "8px" }}
        >
          {name}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;