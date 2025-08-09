const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const doctorRoute = require("./routes/doctorRoute");
const adminRoute = require("./routes/adminRoute");
const appointmentRoute = require("./routes/appointmentRoute");
const connectDB = require("./config/dbconfig"); // updated import
const cron = require("node-cron");
const nodemailer = require("nodemailer");

// Load environment variables from .env
dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB before starting the server
connectDB();

// CORS setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/user", userRoute);
app.use("/api/doctor", doctorRoute);
app.use("/api/admin", adminRoute);
app.use("/api/appointment", appointmentRoute);

// Root endpoint for health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Start Server (Render will inject PORT)
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Node server started at port ${port}`));

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Daily Reminder Cron Job
cron.schedule("0 8 * * *", async () => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "recipient@example.com", // TODO: Update recipient dynamically
      subject: "Daily Reminder",
      text: "This is your daily appointment reminder from the Online Doctor Booking System.",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: " + info.response);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
});



