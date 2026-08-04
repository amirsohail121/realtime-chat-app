const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadSingleImage,
  uploadSingleEncrypted,
} = require("../middleware/upload");
const {
  uploadImage,
  uploadChatFile,
  createOpenFileLink,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

// Profile picture
router.post("/", protect, uploadSingleImage("image"), uploadImage);

// Chat file/image attachment
router.post(
  "/chat-file",
  protect,
  uploadSingleEncrypted("file"),
  uploadChatFile,
);

const openFilesDir = path.join(process.cwd(), "open-files");
if (!fs.existsSync(openFilesDir)) {
  fs.mkdirSync(openFilesDir, { recursive: true });
}

const openFileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, openFilesDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const safeExt = ext && /^[a-zA-Z0-9.]+$/.test(ext) ? ext : "";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  }),
});

router.post(
  "/open-link",
  protect,
  openFileUpload.single("file"),
  createOpenFileLink,
);

module.exports = router;
