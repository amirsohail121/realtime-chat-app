const socketHandler = (io)=>{
  io.on("connection",(socket)=>{
    console.log("User connected:", socket.id);
  })
}

module.exports = socketHandler;