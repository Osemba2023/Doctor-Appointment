const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  description: { type: String },
  diagnosis: { type: String },
  prescription: { type: String },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: false },
    role: {
      type: String,
      enum: ['user', 'admin', 'doctor'],
      default: 'user',
    },
    isAdmin: { type: Boolean, default: false },
    isDoctor: { type: Boolean, default: false },
    unseenNotifications: { type: Array, default: [] },
    seenNotifications: { type: Array, default: [] },

    // ✅ New: Medical History field
    medicalHistory: [medicalHistorySchema],
    
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;




