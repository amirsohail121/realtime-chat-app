const User = require('../models/User')

const socketHandler = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User comes online
    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log("Online users:", Array.from(onlineUsers.keys()));
    });

    // join chat
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    // send message
    socket.on("send_message", (messageData) => {
      const data =
        typeof messageData === "string" ? JSON.parse(messageData) : messageData;
      console.log("Parsed data:", data);
      io.to(data.chatId).emit("receive_message", data);
    });

    // Typing indicator
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", { chatId, userId: socket.id });
    });

    socket.on("stop_typing", (chatId) => {
      socket.to(chatId).emit("stop_typing", { chatId });
    });

    // disconnect
    socket.on("disconnect", async () => {
      onlineUsers.forEach(async (socketId, userId) => {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          // Update lastSeen in DB
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { lastSeen: new Date(), status: "offline" },
            { new: true }, // ← returns updated document
          ).catch((err) => console.error("Failed to update lastSeen:", err));

          // Broadcast lastSeen update to all clients
          io.emit("user_last_seen", {
            userId,
            lastSeen: updatedUser?.lastSeen,
          });
        }
      });
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;
