const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/UserModel');
const moment = require("moment");

// ✅ Get doctor info by userId
router.post('/get-doctor-info-by-user-id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }
    res.status(200).send({ success: true, data: doctor });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// ✅ Update doctor profile
router.put('/update-doctor-profile/:userId', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true }
    );
    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }
    res.status(200).send({ success: true, message: 'Profile updated successfully', data: doctor });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Update failed', error });
  }
});
// Get all appointments for logged-in doctor
router.get('/doctor/appointments', authMiddleware, async (req, res) => {
  try {
    console.log("User ID from token:", req.user.id);
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      console.log("Doctor not found for user:", req.user.id);
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('userId', 'name email')
      .sort({ date: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error in /doctor/appointments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get all appointments for a doctor
router.post("/get-appointments-by-doctor-id", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.id; // doctorId from JWT token

    const appointments = await Appointment.find({ doctorId })
      .populate("userId", "name email phone")
      .sort({ date: -1 });

    res.status(200).send({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching appointments",
    });
  }
});
// Get all upcoming appointments for a doctor
router.get("/appointments/:doctorId", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight

    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ["pending", "approved"] },
      date: { $gte: today },
    });

    res.status(200).send({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching doctor's appointments:", error.message);
    res.status(500).send({
      success: false,
      message: "Error fetching doctor's appointments",
      error: error.message,
    });
  }
});

// ✅ Change appointment status
router.post('/change-appointment-status', authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    // Notify patient
    const user = await User.findById(appointment.userId);
    if (user) {
      user.unseenNotifications.push({
        type: 'appointment-status-changed',
        message: `Your appointment on ${appointment.date.toDateString()} at ${appointment.time} has been ${status}.`,
        onClickPath: '/appointments', // patient side appointments page
      });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ✅ View patient's medical history
router.get('/patient-history/:userId', authMiddleware, async (req, res) => {
  try {
    const patient = await User.findById(req.params.userId).select('name medicalHistory');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient.medicalHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching history' });
  }
});

// ✅ Add medical history entry for patient
router.post('/add-history', authMiddleware, async (req, res) => {
  try {
    const { patientId, description, diagnosis, prescription } = req.body;

    const historyEntry = {
      doctorId: req.user.id,
      description,
      diagnosis,
      prescription,
      date: new Date(),
    };

    await User.findByIdAndUpdate(patientId, {
      $push: { medicalHistory: historyEntry },
    });

    res.status(200).json({ success: true, message: 'Medical history added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding medical history' });
  }
});

// ✅ Fetch medical history for a patient
router.get("/get-patient-history/:userId", authMiddleware, async (req, res) => {
  try {
    const patient = await User.findById(req.params.userId)
      .select("name medicalHistory")
      .populate("medicalHistory.doctorId", "name");

    if (!patient) {
      return res.status(404).send({ success: false, message: "Patient not found" });
    }

    res.status(200).send({
      success: true,
      data: patient.medicalHistory || [],
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error fetching history", error: error.message });
  }
});

module.exports = router;


