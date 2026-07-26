import { useContext, useRef, useMemo, useState, useEffect, memo } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import { FiMessageCircle } from "react-icons/fi";
import { socket } from "../socket/socket";
import api from "../api/api";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import {
  encryptMessage,
  decryptMessage,
  getPrivateKey,
  encryptFile,
  encryptAesKey,
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing indicator listener
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

  // Decrypt content helper
  const decryptContent = (msg) => {
    if (msg.fileUrl && (!msg.content || msg.content === "")) return "";
    const privateKey = getPrivateKey(user?._id);
    if (!privateKey) return "[Private key not found]";
    const isSender = msg.sender._id === user?._id;
    if (isSender && !msg.contentForSender) return "[Message sent before encryption]";
    const encryptedContent = isSender ? msg.contentForSender : msg.content;
    if (!encryptedContent) return "";
    return decryptMessage(encryptedContent, privateKey);
  };

  // Memoize decrypted messages
  const decryptedMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      decryptedContent: decryptContent(msg),
    }));
  }, [messages]);

  // Send text message
  const handleSendMessage = async (content) => {
    const otherUser = selectedChat.users.find(u => u._id !== user?._id);
    if (!otherUser?.publicKey) return;

    try {
      const encryptedForRecipient = encryptMessage(content, otherUser.publicKey);
      const encryptedForSender = user?.publicKey
        ? encryptMessage(content, user.publicKey)
        : "";

      const res = await api.post("/messages", {
        chatId: selectedChat._id,
        content: encryptedForRecipient,
        contentForSender: encryptedForSender,
      });

      socket.emit("send_message", {
        chatId: selectedChat._id,
        ...res.data,
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Send files
  const handleSendFiles = async (files) => {
    const otherUser = selectedChat.users.find(u => u._id !== user?._id);
    if (!otherUser?.publicKey) return;

    try {
      for (const file of files) {
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
    } catch (err) {
      console.error("Failed to send files", err);
    }
  };

  // Schedule message
  const handleSchedule = async (content, scheduledAt) => {
    const otherUser = selectedChat.users.find(u => u._id !== user?._id);
    if (!otherUser?.publicKey) return;

    try {
      const encryptedForRecipient = encryptMessage(content, otherUser.publicKey);
      const encryptedForSender = user?.publicKey
        ? encryptMessage(content, user.publicKey)
        : "";

      await api.post("/messages", {
        chatId: selectedChat._id,
        content: encryptedForRecipient,
        contentForSender: encryptedForSender,
        scheduledAt: scheduledAt.toISOString(),
      });

      alert(`✅ Message scheduled for ${scheduledAt.toLocaleString()}`);
    } catch (err) {
      console.error("Failed to schedule message", err);
    }
  };

  // No chat selected
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
      <TopBar />

      {/* MESSAGES AREA */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{
          backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {decryptedMessages.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="bg-white text-gray-400 text-xs px-4 py-2 rounded-full shadow-sm">
              No messages yet. Say hello! 👋
            </span>
          </div>
        )}

        <div className="space-y-1">
          {decryptedMessages.map((msg, index) => {
            const showDate =
              index === 0 ||
              new Date(msg.createdAt).toDateString() !==
              new Date(decryptedMessages[index - 1].createdAt).toDateString();

            const isFirstInGroup =
              index === 0 ||
              decryptedMessages[index - 1].sender._id !== msg.sender._id;

            const isLastInGroup =
              index === decryptedMessages.length - 1 ||
              decryptedMessages[index + 1].sender._id !== msg.sender._id;

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
                  decryptContent={() => msg.decryptedContent}
                />
              </div>
            );
          })}

          {/* TYPING INDICATOR */}
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <MessageInput
        selectedChat={selectedChat}
        onSendMessage={handleSendMessage}
        onSendFiles={handleSendFiles}
        onSchedule={handleSchedule}
      />
    </div>
  );
};

export default memo(ChatWindow);