const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000, // keep this if you want the 10s timeout
    });
    console.log("✅ MongoDB is connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = connectDB;






