const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const Doctor = require('../models/doctorModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ✅ Keep only ONE of this
const authMiddleware = require('../middlewares/authMiddleware');
const Appointment = require("../models/appointmentModel");
const moment = require("moment");


// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      return res.status(200).send({ message: "User does not exist", success: false });
    }

    const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
    if (!isMatch) {
      return res.status(200).send({ message: "Password is incorrect", success: false });
    }

    const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).send({
      message: "Login successful",
      success: true,
      data: {
        token,
        user: {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          isDoctor: existingUser.role === 'doctor',
          isAdmin: existingUser.role === 'admin',
          _id: existingUser._id
        }
      }
    });

  } catch (error) {
    console.error("Login Error:", error); // ✅ This stays INSIDE the catch
    res.status(500).send({
      message: "Error logging in",
      success: false,
      error: error.message || error
    });
  }
});

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber, // ✅ include phone number
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error); // ✅ log actual error
    res.status(500).json({ success: false, message: "Error registering user", error: error.message });
  }
});

// ✅ GET USER INFO BY ID (from token)
router.post('/get-user-info-by-id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    res.status(200).send({ success: true, data: user });
  } catch (error) {
    res.status(500).send({ message: "Error getting user info", success: false, error: error.message });
  }
});

// ✅ USER applies to become a doctor
router.post('/apply-doctor-account', authMiddleware, async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: 'pending' });
    await newDoctor.save();

    const adminUser = await User.findOne({ role: 'admin' });

    if (adminUser) {
      adminUser.unseenNotifications.push({
        type: "new-doctor-request",
        message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
        data: {
          doctorId: newDoctor._id,
          name: `${newDoctor.firstName} ${newDoctor.lastName}`,
        },
        onClickPath: "/admin/doctorslist",
      });

      await adminUser.save();
    }

    res.status(200).send({ success: true, message: "Doctor account applied successfully" });
  } catch (error) {
    console.error("Apply Doctor Error:", error);  // 👈 this helps debug
    res.status(500).send({
      message: 'Error applying for doctor account',
      success: false,
      error: error.message
    });
  }
});

// ✅ Admin manually makes a user a doctor
router.post('/make-doctor', authMiddleware, async (req, res) => {
  try {
    const existingDoctor = await Doctor.findOne({ userId: req.body.userId });
    if (existingDoctor) {
      return res.send({ success: false, message: "User is already a doctor" });
    }

    const newDoctor = new Doctor({
      userId: req.body.userId,
      status: "pending",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      specialization: "",
    });

    await newDoctor.save();

    await User.findByIdAndUpdate(req.body.userId, {
      isDoctor: true,
      role: 'doctor'
    });

    res.send({ success: true, message: "Doctor account created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error", error });
  }
});

// ✅ GET ALL USERS (only normal users)
router.get('/get-all-users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.status(200).send({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error fetching users',
      error,
    });
  }
});
// ✅ GET ALL DOCTORS
router.get('/get-all-doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      success: true,
      message: 'Doctors fetched successfully',
      data: doctors,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error fetching doctors',
      error,
    });
  }
});
router.get('/get-all-approved-doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    console.log(doctors); // ✅ Safe logging

    res.send({
      success: true,
      message: 'Doctors fetched successfully',
      data: doctors,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Error fetching doctors', error });
  }
});


// ✅ GET a doctor's profile by userId
router.get('/get-doctor-info/:userId', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.userId });
    if (!doctor) return res.status(404).send({ success: false, message: 'Doctor not found' });

    res.send({ success: true, data: doctor });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Server error', error });
  }
});

// ✅ UPDATE a doctor's profile by userId
router.put('/update-doctor-info/:userId', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true }
    );

    if (!doctor) {
      return res.status(404).send({ success: false, message: 'Doctor not found' });
    }

    res.send({ success: true, message: 'Profile updated successfully', data: doctor });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Update failed', error });
  }
});


// ✅ Mark all notifications as seen
router.post('/mark-all-notifications-as-seen', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    user.seenNotifications.push(...user.unseenNotifications);
    user.unseenNotifications = [];

    await user.save();

    res.status(200).send({
      success: true,
      message: "All notifications marked as seen",
      data: user,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error marking notifications as seen", error });
  }
});

// ✅ Delete all notifications
router.post('/delete-all-notifications', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    user.seenNotifications = [];
    user.unseenNotifications = [];
    await user.save();

    res.status(200).send({
      success: true,
      message: "All notifications deleted successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error deleting notifications", error });
  }
});
router.get('/get-appointments-by-user-id', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id }); // ✅ use req.user.id not req.body
    res.send({
      success: true,
      message: 'Appointments fetched successfully',
      data: appointments,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Error fetching appointments', error });
  }
});
router.post('/add-medical-history', authMiddleware, async (req, res) => {
  try {
    const { userId, doctorId, diagnosis, prescription, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newEntry = {
      doctorId,
      diagnosis,
      prescription,
      description,
      date: new Date()
    };

    user.medicalHistory.push(newEntry);
    await user.save();

    res.status(200).json({ message: 'Medical history added successfully', history: newEntry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get logged-in patient's medical history
router.get("/my-history", authMiddleware, async (req, res) => {
  try {
    const patient = await User.findById(req.user.id)
      .select("medicalHistory")
      .populate("medicalHistory.doctorId", "firstName lastName specialization");

    if (!patient) {
      return res.status(404).send({ success: false, message: "Patient not found" });
    }

    res.status(200).send({
      success: true,
      data: patient.medicalHistory || [],
    });
  } catch (error) {
    console.error("Error fetching patient medical history:", error);
    res.status(500).send({ success: false, message: "Error fetching medical history" });
  }
});


// routes/userRoute.js
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email phoneNumber");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;




