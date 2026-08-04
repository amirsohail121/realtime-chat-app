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
  const { selectedChat, messages, setMessages, setChatList } =
    useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const moveChatToTop = (latestMessage) => {
    setChatList((prev) => {
      const index = prev.findIndex((chat) => chat._id === selectedChat?._id);
      if (index === -1) return prev;

      const updated = {
        ...prev[index],
        latestMessage,
      };

      return [updated, ...prev.filter((_, i) => i !== index)];
    });
  };

  // Always holds the latest selectedChat._id, readable inside stable socket listeners
  const selectedChatRef = useRef(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat?._id || null;
    // Reset typing indicator when switching chats so a stale
    // "typing..." from the previous chat doesn't linger
    setIsTyping(false);
  }, [selectedChat]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing listener
  useEffect(() => {
    socket.on("typing", ({ chatId }) => {
      if (chatId === selectedChatRef.current) setIsTyping(true);
    });
    socket.on("stop_typing", ({ chatId }) => {
      if (chatId === selectedChatRef.current) setIsTyping(false);
    });
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

    let encryptedContent = "";
    if (isSender) {
      encryptedContent = msg.contentForSender;
    } else {
      const recipientEntry = msg.contentForUsers?.find(
        (entry) =>
          entry.userId === user?._id || entry.userId?._id === user?._id,
      );
      encryptedContent = recipientEntry?.content || msg.content;
    }

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
    try {
      const otherUsers = selectedChat.users.filter((u) => u._id !== user?._id);
      if (otherUsers.length === 0) return;

      // Encrypt content separately for every recipient (works for 1-on-1 and groups)
      const contentForUsers = otherUsers
        .filter((u) => u.publicKey)
        .map((u) => ({
          userId: u._id,
          content: encryptMessage(content, u.publicKey),
        }));

      const encryptedForSender = user?.publicKey
        ? encryptMessage(content, user.publicKey)
        : "";

      const res = await api.post("/messages", {
        chatId: selectedChat._id,
        content: contentForUsers[0]?.content || "",
        contentForUsers, // ← array, replaces single `content`
        contentForSender: encryptedForSender,
      });
      setMessages((prev) =>
        prev.some((msg) => msg._id === res.data._id)
          ? prev
          : [...prev, res.data],
      );
      moveChatToTop(res.data);
      socket.emit("send_message", { chatId: selectedChat._id, ...res.data });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Send files
  // Send files
  const handleSendFiles = async (files) => {
    try {
      for (const file of files) {
        const { encryptedBytes, aesKey, iv } = await encryptFile(file);
        const encryptedBlob = new Blob([encryptedBytes]);
        const formData = new FormData();
        formData.append("file", encryptedBlob, file.name + ".enc");

        const uploadRes = await api.post("/upload/chat-file", formData);
        const fileUrl = uploadRes.data.url;

        // Encrypt AES key for EACH member in the chat
        const encryptedAesKeys = selectedChat.users
          .filter((u) => u._id !== user?._id) // exclude sender
          .map((member) => ({
            userId: member._id,
            key: encryptAesKey(aesKey, member.publicKey),
          }));

        // Encrypt for sender too
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
          encryptedAesKeys, // ← array for all members
          encryptedAesKeyForSender, // ← for sender
          iv,
        });

        setMessages((prev) =>
          prev.some((msg) => msg._id === res.data._id)
            ? prev
            : [...prev, res.data],
        );
        moveChatToTop(res.data);

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
};;;

export default useChatWindow;