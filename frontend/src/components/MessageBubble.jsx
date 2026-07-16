import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import { IoPersonCircleOutline } from "react-icons/io5";

const MessageBubble = ({ msg, isFirstInGroup, isLastInGroup, decryptContent }) => {
  const { user } = useContext(AuthContext);
  const { selectedChat } = useContext(ChatContext);

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
          <p className="text-sm leading-relaxed">{decryptContent(msg)}</p>
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
    </div>
  );
};

export default MessageBubble;