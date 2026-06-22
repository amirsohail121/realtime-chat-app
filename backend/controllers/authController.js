const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");

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

module.exports = { sendOtp };
