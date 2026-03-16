const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "Hey there! I am using ChatApp.",
      trim : true
    },
    isProfileComplete: {
      type: Boolean,
      default: false, // false = new user → redirect to profile page
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
