const jwt = require("jsonwebtoken");

const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true, // Always true on Render (HTTPS)
    sameSite: "none", // Required for Vercel ↔ Render
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

module.exports = generateToken;
