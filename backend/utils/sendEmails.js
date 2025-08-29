const nodemailer = require("nodemailer");

// Load environment variables
const { EMAIL_USER, EMAIL_PASS } = process.env;

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ✅ Helper to test SMTP credentials
async function testSMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP credentials are valid!");
    return true;
  } catch (err) {
    console.error("❌ SMTP credentials invalid:", err.message);
    return false;
  }
}

// Main sendEmail function
async function sendEmail({ to, subject, text, html }) {
  const isValid = await testSMTP();
  if (!isValid) throw new Error("SMTP credentials invalid. Email not sent.");

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;


