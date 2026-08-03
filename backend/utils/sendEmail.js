const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

const sendEmail = async (to, subject, html) => {
  await apiInstance.sendTransacEmail({
    sender: {
      email: "sohu2456@gmail.com",
      name: "ChatWave",
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent: html,
  });
};

module.exports = sendEmail;
