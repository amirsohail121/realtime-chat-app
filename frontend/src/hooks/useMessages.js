import { useState, useEffect } from "react";
import { decryptFile, decryptAesKey, getPrivateKey } from "../utils/crypto";


export const useMessageBubble = (msg, user) => {
  const [decryptedFileUrl, setDecryptedFileUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!msg.fileUrl) return;

    let cancelled = false;

    const decryptFileContent = async () => {
      const privateKey = getPrivateKey(user?._id);
      if (!privateKey) return;

      const isSender = msg.sender._id === user?._id;
      const encryptedAesKey = isSender
        ? msg.encryptedAesKeyForSender
        : msg.encryptedAesKey;

      if (!encryptedAesKey) return;

      const aesKeyBytes = decryptAesKey(encryptedAesKey, privateKey);
      if (!aesKeyBytes) return;

      const response = await fetch(msg.fileUrl);
      const encryptedBuffer = await response.arrayBuffer();

      const mimeType =
        msg.fileType === "image"
          ? "image/jpeg"
          : msg.fileType === "video"
            ? "video/mp4"
            : "application/octet-stream";

      const url = await decryptFile(
        encryptedBuffer,
        aesKeyBytes,
        msg.iv,
        mimeType,
      );
      if (!cancelled) setDecryptedFileUrl(url);
    };

    decryptFileContent();

    return () => {
      cancelled = true;
    };
  }, [msg, user]);

  const isSender = msg.sender._id === user?._id;

  const getReadStatus = () => {
    if (!isSender) return null;
    return msg.readBy && msg.readBy.length > 0 ? "read" : "sent";
  };

  const isScheduled = msg.status === "scheduled";

  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedScheduledAt = isScheduled
    ? new Date(msg.scheduledAt).toLocaleString()
    : null;

  return {
    decryptedFileUrl,
    viewerOpen,
    setViewerOpen,
    isSender,
    getReadStatus,
    isScheduled,
    formattedTime,
    formattedScheduledAt,
  };
};
