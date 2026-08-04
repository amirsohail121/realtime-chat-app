import { useState, useEffect } from "react";
import { decryptFile, decryptAesKey, getPrivateKey } from "../utils/crypto";

const getMimeTypeFromFileName = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeMap = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    zip: "application/zip",
  };

  return mimeMap[ext] || "application/octet-stream";
};

export const useMessageBubble = (msg, user) => {
  const [decryptedFileUrl, setDecryptedFileUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!msg.fileUrl) return;
    if (decryptedFileUrl) return; // already decrypted — don't redo the work

    const decryptFileContent = async () => {
      const privateKey = getPrivateKey(user?._id);
      if (!privateKey) return;

      const isSender = msg.sender._id === user?._id;

      let encryptedAesKey;

      if (isSender) {
        encryptedAesKey = msg.encryptedAesKeyForSender;
      } else {
        const keyEntry = msg.encryptedAesKeys?.find(
          (k) => k.userId === user?._id || k.userId?._id === user?._id,
        );
        encryptedAesKey = keyEntry?.key;
      }

      if (!encryptedAesKey) {
        console.error("No encrypted AES key found for this user");
        return;
      }

      const aesKeyBytes = decryptAesKey(encryptedAesKey, privateKey);
      if (!aesKeyBytes) return;

      const response = await fetch(msg.fileUrl);
      const encryptedBuffer = await response.arrayBuffer();

      const mimeType =
        msg.fileType === "image"
          ? "image/jpeg"
          : msg.fileType === "video"
            ? "video/mp4"
            : getMimeTypeFromFileName(msg.fileName);

      const url = await decryptFile(
        encryptedBuffer,
        aesKeyBytes,
        msg.iv,
        mimeType,
      );
      setDecryptedFileUrl(url);
    };

    decryptFileContent();
  }, [msg.fileUrl]); // ← only re-run when the actual file changes, not on every parent re-render

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
