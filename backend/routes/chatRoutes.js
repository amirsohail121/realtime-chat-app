const express = require("express");
const router = express.Router();

const { accessChat, getChat } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, accessChat);
router.get("/", protect, getChat);

module.exports = router;
