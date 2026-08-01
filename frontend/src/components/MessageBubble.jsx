import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import { IoPersonCircleOutline } from "react-icons/io5";
import { FiClock, FiFileText, FiPlay } from "react-icons/fi";
import { useMessageBubble } from "../hooks/useMessages";
import MediaViewer from "./MediaViewer";
import api from "../api/api";

// Pulls "PDF" / "DOCX" / "XLSX" etc. out of a filename for the file-card subtitle
const getExtLabel = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
};

const getExt = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const MessageBubble = ({ msg, isFirstInGroup, isLastInGroup, decryptContent }) => {
  const { user } = useContext(AuthContext);
  const { selectedChat } = useContext(ChatContext);

  const {
    decryptedFileUrl,
    viewerOpen,
    setViewerOpen,
    isSender,
    getReadStatus,
    isScheduled,
    formattedTime,
    formattedScheduledAt,
  } = useMessageBubble(msg, user);

  const readStatus = getReadStatus();
  const isMedia = msg.fileType === "image" || msg.fileType === "video";
  const fileExt = getExt(msg.fileName);
  const [isPreparingOpenLink, setIsPreparingOpenLink] = useState(false);

  const handleFileCardClick = async () => {
    if (!decryptedFileUrl) return;
    if (isPreparingOpenLink) return;

    const officeProtocols = {
      doc: "ms-word:ofe|u|",
      docx: "ms-word:ofe|u|",
      ppt: "ms-powerpoint:ofe|u|",
      pptx: "ms-powerpoint:ofe|u|",
      xls: "ms-excel:ofe|u|",
      xlsx: "ms-excel:ofe|u|",
    };

    const protocol = officeProtocols[fileExt];
    if (protocol) {
      try {
        setIsPreparingOpenLink(true);
        const fileResponse = await fetch(decryptedFileUrl);
        const fileBlob = await fileResponse.blob();
        const formData = new FormData();
        formData.append("file", fileBlob, msg.fileName || `document.${fileExt}`);

        const openRes = await api.post("/upload/open-link", formData);
        const nativeOpenUrl = openRes.data.url;
        const protocolUrl = `${protocol}${nativeOpenUrl}`;
        window.location.href = protocolUrl;

        // If the protocol handler is unavailable or blocked, at least open the HTTP URL.
        setTimeout(() => {
          window.open(nativeOpenUrl, "_blank", "noopener,noreferrer");
        }, 350);
      } catch (error) {
        console.error("Failed to prepare native open link", error);
      } finally {
        setIsPreparingOpenLink(false);
      }
      return;
    }

    window.open(decryptedFileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`flex items-end gap-2 ${isLastInGroup ? "mb-3" : "mb-1"} ${isSender ? "justify-end" : "justify-start"}`}>
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
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-body)] flex items-center justify-center">
                <IoPersonCircleOutline size={20} />
              </div>
            )
          ) : null}
        </div>
      )}

      {/* BUBBLE + TIMESTAMP */}
      <div className={`flex flex-col mt-1 max-w-xs lg:max-w-md ${isSender ? "items-end" : "items-start"}`}>
        {selectedChat?.isGroupChat && !isSender && isFirstInGroup && (
          <p className="text-xs font-medium text-[var(--color-secondary)] mb-1 ml-3">
            {msg.sender.name}
          </p>
        )}

        <div
          className={`shadow-md transition-shadow hover:shadow-lg ${msg.fileUrl && (msg.fileType === "image" || msg.fileType === "video") ? "p-1" : "px-4 py-2.5"
            } ${msg.fileUrl && msg.fileType === "file" ? "!p-1.5" : ""
            } ${isSender
              ? "bg-gradient-to-br from-[var(--bubble-sent-bg)] to-[var(--color-primary-light)] text-[var(--bubble-sent-text)] rounded-3xl rounded-br-md"
              : "bg-[var(--bubble-received-bg)] text-[var(--bubble-received-text)] ring-1 ring-[var(--color-secondary-light)]/40 rounded-3xl rounded-bl-md"
            }`}
        >
          {msg.content && msg.content !== "" && (
            <p
              className={`text-sm leading-relaxed ${msg.fileUrl && (msg.fileType === "image" || msg.fileType === "video")
                ? "px-3 pt-1.5"
                : msg.fileType === "file"
                  ? "px-2.5 pt-1.5"
                  : ""
                }`}
            >
              {decryptContent(msg)}
            </p>
          )}

          {msg.fileUrl && (
            <div className={msg.fileType === "image" || msg.fileType === "video" ? "" : "mt-1"}>
              {/* IMAGE */}
              {msg.fileType === "image" &&
                (decryptedFileUrl ? (
                  <img
                    src={decryptedFileUrl}
                    alt="encrypted image"
                    className="w-60 h-60 object-cover rounded-2xl cursor-pointer transition duration-200 hover:brightness-95 active:scale-[0.99]"
                    onClick={() => setViewerOpen(true)}
                  />
                ) : (
                  <div className="w-60 h-60 bg-[var(--color-surface-muted)] rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--color-body)]/30 border-t-[var(--color-body)] animate-spin" />
                    <p className="text-xs text-[var(--color-body)]">Downloading image...</p>
                  </div>
                ))}

              {/* VIDEO */}
              {msg.fileType === "video" &&
                (decryptedFileUrl ? (
                  <div
                    className="relative w-60 h-60 bg-black rounded-2xl cursor-pointer overflow-hidden group"
                    onClick={() => setViewerOpen(true)}
                  >
                    <video src={decryptedFileUrl} className="w-full h-full object-cover" />

                    {/* subtle bottom gradient so badges/controls stay legible on any thumbnail */}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {/* play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/45 backdrop-blur-sm rounded-full p-3.5 transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                        <FiPlay size={22} className="text-white translate-x-[1px]" fill="white" />
                      </div>
                    </div>

                    {/* duration badge, WhatsApp-style */}
                    {msg.duration && (
                      <span className="absolute bottom-1.5 right-2 text-[11px] font-medium text-white bg-black/45 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                        {msg.duration}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-60 h-40 bg-[var(--color-surface-muted)] rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--color-body)]/30 border-t-[var(--color-body)] animate-spin" />
                    <p className="text-xs text-[var(--color-body)]">Downloading video...</p>
                  </div>
                ))}

              {/* FILE (PDF, DOCX, etc.) — WhatsApp document card */}
              {msg.fileType === "file" && (
                <div
                  className="flex items-center gap-3 w-64 max-w-full bg-white/10 hover:bg-white/[0.16] px-3 py-2.5 rounded-2xl cursor-pointer transition-colors"
                  onClick={handleFileCardClick}
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                    <FiFileText size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-tight">
                      {msg.fileName || "Document"}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                      {decryptedFileUrl ? (
                        <>
                          {getExtLabel(msg.fileName)}
                          {msg.fileSize && <span>· {msg.fileSize}</span>}
                        </>
                      ) : (
                        "Downloading..."
                      )}
                    </p>
                  </div>

                </div>
              )}

              {isMedia && viewerOpen && decryptedFileUrl && (
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

        {isLastInGroup && (
          <div className={`flex items-center gap-1 mt-1 mx-1 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
            <p className="text-xs text-[var(--color-body)]">{formattedTime}</p>
            {isSender && readStatus && (
              readStatus === "read" ? (
                <BsCheck2All size={14} className="text-[var(--color-success)]" />
              ) : (
                <BsCheck2 size={14} className="text-[var(--color-body)]" />
              )
            )}
          </div>
        )}

        {isScheduled && (
          <div className="flex items-center gap-1 mt-1">
            <FiClock size={10} className="text-[var(--color-warning)]" />
            <p className="text-xs text-[var(--color-warning)]">Scheduled: {formattedScheduledAt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;