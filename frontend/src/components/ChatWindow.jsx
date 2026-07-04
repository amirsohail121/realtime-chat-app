import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { socket } from "../socket/socket";
import api from "../api/api";

const ChatWindow = () => {
  const { selectedChat, messages, setMessages } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [messageInput, setMessageInput] = useState("");

  // ❌ NO socket.on here — ChatContext handles receive_message!

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      const res = await api.post("/messages", {
        chatId: selectedChat._id,
        content: messageInput,
      });

      socket.emit("send_message", {
        chatId: selectedChat._id,
        ...res.data,
      });

     
      setMessageInput("");

    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex w-215 flex-1 items-center justify-center h-full">
        <div className="text-center">
          <FiMessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
          <p className="text-3xl text-center">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-215 flex-1 flex flex-col h-screen bg-gray-50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender._id === user?._id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender._id === user?._id
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-black"
                }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full max-w-4xl mx-auto p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 text-black px-4 py-2 border rounded-lg"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={sendMessage}
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;