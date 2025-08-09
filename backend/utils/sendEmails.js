const nodemailer = require("nodemailer");

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient's email address.
 * @param {string} options.subject - Subject of the email.
 * @param {string} options.html - HTML body of the email.
 */
const sendEmail = async (options) => {
  try {
    // 1. Create a Nodemailer transporter
    // Use your email service credentials here. For a production app,
    // these should be stored as environment variables.
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., "gmail"
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 2. Define the email message
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to}`);

  } catch (error) {
    // Crucial change: log the error and don't crash the server.
    console.error(`🚨 Failed to send email to ${options.to}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;
