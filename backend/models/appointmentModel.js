const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorInfo: { type: Object, required: true },
  userInfo: { type: Object, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  formattedDate: { type: String },      // Add this
  formattedTimeRange: { type: String }, // And this
  status: {
    type: String,
    required: true,
    default: "pending",
    enum: ["pending", "approved", "rejected"],
  },
}, { timestamps: true });

// Prevent OverwriteModelError by checking if model exists before defining
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;











