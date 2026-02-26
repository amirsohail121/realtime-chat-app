import { createContext, useState } from "react";

// 1. Create the memory box
export const ChatContext = createContext();

// 2. Create the memory holder
export function ChatProvider({ children }) {
  // MEMORY PARTS
  const [selectedChat, setSelectedChat] = useState(null);

  const [chatList, setChatList] = useState([
   {
     name: "You",
     email: "you@gmail.com",
     messages: []
   },
   {
     name: "Bot",
     email: "bot@gmail.com",
     messages: []
   }
 ]);
  const [messages, setMessages] = useState({});
  const addMessage = (chatName, message) => {
    setMessages(prev => ({
      ...prev,
      [chatName]: [...(prev[chatName] || []), message]
    }));
  };

  // 3. Share memory with whole app
  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chatList,
        setChatList,
        setMessages,
        addMessage,
        messages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}