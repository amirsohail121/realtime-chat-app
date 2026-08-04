const multer = require("multer");

const storage = multer.memoryStorage();

// Profile picture — must be an actual image
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Chat attachments — encrypted binary blobs, no mimetype restriction,
// bigger ceiling since it can be docs/videos/etc.
const uploadEncrypted = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

const uploadSingleImage = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

const uploadSingleEncrypted = (fieldName) => (req, res, next) => {
  uploadEncrypted.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = upload;
module.exports.uploadEncrypted = uploadEncrypted;
module.exports.uploadSingleImage = uploadSingleImage;
module.exports.uploadSingleEncrypted = uploadSingleEncrypted;
