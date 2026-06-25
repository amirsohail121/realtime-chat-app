require("dotenv").config();
const express = require("express");
const connectedDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

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

app.listen(PORT, (err) => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});


