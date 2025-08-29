
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Doctor = require("../models/doctorModel");
const User = require("../models/UserModel");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const sendEmail = require('../utils/sendEmails');
const suggestNextSlots = require("../utils/suggestNextSlots");




// ✅ Route to check doctor's booking availability
router.post("/booking-availability", authMiddleware, async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "doctorId, date, startTime, and endTime are required.",
      });
    }

    const selectedDate = dayjs(date, "YYYY-MM-DD");
    const fromTime = dayjs(`${date} ${startTime}`, "YYYY-MM-DD HH:mm");
    const toTime = dayjs(`${date} ${endTime}`, "YYYY-MM-DD HH:mm");

    // Sunday rule
    if (selectedDate.day() === 0) {
      return res.status(400).json({
        success: false,
        message: "Appointments cannot be booked on Sundays",
      });
    }

    // Saturday rule (after 4 PM)
    if (selectedDate.day() === 6 && fromTime.hour() >= 16) {
      return res.status(400).json({
        success: false,
        message: "On Saturdays, appointments must be before 4 PM",
      });
    }

    // Past date rule
    if (selectedDate.isBefore(dayjs(), "day")) {
      return res.status(400).json({
        success: false,
        message: "Cannot book for past dates",
      });
    }

    // Time validation
    if (fromTime.isSameOrAfter(toTime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    // Overlap check
    const overlappingAppointment = await Appointment.findOne({
      doctorId,
      status: { $in: ["approved", "pending"] },
      $or: [
        { start: { $lt: toTime.toDate() }, end: { $gt: fromTime.toDate() } },
      ],
    });

    if (overlappingAppointment) {
      const suggestions = [];
      let searchTime = toTime.clone(); // Start after requested end time
      let daysSearched = 0;

      while (suggestions.length < 3 && daysSearched < 14) { // Search up to 2 weeks ahead
        const currentDay = searchTime.day();

        // Skip Sundays
        if (currentDay !== 0) {
          // Skip Saturday after 4 PM
          if (!(currentDay === 6 && searchTime.hour() >= 16)) {
            const endCandidate = searchTime.add(30, "minute");

            const conflict = await Appointment.findOne({
              doctorId,
              status: { $in: ["approved", "pending"] },
              $or: [
                { start: { $lt: endCandidate.toDate() }, end: { $gt: searchTime.toDate() } },
              ],
            });

            if (!conflict) {
              suggestions.push({
                start: searchTime.format("HH:mm"),
                end: endCandidate.format("HH:mm"),
                date: searchTime.format("YYYY-MM-DD"),
              });
            }
          }
        }

        searchTime = searchTime.add(30, "minute");

        // If past 6 PM, jump to next day at 9 AM
        if (searchTime.hour() >= 18) {
          searchTime = searchTime.add(1, "day").hour(9).minute(0);
          daysSearched++;
        }
      }

      return res.status(200).json({
        success: false,
        message: "Doctor is not available for this time slot.",
        suggestions,
      });
    }

    // ✅ Available
    res.status(200).json({
      success: true,
      message: "Doctor is available for this time slot.",
    });

  } catch (error) {
    console.error("❌ Availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// ✅ Route to book an appointment
router.post("/book-appointment", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId, date, startTime, endTime } = req.body;
    const userId = req.user.id;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const startDateTime = moment(`${date} ${startTime}`, "YYYY-MM-DD HH:mm").toDate();
    const endDateTime = moment(`${date} ${endTime}`, "YYYY-MM-DD HH:mm").toDate();

    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      return res.status(400).json({ success: false, message: "Invalid date or time." });
    }

    if (startDateTime >= endDateTime) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    const bookingUser = await User.findById(userId).session(session);
    const doctorInfo = await Doctor.findById(doctorId).session(session);
    if (!bookingUser || !doctorInfo) {
      return res.status(404).json({ success: false, message: "User or doctor not found." });
    }

    const doctorUser = await User.findById(doctorInfo.userId).session(session);
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: "Doctor's user not found." });
    }

    // Check overlapping appointments
    const overlap = await Appointment.findOne({
      doctorId,
      status: { $in: ["approved", "pending"] },
      $or: [{ start: { $lt: endDateTime }, end: { $gt: startDateTime } }],
    }).session(session);

    if (overlap) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Time slot already booked." });
    }

    // Format dates for frontend display
    const formattedDate = moment(startDateTime).format("dddd, MMMM D, YYYY");
    const formattedTimeRange = `${moment(startDateTime).format("h:mm A")} - ${moment(endDateTime).format("h:mm A")}`;

    // Save appointment
    const newAppointment = new Appointment({
      doctorId,
      userId,
      doctorInfo: {
        firstName: doctorInfo.firstName,
        lastName: doctorInfo.lastName,
        specialization: doctorInfo.specialization,
      },
      userInfo: {
        name: bookingUser.name,
        email: bookingUser.email,
        phone: bookingUser.phoneNumber,
      },
      start: startDateTime,
      end: endDateTime,
      status: "pending",
    });
    await newAppointment.save();

    // Notifications
    doctorUser.unseenNotifications.push({
      type: "New Appointment Request",
      message: `New appointment request from ${bookingUser.name} on ${formattedDate} at ${formattedTimeRange}`,
      onClickPath: `/doctor/appointments/details/${newAppointment._id}`,
    });

    bookingUser.unseenNotifications.push({
      type: "Appointment Request Sent",
      message: `Your request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} on ${formattedDate} at ${formattedTimeRange} has been sent.`,
      onClickPath: "/appointments",
    });

    await Promise.all([doctorUser.save({ session }), bookingUser.save({ session })]);

    console.log("📧 Sending email to:", bookingUser.email);
    console.log("Using SMTP USER:", process.env.EMAIL_USERNAME);
    console.log("Using SMTP PASS exists:", !!process.env.EMAIL_PASSWORD);



    // ----------------------
    // ✅ Send emails safely
    try {
      await sendEmail({
        to: bookingUser.email,
        subject: "Appointment Request Sent",
        text: `Your appointment with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been received for ${formattedDate} at ${formattedTimeRange}. Status: Pending Approval.`,
        html: `
          <h2>Appointment Request</h2>
          <p>Dear ${bookingUser.name},</p>
          <p>Your appointment request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been received.</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTimeRange}</p>
          <p>Status: Pending Approval</p>
        `,
      });
    } catch (err) {
      console.error("Failed to send email to user:", err.message);
    }

    try {
      await sendEmail({
        to: doctorUser.email,
        subject: "New Appointment Request",
        text: `New appointment request from ${bookingUser.name} on ${formattedDate} at ${formattedTimeRange}.`,
        html: `
          <h2>New Appointment Request</h2>
          <p>Dear Dr. ${doctorInfo.firstName},</p>
          <p>You have a new appointment request from ${bookingUser.name}.</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTimeRange}</p>
          <p>Please log in to your account to approve or reject this request.</p>
        `,
      });
    } catch (err) {
      console.error("Failed to send email to doctor:", err.message);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Appointment booked successfully." });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Booking Error:", error);
    console.error("Stack Trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
// ----------------------
// Get details for a single appointment
router.get('/details/:id', authMiddleware, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name email')    // populate user name & email
      .populate('doctorId', 'firstName lastName'); // optional doctor info

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ensure formatted fields exist
    const formattedDate = appointment.formattedDate || moment(appointment.start).format('YYYY-MM-DD');
    const formattedTimeRange = appointment.formattedTimeRange || `${moment(appointment.start).format('HH:mm')} - ${moment(appointment.end).format('HH:mm')}`;

    res.json({
      success: true,
      data: {
        ...appointment.toObject(),
        formattedDate,
        formattedTimeRange,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post("/update-appointment-status", authMiddleware, async (req, res) => {
  try {
    console.log("📩 Request body:", req.body);

    const { appointmentId, status } = req.body;
    if (!appointmentId || !status) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ success: false, message: "Missing appointmentId or status" });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.log("❌ Appointment not found");
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    console.log("✅ Appointment found:", appointment);

    // Update status
    appointment.status = status;
    await appointment.save();
    console.log("✅ Status updated in DB");

    // Find doctor & patient users
    const doctor = await Doctor.findById(appointment.doctorId);
    const doctorUser = doctor ? await User.findById(doctor.userId) : null;
    const patientUser = await User.findById(appointment.userId);

    // ✅ Notify doctor
    if (doctorUser) {
      doctorUser.unseenNotifications.push({
        type: "appointment-status-updated",
        message: `Your appointment with ${patientUser?.name || "a patient"} has been ${status}.`,
        onClickPath: `/doctor/appointments/details/${appointment._id}`, // fixed path
      });
      await doctorUser.save();
    }

    // ✅ Notify patient
    if (patientUser) {
      patientUser.unseenNotifications.push({
        type: "appointment-status-updated",
        message: `Your appointment with Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""} has been ${status}.`,
        onClickPath: "/appointments", // patient dashboard
      });
      await patientUser.save();
    }

    // ✅ Try sending email (doesn't break API if fails)
    try {
      const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Your Doctor";
      const appointmentDate = appointment.date
        ? new Date(appointment.date).toLocaleDateString()
        : "Scheduled Date";

      let subject = "";
      let text = "";

      if (status === "approved") {
        subject = "Appointment Approved";
        text = `Hello ${patientUser?.name},\n\nYour appointment with ${doctorName} on ${appointmentDate} has been approved.\n\nThank you.`;
      } else if (status === "rejected") {
        subject = "Appointment Rejected";
        text = `Hello ${patientUser?.name},\n\nUnfortunately, your appointment with ${doctorName} on ${appointmentDate} has been rejected.\n\nPlease book again.`;
      }

      if (patientUser?.email) {
        await sendEmail({ to: patientUser.email, subject, text });
        console.log("✅ Email sent successfully");
      } else {
        console.log("⚠ No email found for patient");
      }
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr.message);
    }

    // Final response
    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully.`,
    });

  } catch (err) {
    console.error("❌ Server error at /update-appointment-status:", err.stack || err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;





