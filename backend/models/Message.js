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
    contentForUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, default: "" },
      },
    ],
    //msg scheduling
    status: {
      type: String,
      enum: ["sent", "scheduled"],
      default: "sent",
    },
    scheduledAt: {
      type: Date,
      default: null,
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
    // encryptedAesKey: {
    //   type: String,
    //   default: "", // AES key encrypted with recipient's public key
    // },
    encryptedAesKeys: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        key: { type: String, default: "" },
      },
    ],
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
