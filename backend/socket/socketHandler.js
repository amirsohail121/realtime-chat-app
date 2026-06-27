const socketHandler = (io)=>{
  io.on("connection",(socket)=>{
    console.log("User connected:", socket.id);
    // join chat
    socket.on("join_chat",(chatId)=>{
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    })

    //sendmessage
    socket.on("send_message" , (messageData)=>{
      // console.log("Received messageData:", messageData);
      // console.log("Type of messageData:", typeof messageData);
      const data = typeof messageData === "string" ? JSON.parse(messageData) : messageData;

      console.log("Parsed data:", data);
      io.to(messageData.chatId).emit("receive_message",messageData);

    })

    //disconnect
    socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);
});
  })
}

module.exports = socketHandler;