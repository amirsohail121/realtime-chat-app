const User = require('../models/User')

const socketHandler = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
   

    // User comes online
    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
     
    });

    // join chat
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    // send message
    socket.on("send_message", (messageData) => {
      const data =
        typeof messageData === "string" ? JSON.parse(messageData) : messageData;
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
            { returnDocument: 'after' }, // ← returns updated document
          ).catch((err) => console.error("Failed to update lastSeen:", err));

          // Broadcast lastSeen update to all clients
          io.emit("user_last_seen", {
            userId,
            lastSeen: updatedUser?.lastSeen,
          });
        }
      });
      io.emit("online_users", Array.from(onlineUsers.keys()));
     
    });

    // Messages read
    socket.on("messages_read", (payload) => {
      const data =
        typeof payload === "string"
          ? { chatId: payload }
          : payload || {};

      if (!data.chatId) return;
      socket.to(data.chatId).emit("messages_read", data);
    });
  });
};

module.exports = socketHandler;
