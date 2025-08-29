// backend/testEmail.js
require("dotenv").config();
const sendEmail = require("./sendEmails"); // ✅ now correct path

sendEmail({
  to: "vincentosemba9@gmail.com",   // put your real email
  subject: "Test Email",
  text: "If you see this, config works ✅",
});
