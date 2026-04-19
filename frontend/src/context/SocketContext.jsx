import { createContext, useContext, useEffect } from "react";
import { socket } from "../socket";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit("user:online", user._id);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook
export const useSocket = () => useContext(SocketContext);