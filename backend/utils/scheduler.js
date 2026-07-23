const cron = require("node-cron");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

const startScheduler = (io) => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Checking scheduled messages...");

    try {
      // Find all messages due to be sent
      const dueMessages = await Message.find({
        status: "scheduled",
        scheduledAt: { $lte: new Date() },
      }).populate("sender", "-password");

      for (const message of dueMessages) {
        // Mark as sent
        message.status = "sent";
        message.scheduledAt = null;
        await message.save();

        // Update chat's latestMessage
        await Chat.findByIdAndUpdate(message.chat, {
          latestMessage: message._id,
        });

        // Emit via socket to the chat room
        io.to(message.chat.toString()).emit("receive_message", message);

        console.log(`✅ Scheduled message sent: ${message._id}`);
      }
    } catch (err) {
      console.error("Scheduler error:", err.message);
    }
  });

  console.log("⏰ Message scheduler started");
};

module.exports = startScheduler;
