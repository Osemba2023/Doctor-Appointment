    const mongoose = require("mongoose");

    const doctorSchema = new mongoose.Schema(
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users", // Reference to the User model
          required: true,
          unique: true,
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
          type: Number, // Changed from String to Number if it stores numerical experience
          required: true,
        },
        consultationFee: {
          type: Number,
          required: true,
        },
        timings: {
          type: [String], // Array of HH:mm strings (e.g., ["08:00", "16:00"])
          required: true,
          // Removed the Date.parse validator as it expects ISO strings, not HH:mm
          // If you need HH:mm validation, use a regex or custom logic.
        },
        status: {
          type: String,
          default: "pending", // 'pending', 'approved', 'rejected'
        },
        // Notifications are stored in the User model for the doctor, not here.
        // If you intended to store them here, you'd need:
        // unseenNotifications: { type: Array, default: [] },
        // seenNotifications: { type: Array, default: [] },
      },
      {
        timestamps: true,
      }
    );

    module.exports = mongoose.model("Doctor", doctorSchema);



