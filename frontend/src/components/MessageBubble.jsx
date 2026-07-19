import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import { IoPersonCircleOutline } from "react-icons/io5";
import { decryptFile, decryptAesKey, getPrivateKey } from "../utils/crypto";
import MediaViewer from "./MediaViewer";

const MessageBubble = ({ msg, isFirstInGroup, isLastInGroup, decryptContent }) => {
  const { user } = useContext(AuthContext);
  const { selectedChat } = useContext(ChatContext);

  const [decryptedFileUrl, setDecryptedFileUrl] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!msg.fileUrl) return;

    const decryptFileContent = async () => {
      const privateKey = getPrivateKey(user?._id);
      if (!privateKey) return;

      const isSender = msg.sender._id === user?._id;

      // Get correct encrypted AES key
      const encryptedAesKey = isSender
        ? msg.encryptedAesKeyForSender
        : msg.encryptedAesKey;

      if (!encryptedAesKey) return;

      // Decrypt AES key
      const aesKey = decryptAesKey(encryptedAesKey, privateKey);
      if (!aesKey) return;

      
      // Fetch encrypted file
      const response = await fetch(msg.fileUrl);
      const encryptedBuffer = await response.arrayBuffer();

      // ✅ Convert chunk by chunk to avoid stack overflow
      const uint8Array = new Uint8Array(encryptedBuffer);
      let binaryString = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk);
      }
      const encryptedBase64 = btoa(binaryString);

      // Decrypt file
      const mimeType = msg.fileType === "image"
        ? "image/jpeg"
        : msg.fileType === "video"
          ? "video/mp4"
          : "application/octet-stream";

      const url = decryptFile(encryptedBase64, aesKey, msg.iv, mimeType);
      setDecryptedFileUrl(url);
    };

    decryptFileContent();
  }, [msg]);


  const isSender = msg.sender._id === user?._id;

  const getReadStatus = () => {
    if (!isSender) return null;
    if (msg.readBy && msg.readBy.length > 0) return "✓✓";
    return "✓";
  };

  return (
    <div className={`flex items-end gap-2 mb-0.5 ${isSender ? "justify-end" : "justify-start"}`}>

      {/* AVATAR */}
      {!isSender && (
        <div className="w-7 flex-shrink-0">
          {isLastInGroup ? (
            msg.sender.profilePic ? (
              <img
                src={msg.sender.profilePic}
                alt={msg.sender.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                <IoPersonCircleOutline size={20} />
              </div>
            )
          ) : null}
        </div>
      )}

      {/* BUBBLE + TIMESTAMP */}
      <div className={`flex flex-col max-w-xs lg:max-w-md ${isSender ? "items-end" : "items-start"}`}>

        {/* SENDER NAME in group */}
        {selectedChat?.isGroupChat && !isSender && isFirstInGroup && (
          <p className="text-xs font-medium text-teal-600 mb-1 ml-3">
            {msg.sender.name}
          </p>
        )}

        {/* BUBBLE */}
        <div className={`px-4 py-2.5 shadow-sm ${isSender
          ? "bg-teal-500 text-white rounded-2xl rounded-br-sm"
          : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm"
          }`}>
          {/* Only show text if there's content */}
          {msg.content && (
            <p className="text-sm leading-relaxed">{decryptContent(msg)}</p>
          )}
          
          {/* FILE DISPLAY */}
          {msg.fileUrl && (
            <div className="mt-1">
              {msg.fileType === "image" && (
                decryptedFileUrl ? (
                  <img
                    src={decryptedFileUrl}
                    alt="encrypted image"
                    className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition"
                    onClick={() => setViewerOpen(true)}  // ← open viewer instead of browser
                  />
                ) : (
                  <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-500">Decrypting image...</p>
                  </div>
                )
              )}

              {msg.fileType === "video" && (
                decryptedFileUrl ? (
                  <div
                    className="relative w-48 h-32 bg-black rounded-lg cursor-pointer overflow-hidden"
                    onClick={() => setViewerOpen(true)}  // ← open viewer
                  >
                    <video src={decryptedFileUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-3">
                        ▶️
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-500">Decrypting video...</p>
                  </div>
                )
              )}

              {msg.fileType === "file" && (
                <div
                  className="flex items-center gap-2 bg-white bg-opacity-20 p-2 rounded-lg cursor-pointer hover:bg-opacity-30"
                  onClick={() => decryptedFileUrl && setViewerOpen(true)}  // ← open viewer
                >
                  <span>📄</span>
                  <span className="text-sm truncate">{msg.fileName}</span>
                  {!decryptedFileUrl && (
                    <span className="text-xs opacity-70">Decrypting...</span>
                  )}
                </div>
              )}

              {/* MEDIA VIEWER MODAL */}
              {viewerOpen && decryptedFileUrl && (
                <MediaViewer
                  url={decryptedFileUrl}
                  type={msg.fileType}
                  fileName={msg.fileName}
                  onClose={() => setViewerOpen(false)}
                />
              )}
            </div>
          )}
        </div>


        {/* TIMESTAMP + READ RECEIPT */}
        {isLastInGroup && (
          <div className={`flex items-center gap-1 mt-1 mx-1 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
            <p className="text-xs text-slate-400">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {isSender && getReadStatus() && (
              msg.readBy?.length > 0 ? (
                <BsCheck2All size={14} className="text-teal-500" />
              ) : (
                <BsCheck2 size={14} className="text-slate-400" />
              )
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default MessageBubble;