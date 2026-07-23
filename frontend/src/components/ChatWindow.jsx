import { useContext, useState, useRef, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { FiMessageCircle, FiSend, FiClock } from "react-icons/fi";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import { IoPersonCircleOutline } from "react-icons/io5";
import { socket } from "../socket/socket";
import api from "../api/api";
import MessageBubble from "../components/MessageBubble";
import ScheduleModal from "./ScheduleModal";
import {
  encryptMessage,
  decryptMessage,
  getPrivateKey,
  encryptFile,
  decryptFile,
  encryptAesKey,
  decryptAesKey,
} from "../utils/crypto";

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

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  // schedule msg function
  const sendScheduledMessage = async (scheduledAt) => {
    if (!messageInput.trim() || !selectedChat) return;

    const otherUser = selectedChat.users.find(u => u._id !== user?._id);
    if (!otherUser?.publicKey) return;

    try {
      const encryptedForRecipient = encryptMessage(messageInput, otherUser.publicKey);
      const encryptedForSender = user?.publicKey
        ? encryptMessage(messageInput, user.publicKey)
        : "";

      await api.post("/messages", {
        chatId: selectedChat._id,
        content: encryptedForRecipient,
        contentForSender: encryptedForSender,
        scheduledAt: scheduledAt.toISOString(),
      });

      setMessageInput("");
      setShowScheduleModal(false);

      // Show success toast
      alert(`✅ Message scheduled for ${scheduledAt.toLocaleString()}`);

    } catch (err) {
      console.error("Failed to schedule message", err);
    }
  };

  const decryptContent = (msg) => {
    // If file message with no text content → return empty string
    if (msg.fileUrl && (!msg.content || msg.content === "")) return "";

    const privateKey = getPrivateKey(user?._id);
    if (!privateKey) return "[Private key not found]";

    const isSender = msg.sender._id === user?._id;

    // Old messages before encryption
    if (isSender && !msg.contentForSender) {
      return "[Message sent before encryption]";
    }

    const encryptedContent = isSender
      ? msg.contentForSender
      : msg.content;

    if (!encryptedContent) return "";

    return decryptMessage(encryptedContent, privateKey);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles(files);

    // Generate previews for all files
    const previews = files.map(file => {
      if (file.type.startsWith("image/")) {
        return { url: URL.createObjectURL(file), type: "image", name: file.name };
      } else if (file.type.startsWith("video/")) {
        return { url: null, type: "video", name: file.name };
      } else {
        return { url: null, type: "file", name: file.name };
      }
    });

    setFilePreviews(previews);
  };

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
      const otherUser = selectedChat.users.find(u => u._id !== user?._id);
      if (!otherUser?.publicKey) return;

      const myPublicKey = user?.publicKey;

      const encryptedForRecipient = encryptMessage(messageInput, otherUser.publicKey);
      const encryptedForSender = myPublicKey
        ? encryptMessage(messageInput, myPublicKey)
        : "";

      const res = await api.post("/messages", {
        chatId: selectedChat._id,
        content: encryptedForRecipient,
        contentForSender: encryptedForSender,
      });

      console.log("API response:", res.data);   // ← add

      socket.emit("send_message", {
        chatId: selectedChat._id,
        ...res.data,
      });

      setMessageInput("");

    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const sendFiles = async () => {
    if (!selectedFiles.length || !selectedChat) return;

    const otherUser = selectedChat.users.find(u => u._id !== user?._id);
    if (!otherUser?.publicKey) return;

    setUploading(true);

    try {
      // Send each file one by one
      for (const file of selectedFiles) {
        const { encryptedBytes, aesKey, iv } = await encryptFile(file);

        const encryptedBlob = new Blob([encryptedBytes]);
        const formData = new FormData();
        formData.append("image", encryptedBlob, file.name + ".enc");

        const uploadRes = await api.post("/upload", formData);
        const fileUrl = uploadRes.data.url;

        const encryptedAesKeyForRecipient = encryptAesKey(aesKey, otherUser.publicKey);
        const encryptedAesKeyForSender = user?.publicKey
          ? encryptAesKey(aesKey, user.publicKey)
          : "";

        const fileType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "file";

        const res = await api.post("/messages", {
          chatId: selectedChat._id,
          content: "",
          contentForSender: "",
          fileUrl,
          fileType,
          fileName: file.name,
          encryptedAesKey: encryptedAesKeyForRecipient,
          encryptedAesKeyForSender,
          iv,
        });

        socket.emit("send_message", {
          chatId: selectedChat._id,
          ...res.data,
        });
      }

      // Clear after all files sent
      setSelectedFiles([]);
      setFilePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err) {
      console.error("Failed to send files", err);
    } finally {
      setUploading(false);
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

  const getReadStatus = (msg) => {
    if (msg.sender._id !== user?._id) return null; // only show for sent messages

    if (msg.readBy && msg.readBy.length > 0) {
      return "✓✓"; // blue double tick (read)
    }
    return "✓"; // single tick (sent)
  };

  // Small avatar helper: falls back to a react-icon instead of an
  // external placeholder image when there's no profile picture.
  const Avatar = ({ src, alt, size = 28 }) => {
    const px = `${size}px`;
    return src ? (
      <img
        src={src}
        alt={alt}
        style={{ width: px, height: px }}
        className="rounded-full object-cover"
      />
    ) : (
      <div
        style={{ width: px, height: px }}
        className="rounded-full bg-slate-200 text-slate-400 flex items-center justify-center"
      >
        <IoPersonCircleOutline size={Math.round(size * 1.15)} />
      </div>
    );
  };

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center h-full bg-slate-50">
        <div className="text-center px-6">
          <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FiMessageCircle size={44} className="text-teal-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2 tracking-tight">
            Welcome to ChatApp
          </h3>
          <p className="text-slate-400 text-sm">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50">
      {/* TOPBAR */}
      <TopBar />

      {/* MESSAGES AREA */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {messages.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="bg-white text-slate-400 text-xs px-4 py-2 rounded-full shadow-sm border border-slate-100">
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

            const isFirstInGroup = index === 0 || messages[index - 1].sender._id !== msg.sender._id;
            const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender._id !== msg.sender._id;

            return (
              <div key={index}>
                {showDate && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                      {getDateLabel(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  decryptContent={(msg) => decryptContent(msg)}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {isTyping && (
            <div className="flex items-end gap-2 mb-2">
              <Avatar size={28} />
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">

        {/* FILE PREVIEW */}
        {filePreviews.length > 0 && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg">
            <div className="flex flex-wrap gap-2 mb-2">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  {preview.type === "image" ? (
                    <img
                      src={preview.url}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : preview.type === "video" ? (
                    <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                      🎥
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                      📄
                        </div>
                  )}
                  <p className="text-xs text-gray-500 truncate w-16">{preview.name}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFiles.length} file(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setFilePreviews([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={sendFiles}
                  disabled={uploading}
                  className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-sm"
                >
                  {uploading ? "Sending..." : `Send ${selectedFiles.length} file(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2.5 max-w-4xl mx-auto">
          {/* FILE ATTACH BUTTON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-indigo-500 transition"
          >
            📎
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
            multiple
            className="hidden"
          />

          <input
            type="text"
            value={messageInput}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-black text-sm focus:outline-none placeholder-gray-400"
          />
          {/* //clock */}
          <button
            onClick={() => setShowScheduleModal(true)}
            className="text-gray-500 hover:text-indigo-500 transition"
            title="Schedule message"
          >
            <FiClock size={18} />
          </button>
          {/* sendMsg */}
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
        {/* Schedule Modal */}
        {showScheduleModal && (
          <ScheduleModal
            onSchedule={sendScheduledMessage}
            onClose={() => setShowScheduleModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;