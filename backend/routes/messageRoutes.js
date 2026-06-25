const express = require("express");
const router = express.Router();
const { sendMessage, getMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/",protect, sendMessage);
router.get("/:chatId", protect, getMessage);

module.exports = router;


