const fs = require("fs");

const OPEN_FILE_TTL_MS = 10 * 60 * 1000;

const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  return res.status(200).json({
    url: req.file.path,
  });
};

const createOpenFileLink = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/open-files/${req.file.filename}`;
  const filePath = req.file.path;

  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Failed to delete temp open file:", err.message);
      }
    });
  }, OPEN_FILE_TTL_MS);

  return res.status(200).json({
    url: fileUrl,
    expiresInMs: OPEN_FILE_TTL_MS,
  });
};

module.exports = {
  uploadImage,
  createOpenFileLink,
};
