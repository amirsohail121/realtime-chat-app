import { useContext, useRef, useMemo, useState, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { socket } from "../socket/socket";
import api from "../api/api";
import {
  encryptMessage,
  decryptMessage,
  getPrivateKey,
  encryptFile,
  encryptAesKey,
} from "../utils/crypto";

const useChatWindow = () => {
  const { selectedChat, messages, setMessages } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing listener
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

  // Decrypt helper
  const decryptContent = (msg) => {
    if (msg.fileUrl && (!msg.content || msg.content === "")) return "";
    const privateKey = getPrivateKey(user?._id);
    if (!privateKey) return "[Private key not found]";
    const isSender = msg.sender._id === user?._id;
    if (isSender && !msg.contentForSender)
      return "[Message sent before encryption]";
    const encryptedContent = isSender ? msg.contentForSender : msg.content;
    if (!encryptedContent) return "";
    return decryptMessage(encryptedContent, privateKey);
  };

  // Memoized messages
  const decryptedMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      decryptedContent: decryptContent(msg),
    }));
  }, [messages]);

  // Send text
  const handleSendMessage = async (content) => {
    const otherUser = selectedChat.users.find((u) => u._id !== user?._id);
    if (!otherUser?.publicKey) return;
    try {
      const encryptedForRecipient = encryptMessage(
        content,
        otherUser.publicKey,
      );
      const encryptedForSender = user?.publicKey
        ? encryptMessage(content, user.publicKey)
        : "";
      const res = await api.post("/messages", {
        chatId: selectedChat._id,
        content: encryptedForRecipient,
        contentForSender: encryptedForSender,
      });
      socket.emit("send_message", { chatId: selectedChat._id, ...res.data });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Send files
  const handleSendFiles = async (files) => {
    const otherUser = selectedChat.users.find((u) => u._id !== user?._id);
    if (!otherUser?.publicKey) return;
    try {
      for (const file of files) {
        const { encryptedBytes, aesKey, iv } = await encryptFile(file);
        const encryptedBlob = new Blob([encryptedBytes]);
        const formData = new FormData();
        formData.append("image", encryptedBlob, file.name + ".enc");
        const uploadRes = await api.post("/upload", formData);
        const fileUrl = uploadRes.data.url;
        const encryptedAesKeyForRecipient = encryptAesKey(
          aesKey,
          otherUser.publicKey,
        );
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
        socket.emit("send_message", { chatId: selectedChat._id, ...res.data });
      }
    } catch (err) {
      console.error("Failed to send files", err);
    }
  };

  // Schedule message
  const handleSchedule = async (content, scheduledAt) => {
    const otherUser = selectedChat.users.find((u) => u._id !== user?._id);
    if (!otherUser?.publicKey) return;
    try {
      const encryptedForRecipient = encryptMessage(
        content,
        otherUser.publicKey,
      );
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

  return {
    selectedChat,
    user,
    isTyping,
    messagesEndRef,
    decryptedMessages,
    handleSendMessage,
    handleSendFiles,
    handleSchedule,
  };
};

export default useChatWindow;
