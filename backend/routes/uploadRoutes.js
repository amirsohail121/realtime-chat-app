const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = require("../middleware/upload");
const { uploadImage, createOpenFileLink } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("========== UPLOAD ERROR ==========");
        console.dir(err, { depth: null });
        console.error(err);
        return res.status(500).json({
          message: err.message,
          stack: err.stack,
        });
      }
      next();
    });
  },
  uploadImage,
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

router.post("/open-link", protect, openFileUpload.single("file"), createOpenFileLink);

module.exports = router;