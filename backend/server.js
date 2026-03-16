require("dotenv").config();
const express = require("express");
const connectedDB = require("./config/db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({require:true}));

connectedDB();

app.get("/", (req, res) => {
  res.send("setup is completed");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  console.log(`Server is running on address http://localhost:${PORT}`);
});
