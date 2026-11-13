const express = require("express");
const router = express.Router();
const { checkEmail, sendOtp , verifyOtp , completeProfile ,getMe , logout} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.get("/check-email", checkEmail);
router.post ("/send-otp" , sendOtp);
router.post("/verify-otp" , verifyOtp);
router.put("/complete-profile", protect , completeProfile);
router.get("/me", protect, getMe);
router.post("/logout" , protect ,  logout);

module.exports = router;

