const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessage,
  markAsRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessage);
router.put("/read/:chatId", protect, markAsRead);

module.exports = router;
