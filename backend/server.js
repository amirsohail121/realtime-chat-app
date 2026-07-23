require("dotenv").config();
const express = require("express");
const http = require("http");
const connectedDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { Server } = require("socket.io");
const socketHandler = require("./socket/socketHandler");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const startScheduler = require("./utils/scheduler");

const cors = require("cors");

const app = express();
const server = http.createServer(app);
//Created Socket.io instance with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// frontend connectivity
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

socketHandler(io);
startScheduler(io);

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

//image uplaod
app.use("/api/upload", uploadRoutes);

// image upload — serve files publicly
app.use("/uploads", express.static("uploads"));

// searchUsers
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, (err) => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});


