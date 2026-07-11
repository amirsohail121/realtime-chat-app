import { useContext, useState, useRef, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { socket } from "../socket/socket";
import api from "../api/api";

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};


const ChatWindow = () => {
  const { selectedChat, messages, setMessages } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    socket.emit("typing", selectedChat._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", selectedChat._id);
    }, 2000);
  };

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageCircle size={48} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Welcome to ChatApp
          </h3>
          <p className="text-gray-400 text-sm">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* TOPBAR */}
      <TopBar />

      {/* MESSAGES AREA */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{
          backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {messages.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="bg-white text-gray-400 text-xs px-4 py-2 rounded-full shadow-sm">
              No messages yet. Say hello! 👋
            </span>
          </div>
        )}

        <div className="space-y-1">
          {messages.map((msg, index) => {
            const showDate =
              index === 0 ||
              new Date(msg.createdAt).toDateString() !==
              new Date(messages[index - 1].createdAt).toDateString();

            const isSender = msg.sender._id === user?._id;

            // Group consecutive messages from same sender
            const isFirstInGroup =
              index === 0 ||
              messages[index - 1].sender._id !== msg.sender._id;

            const isLastInGroup =
              index === messages.length - 1 ||
              messages[index + 1].sender._id !== msg.sender._id;

            return (
              <div key={index}>
                {/* DATE SEPARATOR */}
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                      {getDateLabel(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                )}

                {/* MESSAGE ROW */}
                <div
                  className={`flex items-end gap-2 mb-0.5 ${isSender ? "justify-end" : "justify-start"
                    }`}
                >
                  {/* AVATAR (received messages only, last in group) */}
                  {!isSender && (
                    <div className="w-7 flex-shrink-0">
                      {isLastInGroup ? (
                        <img
                          src={
                            msg.sender.profilePic ||
                            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                          }
                          alt={msg.sender.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* BUBBLE + TIMESTAMP */}
                  <div
                    className={`flex flex-col max-w-xs lg:max-w-md ${isSender ? "items-end" : "items-start"
                      }`}
                  >
                    {/* SENDER NAME in group */}
                    {selectedChat.isGroupChat && !isSender && isFirstInGroup && (
                      <p className="text-xs font-medium text-indigo-500 mb-1 ml-3">
                        {msg.sender.name}
                      </p>
                    )}

                    {/* MESSAGE BUBBLE */}
                    <div
                      className={`px-4 py-2 shadow-sm ${isSender
                        ? `bg-indigo-500 text-white ${isFirstInGroup
                          ? "rounded-t-2xl"
                          : "rounded-t-2xl"
                        } rounded-l-2xl rounded-br-sm`
                        : `bg-white text-gray-800 border border-gray-100 ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-2xl"
                        } rounded-r-2xl rounded-bl-sm`
                        }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>

                    {/* TIMESTAMP (only on last in group) */}
                    {isLastInGroup && (
                      <p className="text-xs text-gray-400 mt-1 mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}


                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {isTyping && (
            <div className="flex items-end gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2.5 max-w-4xl mx-auto">
          <input
            type="text"
            value={messageInput}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-black text-sm focus:outline-none placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!messageInput.trim()}
            className={`p-2 rounded-full transition-all duration-200 ${messageInput.trim()
              ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
              : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;