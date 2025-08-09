const mongoose = require("mongoose");
require("dotenv").config();

const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL)
  .then(() => console.log("✅ MongoDB is connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = mongoose;


