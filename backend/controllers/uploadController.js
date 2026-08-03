const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const fs = require("fs");

const OPEN_FILE_TTL_MS = 10 * 60 * 1000;

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chatwave/profile-pictures",
        resource_type: "image",
        transformation: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Error:", error);
          return res.status(500).json({
            message: error.message,
          });
        }

        return res.status(200).json({
          url: result.secure_url,
        });
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const createOpenFileLink = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/open-files/${req.file.filename}`;
  const filePath = req.file.path;

  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error(err.message);
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
