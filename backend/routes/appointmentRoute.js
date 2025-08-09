// This file contains the server-side routes for managing appointments.
// It includes routes for checking a doctor's availability and for booking an appointment.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Doctor = require("../models/doctorModel");
const User = require("../models/UserModel");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");



// ✅ Route to check doctor's booking availability
router.post("/booking-availability", authMiddleware, async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const fromTime = moment(time[0], "HH:mm");
    const toTime = moment(time[1], "HH:mm");

    // Check if the doctor's time range is valid
    if (fromTime.isSameOrAfter(toTime)) {
      return res.status(400).send({
        message: "End time must be after start time.",
        success: false,
      });
    }

    // Find appointments that conflict with the requested time
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ["pending", "approved"] },
    });

    // Logic to check for overlapping appointments
    const overlappingAppointments = appointments.filter(appointment => {
      const existingFromTime = moment(appointment.time[0], "HH:mm");
      const existingToTime = moment(appointment.time[1], "HH:mm");

      // Check for overlap using moment.js
      const isOverlapping = (fromTime.isSameOrBefore(existingToTime) && existingFromTime.isSameOrBefore(toTime));
      return isOverlapping;
    });

    if (overlappingAppointments.length > 0) {
      return res.status(200).send({
        message: "Appointment not available. The doctor is busy in the selected time range.",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointment available.",
        success: true,
      });
    }

  } catch (error) {
    console.error("Booking availability error:", error.message);
    res.status(500).send({
      message: "Error checking booking availability.",
      success: false,
      error: error.message,
    });
  }
});

// ✅ Route to book an appointment
router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    const { doctorId, doctorInfo, date, time } = req.body;
    const userId = req.user.id;

    if (!userId) {
      console.error("DEBUG: Unauthorized - User not found in token.");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!Array.isArray(time) || time.length !== 2) {
      console.error("DEBUG: Invalid time format.");
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Expected an array of two strings.",
      });
    }

    const formattedDate = moment(date, "DD-MM-YYYY").toISOString();
    const [startTime, endTime] = time;

    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: formattedDate,
      $or: [
        {
          "time.0": { $lt: endTime },
          "time.1": { $gt: startTime },
        },
      ],
      status: { $in: ["approved", "pending"] },
    });

    if (existingAppointment) {
      console.log("DEBUG: Appointment already exists.");
      return res.status(409).json({
        success: false,
        message: "Appointment already booked for this time slot.",
      });
    }

    const bookingUser = await User.findById(userId);
    if (!bookingUser) {
      console.error("DEBUG: Booking user not found.");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const newAppointment = new Appointment({
      doctorId,
      userId,
      doctorInfo,
      userInfo: bookingUser,
      status: "pending",
      date: formattedDate,
      time,
    });

    await newAppointment.save();
    console.log("DEBUG: Appointment saved.");

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.error("DEBUG: Doctor not found.");
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    doctor.unseenNotifications = doctor.unseenNotifications || [];
    bookingUser.unseenNotifications = bookingUser.unseenNotifications || [];

    doctor.unseenNotifications.push({
      type: "New Appointment Request",
      message: `New appointment request from ${bookingUser.name}`,
      onClickPath: "/doctor-appointments",
    });

    bookingUser.unseenNotifications.push({
      type: "Appointment Request Sent",
      message: `Your appointment request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been sent.`,
      onClickPath: "/appointments",
    });

    await Promise.all([doctor.save(), bookingUser.save()]);
    console.log("DEBUG: Doctor and user updated.");

    await Promise.all([
      sendEmail({
        to: bookingUser.email,
        subject: "Appointment Request Sent",
        html: `<h3>Hello ${bookingUser.name},</h3>
               <p>Your appointment request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been sent.</p>
               <p><strong>Date:</strong> ${date}</p>
               <p><strong>Time:</strong> ${startTime} - ${endTime}</p>`,
      }),
      sendEmail({
        to: doctor.email,
        subject: "New Appointment Request",
        html: `<h3>Hello Dr. ${doctorInfo.firstName} ${doctorInfo.lastName},</h3>
               <p>You have a new appointment request from ${bookingUser.name}.</p>
               <p><strong>Date:</strong> ${date}</p>
               <p><strong>Time:</strong> ${startTime} - ${endTime}</p>`,
      }),
    ]);
    console.log("DEBUG: Emails sent.");

    res.status(200).json({
      success: true,
      message: "Appointment booked and notifications sent.",
    });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


module.exports = router;





