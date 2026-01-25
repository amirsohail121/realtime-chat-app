import { createContext, useState } from "react";

// 1. Create the memory box
export const ChatContext = createContext();

// 2. Create the memory holder
export function ChatProvider({ children }) {
  // MEMORY PARTS
  const [selectedChat, setSelectedChat] = useState(null);

  const [chatList, setChatList] = useState([
    "Rahul",
    "Ayesha",
    "Team Group",
    "Project Alpha",
    "Family",
    "Friends",
    "Book Club",
    "Work Buddies",
    "Gaming Squad",
 

  ]);

  const [messages, setMessages] = useState({
    Rahul: ["Hi", "How are you?"],
    Ayesha: ["Hello"],
    "Team Group": ["Meeting at 5"]
  });

  // 3. Share memory with whole app
  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        chatList,
        messages,
        setMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}