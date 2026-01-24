import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

const ChatWindow = () => {
  const { selectedChat, messages } = useContext(ChatContext);

  if (!selectedChat) {
    return <div>Select a chat to start messaging</div>;
  }

  return (
    <div>
      <h3>{selectedChat}</h3>
      {messages[selectedChat]?.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
    </div>
  );
};

export default ChatWindow;