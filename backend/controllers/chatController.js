const Chat = require("../models/Chat");
const User = require("../models/User");

// accesschat

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    //Validate userId exists
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // safety check
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    //Check if chat already exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      // req.user._id = logged-in user (from authMiddleware) userId = the other person we want to chat with
      users: { $all: [req.user._id, userId] },
    });

    // chat exist
    if (chat) {
      return res.status(200).json(chat);
    }

    const newChat = await Chat.create({
      isGroupChat: false,
      users: [req.user._id, userId],
    });
    res.status(201).json(newChat);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// getchat
const getChat = async (req, res) => {
  try {
    // find all the chat where logged-in user

    let chats = await Chat.find({
      users: { $in: [req.user._id] },
    })

      //get full user details
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { accessChat, getChat };
