const express = require("express");
const router = express.Router();

const {
  accessChat,
  getChat,
  createGroupChat,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, accessChat);
router.get("/", protect, getChat);
router.post("/group", protect, createGroupChat);

module.exports = router;
