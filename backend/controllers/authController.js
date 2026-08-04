const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");

// send otp
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await Otp.deleteMany({ email });

    const otp = generateOtp();

    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail(
      email,
      "Your ChatApp OTP",
      `<h2>Your OTP is: ${otp}</h2><p>Expires in 10 minutes.</p>`,
    );

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// verify the otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    //  Find the latest OTP record of existing email
    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    // Check if OTP record exists
    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not found, please request again" });
    }

    // check if otp already used

    if (otpRecord.isUsed) {
      return res
        .status(400)
        .json({ message: "OTP already used, please request again" });
    }

    // check otp expired

    if (otpRecord.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired, please request again" });
    }

    // verifying otp with hashed otp

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    // check user is exist or not

    let user = await User.findOne({ email });
    // console.log("User found:", user);

    let isNewUser = false;
    if (!user) {
      user = await User.create({ email });
      isNewUser = true;
    }

    // generate JWT token and set cookie

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePic: user.profilePic,
      profilePicId: user.profilePicId,
      bio: user.bio,
      isProfileComplete: user.isProfileComplete,
      isNewUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// profile

const completeProfile = async (req, res) => {
  try {
    const { name, bio, profilePic, profilePicId, publicKey } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.profilePic = profilePic || user.profilePic;
    user.profilePicId = profilePicId || user.profilePicId;
    user.publicKey = publicKey || user.publicKey;

    user.isProfileComplete = true;

    await user.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePic: user.profilePic,
      profilePicId: user.profilePicId,
      bio: user.bio,
      isProfileComplete: user.isProfileComplete,
      publicKey: user.publicKey,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// logout
const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { sendOtp, verifyOtp, completeProfile, getMe, logout };
