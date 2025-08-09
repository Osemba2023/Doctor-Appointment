const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  timings: {
    type: [String],
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("doctors", doctorSchema);

