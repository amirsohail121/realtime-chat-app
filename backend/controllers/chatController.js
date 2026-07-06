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
    // When returning existing chat:
    if (chat) {
      chat = await chat.populate("users", "-password");
      return res.status(200).json(chat);
    }

    // When creating new chat:
    let newChat = await Chat.create({
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    newChat = await newChat.populate("users", "-password");
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

//createGroupChat
const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    // Validate
    if (!name || !users) {
      return res
        .status(400)
        .json({ message: "Group name and users are required" });
    }

    // Parse users if sent as string
    const parsedUsers = typeof users === "string" ? JSON.parse(users) : users;

    // Need at least 2 other users (+ yourself = 3 minimum)
    if (parsedUsers.length < 2) {
      return res
        .status(400)
        .json({ message: "At least 2 other users required for a group" });
    }

    // Add yourself to the group
    parsedUsers.push(req.user._id);

    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: parsedUsers,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { accessChat, getChat, createGroupChat };
