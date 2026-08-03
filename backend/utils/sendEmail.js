const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async (to, subject, html) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "ChatWave",
        email: "sohu2456@gmail.com", // Your verified sender
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    });

    console.log("✅ Email sent:", result);
  } catch (err) {
    console.error("❌ Brevo Error:", err);
    throw err;
  }
};

module.exports = sendEmail;
