import { memo } from "react";
import { FiMessageCircle } from "react-icons/fi";
import TopBar from "../components/TopBar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import useChatWindow from "../hooks/useChatWindow";
import chatwaveLogo from "../assets/chatwaveLogo.png";

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
  const {
    selectedChat,
    isTyping,
    messagesEndRef,
    decryptedMessages,
    handleSendMessage,
    handleSendFiles,
    handleSchedule,
  } = useChatWindow();

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center h-full bg-surface-tint">
        <div className="text-center">
          <div className="w-24 h-24 bg-secondary-light/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={chatwaveLogo} alt="ChatWave" className=" object-contain" />
          </div>
          <h3 className="text-xl font-semibold text-heading mb-2">
            Welcome to ChatWave
          </h3>
          <p className="text-body text-sm">
            Select a chat to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-surface-tint">
      <TopBar />

      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-surface-muted) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {decryptedMessages.length === 0 && (
          <div className="flex justify-center mt-10">
            <span className="bg-surface text-body text-xs px-4 py-2 rounded-full shadow-sm">
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
                    <div className="flex-1 h-px bg-surface-muted" />
                    <span className="text-xs text-body bg-surface px-3 py-1 rounded-full shadow-sm border border-surface-muted">
                      {getDateLabel(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-surface-muted" />
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

          {isTyping && (
            <div className="flex items-end gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-surface-muted flex-shrink-0" />
              <div className="bg-surface border border-surface-muted rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

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