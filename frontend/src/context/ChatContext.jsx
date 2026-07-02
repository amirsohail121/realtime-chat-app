  import { createContext, useState, useEffect, useContext } from "react";
  import api from "../api/api";
  import { AuthContext } from "./AuthContext";
  import { socket } from "../socket/socket";

  // 1. Create the memory box
  export const ChatContext = createContext();


  // 2. Create the memory holder
  export function ChatProvider({ children }) {

    const { user } = useContext(AuthContext);
    // MEMORY PARTS
    
    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([]);
    
      useEffect(() => {
        if (!user) return;

        const fetchChats = async () => {
          try {
            const res = await api.get("/chats");
            setChatList(res.data);
          } catch (err) {
            console.error("Failed to fetch chats", err)
          }
        }
        fetchChats();
      }, [user])

      useEffect(() => {
        if (!user) return;
        socket.connect();
        return () => {
          socket.disconnect();
        }
      }, [user]);

      //Fetch messages when selectedChat changes

      useEffect(() => {
        if (!selectedChat) return;
        const fetchMessages = async () => {
          try {
            const res = await api.get(`/messages/${selectedChat._id}`);
            setMessages(res.data);
          } catch (err) {
            console.error("Failed to fetch message", err);
          }
        }
        fetchMessages();
        socket.emit("join_chat", selectedChat._id);
      }, [selectedChat])
    


    // Listen for incoming real-time messages
    useEffect(() => {
      socket.on("receive_message", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });
        return () => {
          socket.off("receive_message");
        };
      }, []);


    // 3. Share memory with whole app
    return (
      <ChatContext.Provider
        value={{
          chatList,
          setChatList,
          selectedChat,
          setSelectedChat,
          messages,
          setMessages,
        }}
      >
        {children}
      </ChatContext.Provider>
    );
  }
