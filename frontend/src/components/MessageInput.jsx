import { useState, useRef, memo, useEffect } from "react";
import { FiSend, FiClock, FiX, FiEdit2, FiPaperclip, FiFile, FiFilm } from "react-icons/fi";
import { socket } from "../socket/socket";
import ScheduleModal from "./ScheduleModal";
import ImageEditorModal from "./ImageEditorModal";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";

const MessageInput = memo(({ selectedChat, onSendMessage, onSendFiles, onSchedule }) => {
  const [messageInput, setMessageInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // emoji state
  const emojiPickerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const previews = files.map((file) => {
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

  const removeFileAt = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== EDIT: swap the file/preview at editingIndex with the cropped result =====
  const handleEditSave = (blob, previewUrl) => {
    const originalName = selectedFiles[editingIndex]?.name || "photo.jpg";
    const editedFile = new File([blob], originalName, { type: "image/jpeg" });

    setSelectedFiles((prev) => prev.map((f, i) => (i === editingIndex ? editedFile : f)));
    setFilePreviews((prev) =>
      prev.map((p, i) => (i === editingIndex ? { ...p, url: previewUrl } : p))
    );
    setEditingIndex(null);
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
    <div className="px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-surface-muted)]">

      {/* IMAGE EDITOR MODAL */}
      {editingIndex !== null && (
        <ImageEditorModal
          imageSrc={filePreviews[editingIndex]?.url}
          aspect={4 / 3}
          shape="rect"
          outputSize={1080}
          onCancel={() => setEditingIndex(null)}
          onSave={handleEditSave}
        />
      )}

      {/* FILE PREVIEW */}
      {filePreviews.length > 0 && (
        <div className="mb-3 p-3 bg-[var(--color-surface-tint)] rounded-2xl border border-[var(--color-surface-muted)]">
          <div className="flex flex-wrap gap-3 mb-3">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface)] flex items-center justify-center">
                  {preview.type === "image" ? (
                    <img src={preview.url} className="w-full h-full object-cover" alt={preview.name} />
                  ) : preview.type === "video" ? (
                    <FiFilm size={20} className="text-[var(--color-secondary)]" />
                  ) : (
                    <FiFile size={20} className="text-[var(--color-secondary)]" />
                  )}
                </div>

                {/* EDIT (image only) */}
                {preview.type === "image" && (
                  <button
                    onClick={() => setEditingIndex(index)}
                    title="Edit image"
                    className="absolute inset-0 m-auto w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiEdit2 size={13} />
                  </button>
                )}

                {/* REMOVE */}
                <button
                  onClick={() => removeFileAt(index)}
                  title="Remove"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-heading)] text-white shadow-md hover:bg-red-500 transition-colors"
                >
                  <FiX size={11} />
                </button>

                <p className="text-[10px] text-[var(--color-body)] truncate w-16 mt-1 text-center">
                  {preview.name}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-body)]">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setFilePreviews([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-[var(--color-body)] hover:text-red-500 text-sm font-medium transition-colors px-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSendFiles}
                disabled={uploading}
                className="px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-60 transition-transform hover:scale-[1.03] shadow-sm cursor-pointer disabled:cursor-not-allowed"
                style={{ background: "var(--bubble-sent-bg)", color: "var(--color-heading)" }}
              >
                {uploading && (
                  <div className="w-3.5 h-3.5 border-2 border-[var(--color-heading)]/30 border-t-[var(--color-heading)] rounded-full animate-spin" />
                )}
                {uploading ? "Sending..." : `Send ${selectedFiles.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex items-center gap-2 bg-[var(--color-surface-tint)] rounded-full px-3 py-2 max-w-4xl mx-auto border border-transparent focus-within:border-[var(--color-secondary-light)] transition-colors">
        {/* FILE ATTACH */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-body)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
          title="Attach files"
        >
          <FiPaperclip size={18} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          multiple
          className="hidden"
        />

        {/* EMOJI PICKER */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50 shadow-xl rounded-xl overflow-hidden">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={300}
              height={400}
              emojiStyle={EmojiStyle.NATIVE}
            />
          </div>
        )}

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emoji"
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface)] cursor-pointer"
        >
          <BsEmojiSmile
            size={18}
            style={{ color: showEmojiPicker ? "var(--color-secondary)" : "var(--color-body)" }}
          />
        </button>

        {/* TEXT INPUT */}
        <input
          type="text"
          value={messageInput}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-[var(--color-heading)] text-sm focus:outline-none placeholder:text-[var(--color-body)]"
        />

        {/* SCHEDULE */}
        <button
          onClick={() => setShowScheduleModal(true)}
          title="Schedule message"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-body)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
        >
          <FiClock size={18} />
        </button>

        {/* SEND */}
        <button
          onClick={handleSend}
          disabled={!messageInput.trim()}
          title="Send"
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${messageInput.trim()
            ? "shadow-md hover:scale-105 cursor-pointer"
            : "bg-[var(--color-surface-muted)] text-[var(--color-body)] cursor-not-allowed"
            }`}
          style={
            messageInput.trim()
              ? { background: "var(--bubble-sent-bg)", color: "var(--color-heading)" }
              : undefined
          }
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