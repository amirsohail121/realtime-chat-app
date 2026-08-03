const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");


// send otp
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP connection verified");

    await transporter.sendMail({
      from: `"ChatApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (err) {
    console.error("Nodemailer Error:", err);
    throw err;
  }
};

module.exports = sendEmail;

  
// verify the otp
const verifyOtp = async (req,res)=>{
  try{
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

    if(otpRecord.isUsed){
      return res
        .status(400)
        .json({ message: "OTP already used, please request again" });
    }

    // check otp expired

    if(otpRecord.expiresAt < new Date()){
       return res
         .status(400)
         .json({ message: "OTP expired, please request again" });
    }


    // verifying otp with hashed otp

    const isMatch = await bcrypt.compare(otp , otpRecord.otp);

    if(!isMatch){
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();


    // check user is exist or not

    let user = await User.findOne({email});
    // console.log("User found:", user);

    let isNewUser = false;
    if(!user){
      user = await User.create({email});
      isNewUser = true;
    }

    // generate JWT token and set cookie

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePic: user.profilePic,
      bio: user.bio,
      isProfileComplete: user.isProfileComplete,
      isNewUser,
    });

  }catch(err){
    res.status(500).json({ message: err.message });
  }
}

// profile 

const completeProfile = async(req,res)=>{
  try{
    const {name , bio , profilePic,publicKey} = req.body;
    const user = await User.findById(req.user._id);
    
    if(!user){
      return res.status(404).json({message:"User not found"});
    }

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.profilePic = profilePic || user.profilePic;
     user.publicKey = publicKey || user.publicKey;

    user.isProfileComplete = true;

    await user.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePic: user.profilePic,
      bio: user.bio,
      isProfileComplete: user.isProfileComplete,
      publicKey: user.publicKey,
    });


  }catch(err){
    res.status(500).json({message:err.message})
  }
}


const getMe = async(req,res)=>{
  try{
    res.status(200).json(req.user);
  }catch(err){
    return res.status(500).json({message:err.message})
  }
} 


// logout
const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { sendOtp , verifyOtp , completeProfile , getMe , logout};
