const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: "", // ← remove required: true (files have no text content)
    },
    contentForSender: {
      type: String,
      trim: true,
      default: "",
    },
    // File fields
    fileUrl: {
      type: String,
      default: "", // URL to encrypted file on server
    },
    fileType: {
      type: String,
      default: "", // "image", "video", "file"
    },
    fileName: {
      type: String,
      default: "", // original filename
    },
    encryptedAesKey: {
      type: String,
      default: "", // AES key encrypted with recipient's public key
    },
    encryptedAesKeyForSender: {
      type: String,
      default: "", // AES key encrypted with sender's public key
    },
    iv: {
      type: String,
      default: "", // initialization vector for AES
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);


module.exports = mongoose.model("Message", messageSchema);
