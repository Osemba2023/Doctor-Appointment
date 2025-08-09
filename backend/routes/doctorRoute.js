const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ GET doctor profile by user ID
router.get('/get-doctor-info-by-user-id/:userId', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.userId });
    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }
    res.status(200).send({ success: true, data: doctor });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Server error', error });
  }
});

// ✅ UPDATE doctor profile
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
// GET all appointments for a doctor
router.get('/get-appointments-by-doctor-id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('userId', 'name email') // optionally populate user info
      .sort({ date: 1 });

    res.status(200).send({
      success: true,
      message: 'Appointments fetched successfully',
      data: appointments
    });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Error fetching appointments', error });
  }
});


module.exports = router;

