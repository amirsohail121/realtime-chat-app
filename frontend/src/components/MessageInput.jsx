import { useState, useRef, memo } from "react";
import { FiSend, FiClock } from "react-icons/fi";
import { socket } from "../socket/socket";
import ScheduleModal from "./ScheduleModal";

const MessageInput = memo(({ selectedChat, onSendMessage, onSendFiles, onSchedule }) => {
  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    if (!typingTimeout.current) {
      socket.emit("typing", selectedChat._id);
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", selectedChat._id);
      typingTimeout.current = null;
    }, 2000);
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput("");
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles(files);
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

  const handleSendFiles = async () => {
    setUploading(true);
    await onSendFiles(selectedFiles);
    setSelectedFiles([]);
    setFilePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-gray-200">

      {/* FILE PREVIEW */}
      {filePreviews.length > 0 && (
        <div className="mb-2 p-2 bg-gray-100 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative">
                {preview.type === "image" ? (
                  <img src={preview.url} className="w-16 h-16 object-cover rounded" />
                ) : preview.type === "video" ? (
                  <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">🎥</div>
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">📄</div>
                )}
                <p className="text-xs text-gray-500 truncate w-16">{preview.name}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{selectedFiles.length} file(s) selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedFiles([]); setFilePreviews([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendFiles}
                disabled={uploading}
                className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-sm"
              >
                {uploading ? "Encrypting..." : `Send ${selectedFiles.length} file(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2.5 max-w-4xl mx-auto">
        {/* FILE ATTACH */}
        <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-indigo-500 transition">
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

        {/* TEXT INPUT */}
        <input
          type="text"
          value={messageInput}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-black text-sm focus:outline-none placeholder-gray-400"
        />

        {/* SCHEDULE */}
        <button
          onClick={() => setShowScheduleModal(true)}
          className="text-gray-500 hover:text-indigo-500 transition"
          title="Schedule message"
        >
          <FiClock size={18} />
        </button>

        {/* SEND */}
        <button
          onClick={handleSend}
          disabled={!messageInput.trim()}
          className={`p-2 rounded-full transition-all duration-200 ${messageInput.trim()
              ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
              : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
        >
          <FiSend size={16} />
        </button>
      </div>

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <ScheduleModal
          onSchedule={(scheduledAt) => {
            onSchedule(messageInput, scheduledAt);
            setMessageInput("");
            setShowScheduleModal(false);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
});

export default MessageInput;