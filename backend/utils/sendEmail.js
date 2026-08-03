const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  family: 4, // <-- Add this
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.verify();
    console.log("✅ SMTP Connected");

    const info = await transporter.sendMail({
      from: '"ChatWave" <sohu2456@gmail.com>',
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("SMTP Error:", err);
    throw err;
  }
};

module.exports = sendEmail;
