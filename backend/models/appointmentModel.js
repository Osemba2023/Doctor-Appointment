const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorInfo: {
      type: Object,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    date: {
      type: Date, // ✅ Use Date type instead of String
      required: true,
    },
    time: {
      type: [Date], // ✅ Store time range as array of Date (start and end)
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Time must be an array with [startTime, endTime]',
      },
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'approved', 'rejected'],
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;






