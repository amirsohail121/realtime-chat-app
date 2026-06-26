require("dotenv").config();
const express = require("express");
const http = require("http");
const connectedDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { Server } = require("socket.io");
const socketHandler = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
//Created Socket.io instance with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

socketHandler(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

connectedDB();

app.get("/", (req, res) => {
  res.send("setup is completed");
});

//authRoutes

app.use("/api/auth", authRoutes);

//chatRoutes
app.use("/api/chats", chatRoutes);

//messageRoutes
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, (err) => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});


