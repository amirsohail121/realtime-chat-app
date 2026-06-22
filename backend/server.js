require("dotenv").config();
const express = require("express");
const connectedDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectedDB();

app.get("/", (req, res) => {
  res.send("setup is completed");
});

//authRoutes

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});


