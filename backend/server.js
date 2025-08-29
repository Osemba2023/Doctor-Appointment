// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");

// Routes
const userRoute = require("./routes/userRoute");
const doctorRoute = require("./routes/doctorRoute");
const adminRoute = require("./routes/adminRoute");
const appointmentRoute = require("./routes/appointmentRoute");

// DB & Email helper
const connectDB = require("./config/dbconfig");
const sendEmail = require("./utils/sendEmails"); // use your helper

// Load environment variables
dotenv.config();
require("dotenv").config();
console.log("Loaded .env:");
console.log("EMAIL_USERNAME:", process.env.EMAIL_USERNAME);
console.log("EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);


const app = express();
app.use(express.json());

// Connect to MongoDB
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

// Root endpoint
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// HTTP + Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// DEBUG: Confirm email env variables
console.log("📧 Email Config Debug:");
console.log("EMAIL_USERNAME:", process.env.EMAIL_USERNAME);
console.log("EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);
console.log("FROM_EMAIL:", process.env.FROM_EMAIL);

// Cron job example (daily at 9 AM)
cron.schedule("0 9 * * *", async () => {
  try {
    console.log("📧 Running daily email cron job...");
    await sendEmail({
      to: "recipient@example.com",
      subject: "Daily Reminder",
      text: "This is your daily appointment reminder.",
    });
    console.log("✅ Cron email sent successfully");
  } catch (err) {
    console.error("❌ Error sending cron email:", err.message);
  }
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Node server started at port ${port}`));





