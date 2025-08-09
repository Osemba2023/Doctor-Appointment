const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');

// GET ALL USERS (Only role 'user')
router.get('/get-all-users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.status(200).send({
      success: true,
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error fetching users',
      error
    });
  }
});

// GET ALL DOCTORS
router.get('/get-all-doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      success: true,
      message: 'Doctors fetched successfully',
      data: doctors
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error fetching doctors',
      error
    });
  }
});

// ✅ Change doctor account status (approve/reject)
router.post('/change-doctor-status', authMiddleware, async (req, res) => {
  try {
    const { doctorId, status } = req.body;

    // Update doctor's status
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { status }, { new: true });
    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }

    // Get related user
    const user = await User.findById(doctor.userId);
    if (!user) {
      return res.status(404).send({ success: false, message: 'Related user not found' });
    }

    // Update user's doctor flag and role
    user.isDoctor = status === 'approved';
    user.role = status === 'approved' ? 'doctor' : 'user';

    // Add notification
    user.unseenNotifications.push({
      type: 'doctor-status-updated',
      message: `Your doctor application has been ${status}`,
      onClickPath: '/notifications',
    });

    await user.save(); // ✅ save updated user

    res.status(200).send({
      success: true,
      message: `Doctor account ${status} successfully`,
      data: doctor
    });
  } catch (error) {
    console.error('Doctor status update error:', error);
    res.status(500).send({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
