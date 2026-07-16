const Message = require("../models/Message");
const Chat = require("../models/Chat");

// sendMessage

const sendMessage = async (req, res) => {
  try {
    const { chatId, content, contentForSender } = req.body;

    if (!chatId || !content) {
      return res
        .status(400)
        .json({ message: "chatId and content are required" });
    }

    let message = await Message.create({
      sender: req.user._id,
      content: content,
      contentForSender: contentForSender || "",
      chat: chatId,
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
    message = await message.populate("sender", "-password");

    res.status(201).json(message);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//getMessage

const getMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    let messages = await Message.find({ chat: chatId })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// markAsRead
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id }, // not already read by this user
        sender: { $ne: req.user._id }, // not sent by this user
      },
      {
        $addToSet: { readBy: req.user._id }, // add user to readBy array
      },
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getMessage, markAsRead };
