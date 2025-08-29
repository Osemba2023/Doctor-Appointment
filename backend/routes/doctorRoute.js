const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/UserModel");
const MedicalHistory = require("../models/medicalHistoryModel");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const nodemailer = require("nodemailer");


// =======================
// Doctor Info Routes
// =======================

// Get doctor info by userId
router.post('/get-doctor-info-by-user-id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update doctor profile
router.put('/update-doctor-profile/:userId', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate({ userId: req.params.userId }, req.body, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Profile updated successfully', data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// Get all appointments for logged-in doctor
router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    // 1. Find the doctor's _id by their user ID
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate("userId", "name email phoneNumber")
      .sort({ createdAt: -1 });


    const formattedAppointments = appointments.map((appt) => ({
      _id: appt._id,
      patientName: appt.userId?.name || "No Name",
      patientEmail: appt.userId?.email || "No Email",
      patientPhone: appt.userId?.phoneNumber || "No Phone",
      formattedDate: appt.formattedDate || moment(appt.start).format("YYYY-MM-DD"),
      formattedTime: appt.formattedTimeRange || `${moment(appt.start).format("HH:mm")} - ${moment(appt.end).format("HH:mm")}`,
      status: appt.status || "pending",
      userId: appt.userId?._id,
    }));

    res.json({ success: true, data: formattedAppointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Get details for a single appointment
router.get("/appointment/details/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    // Find appointment without populate
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send back the embedded info directly
    res.status(200).json({
      success: true,
      data: {
        _id: appointment._id,
        doctorInfo: appointment.doctorInfo,
        userInfo: appointment.userInfo,
        date: appointment.formattedDate || appointment.start,
        time: appointment.formattedTimeRange || `${appointment.start} - ${appointment.end}`,
        status: appointment.status,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
    });
  }
});

// Nodemailer transporter (reuse instead of creating each request)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /doctor/change-appointment-status
router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    // Find appointment and populate user & doctor
    const appointment = await Appointment.findById(appointmentId).populate("userId doctorId");
    if (!appointment)
      return res.status(404).send({ success: false, message: "Appointment not found" });

    // Update status in DB
    appointment.status = status;
    await appointment.save();

    // Respond immediately to frontend
    res.send({ success: true, message: `Appointment ${status} successfully` });

    // Fire-and-forget notifications & email
    (async () => {
      try {
        const io = req.app.get("io");

        // Socket notification
        io.to(appointment.userId._id.toString()).emit("receive-notification", {
          message: `Your appointment with Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName} has been ${status}.`,
          onClickPath: "/appointments",
        });

        // Save notification in DB
        await Notification.create({
          userId: appointment.userId._id,
          message: `Your appointment with Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName} has been ${status}.`,
          onClickPath: "/appointments",
          read: false,
        });

        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: appointment.userId.email,
          subject: "Appointment Status Update",
          text: `Your appointment with Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName} has been ${status}.`,
        });
      } catch (err) {
        console.error("❌ Notification / email failed:", err.message);
      }
    })();

  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    res.status(500).send({ success: false, message: "Error updating appointment" });
  }
});

// 📌 Add medical history entry
router.post("/medical-history", authMiddleware, async (req, res) => {
  try {
    const { userId, doctorId, description, diagnosis, prescription } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.medicalHistory.push({
      doctorId,
      description,
      diagnosis,
      prescription,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Medical history added successfully",
      data: user.medicalHistory,
    });
  } catch (error) {
    console.error("❌ Error adding medical history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Get patient info + medical history
router.get("/patient-history/:userId", authMiddleware, async (req, res) => {
  try {
    const patient = await User.findById(req.params.userId)
      .select("name email medicalHistory")
      .populate("medicalHistory.doctorId", "firstName lastName specialization"); // <-- populate doctor

    if (!patient) {
      return res.status(404).send({ success: false, message: "Patient not found" });
    }

    res.status(200).send({
      success: true,
      patient,
      data: patient.medicalHistory || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Error fetching patient history", error });
  }
});

// Add new medical record (Doctor adds for patient)
router.post("/add-medical-record/:userId", authMiddleware, async (req, res) => {
  try {
    const { diagnosis, treatment, notes } = req.body;
    const doctorId = req.user.id; // <-- doctor who adds the record

    const patient = await User.findById(req.params.userId);
    if (!patient) {
      return res.status(404).send({ success: false, message: "Patient not found" });
    }

    // Push new record with doctorId
    patient.medicalHistory.push({
      diagnosis,
      treatment,
      notes,
      doctorId,
      date: new Date(),
    });

    await patient.save();

    res.status(200).send({
      success: true,
      message: "Medical record added successfully",
      patient,
      data: patient.medicalHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Error adding medical record", error });
  }
});

// 📌 Get patient details + appointment + history
router.get("/patient/:patientId/:appointmentId", authMiddleware, async (req, res) => {
  try {
    const { patientId, appointmentId } = req.params;

    const patient = await User.findById(patientId).select("name email phone medicalHistory");
    if (!patient) {
      return res.status(404).send({ success: false, message: "Patient not found" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ success: false, message: "Appointment not found" });
    }

    res.status(200).send({
      success: true,
      patient,
      appointment,
      history: patient.medicalHistory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error fetching details", error });
  }
});

// routes/medicalHistoryRoute.js
router.post("/add", async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, diagnosis, treatment, notes } = req.body;

    if (!patientId || !doctorId || !appointmentId) {
      return res.status(400).send({
        success: false,
        message: "Missing required fields (patientId, doctorId, appointmentId)",
      });
    }

    const newRecord = new MedicalHistory({
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      treatment,
      notes,
    });

    await newRecord.save();

    res.status(201).send({
      success: true,
      message: "Medical record added successfully",
      data: newRecord,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error adding medical record",
      error,
    });
  }
});


// Patient views their medical history
router.get("/my-history", authMiddleware, async (req, res) => {
  try {
    const history = await MedicalHistory.find({ patientId: req.user.id })
      .populate("doctorId", "name specialization")
      .populate("appointmentId", "date time");

    res.send({ success: true, data: history });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

module.exports = router;




