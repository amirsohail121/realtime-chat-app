const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "chatwave/profile-pictures",
    resource_type: "image",
    format: "jpg",
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  }),
});
const upload = multer({ storage });

module.exports = upload;
