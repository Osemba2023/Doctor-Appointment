
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

    console.log("📥 Booking availability payload:", req.body);

    // Convert date and time into dayjs objects
    const selectedDate = dayjs(date, "YYYY-MM-DD");
    const fromTime = dayjs(`${date} ${startTime}`, "YYYY-MM-DD HH:mm");
    const toTime = dayjs(`${date} ${endTime}`, "YYYY-MM-DD HH:mm");

    console.log("🗓 Selected Date:", selectedDate.format());
    console.log("⏳ From Time:", fromTime.format());
    console.log("⏳ To Time:", toTime.format());

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
      return res.status(200).json({
        success: false,
        message: "Doctor is not available for this time slot.",
      });
    }

    // ✅ If all checks pass
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

router.post('/book-appointment', authMiddleware, async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;
    const userId = req.user.id;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const startDateTime = moment(`${date} ${startTime}`, "YYYY-MM-DD HH:mm").toDate();
    const endDateTime = moment(`${date} ${endTime}`, "YYYY-MM-DD HH:mm").toDate();

    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      return res.status(400).json({ success: false, message: 'Invalid date or time.' });
    }

    if (startDateTime >= endDateTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    const bookingUser = await User.findById(userId);
    const doctorInfo = await Doctor.findById(doctorId);
    if (!bookingUser || !doctorInfo) {
      return res.status(404).json({ success: false, message: 'User or doctor not found.' });
    }

    const doctorUser = await User.findById(doctorInfo.userId);
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: "Doctor's user not found." });
    }

    // Check for overlapping appointments
    const overlap = await Appointment.findOne({
      doctorId,
      status: { $in: ['approved', 'pending'] },
      $or: [{ start: { $lt: endDateTime }, end: { $gt: startDateTime } }],
    });
    if (overlap) {
      return res.status(409).json({ success: false, message: 'Time slot already booked.' });
    }

    // Format dates for email
    const formattedDate = moment(startDateTime).format("dddd, MMMM D, YYYY");
    const formattedTimeRange = `${moment(startDateTime).format("h:mm A")} - ${moment(endDateTime).format("h:mm A")}`;

    // Save appointment
    const newAppointment = new Appointment({
      doctorId,
      userId,
      doctorInfo: {
        firstName: doctorInfo.firstName,
        lastName: doctorInfo.lastName,
        specialization: doctorInfo.specialization
      },
      userInfo: {
        name: bookingUser.name,
        email: bookingUser.email
      },
      start: startDateTime,
      end: endDateTime,
      formattedDate,        // Save these
      formattedTimeRange,   // Save these
      status: 'pending',
    });

    await newAppointment.save();

    // Add in-app notifications
    doctorUser.unseenNotifications.push({
      type: "New Appointment Request",
      message: `New appointment request from ${bookingUser.name}`,
      onClickPath: `/doctor-appointments/${newAppointment._id}`,
    });

    bookingUser.unseenNotifications.push({
      type: "Appointment Request Sent",
      message: `Your request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been sent.`,
      onClickPath: "/appointments",
    });

    await Promise.all([doctorUser.save(), bookingUser.save()]);

    // Send email notifications
    try {
      await Promise.all([
        sendEmail({
          to: bookingUser.email,
          subject: "Appointment Request Sent",
          html: `
            <h2>Appointment Request</h2>
            <p>Dear ${bookingUser.name},</p>
            <p>Your appointment request with Dr. ${doctorInfo.firstName} ${doctorInfo.lastName} has been received.</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTimeRange}</p>
            <p>Status: Pending Approval</p>
          `
        }),
        sendEmail({
          to: doctorUser.email,
          subject: "New Appointment Request",
          html: `
            <h2>New Appointment Request</h2>
            <p>Dear Dr. ${doctorInfo.firstName},</p>
            <p>You have a new appointment request from ${bookingUser.name}.</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTimeRange}</p>
            <p>Please log in to your account to approve or reject this request.</p>
          `
        })
      ]);
    } catch (emailErr) {
      console.error("📧 Email send failed:", emailErr.message);
    }

    res.status(200).json({ success: true, message: 'Appointment booked successfully.' });

  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// ✅ Get single appointment details by ID
router.get('/appointment/details/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email');
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get single appointment by ID
router.get("/appointments/:appointmentId", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("userId", "name email");
    if (!appointment) {
      return res.status(404).send({ success: false, message: "Appointment not found" });
    }
    res.status(200).send({ success: true, data: appointment });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error fetching appointment", error: error.message });
  }
});
// Get appointment details by appointmentId
router.get('/details/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email'); // populate patient info
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/update-appointment-status', authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!appointmentId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID or status.' });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Log appointment object for debugging
    console.log("Fetched appointment:", appointment);
    console.log("appointment.start:", appointment.start);
    console.log("appointment.end:", appointment.end);

    // Defensive check for missing date/time before formatting
    if (!appointment.start || !appointment.end) {
      console.error('Missing start or end date on appointment:', appointment);
      return res.status(400).json({ success: false, message: 'Appointment date/time is incomplete.' });
    }

    // Validate moment date parsing inside try/catch
    let startMoment, endMoment;
    try {
      startMoment = moment(appointment.start);
      endMoment = moment(appointment.end);
      if (!startMoment.isValid() || !endMoment.isValid()) {
        console.error('Invalid moment date:', appointment.start, appointment.end);
        return res.status(400).json({ success: false, message: 'Appointment date/time is invalid.' });
      }
    } catch (momentErr) {
      console.error('Error parsing appointment dates with moment:', momentErr);
      return res.status(500).json({ success: false, message: 'Error processing appointment dates.' });
    }

    // Confirm user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found.' });
    }

    // Find doctor profile linked to this user
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Unauthorized: doctor profile not found.' });
    }

    // Check that appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: cannot update this appointment.' });
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Format dates safely
    const formattedDate = startMoment.format('dddd, MMMM D, YYYY');
    const formattedTimeRange = `${startMoment.format('h:mm A')} - ${endMoment.format('h:mm A')}`;

    // Find patient info (user who booked)
    const patient = await User.findById(appointment.userId);
    if (!patient) {
      console.error("Patient not found for appointment:", appointment.userId);
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Send email to patient about status change
    if (status === 'approved') {
      await sendEmail({
        to: patient.email,
        subject: 'Appointment Approved',
        html: `
          <h2>Appointment Approved</h2>
          <p>Dear ${patient.name},</p>
          <p>Your appointment with Dr. ${appointment.doctorInfo.firstName} ${appointment.doctorInfo.lastName} has been approved.</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTimeRange}</p>
          <p>Thank you for using our service.</p>
        `,
      });
    } else if (status === 'rejected') {
      await sendEmail({
        to: patient.email,
        subject: 'Appointment Rejected',
        html: `
          <h2>Appointment Rejected</h2>
          <p>Dear ${patient.name},</p>
          <p>Unfortunately, your appointment request with Dr. ${appointment.doctorInfo.firstName} ${appointment.doctorInfo.lastName} has been rejected.</p>
          <p>Please consider booking another time.</p>
        `,
      });
    }

    res.status(200).json({ success: true, message: `Appointment ${status} successfully.` });

  } catch (error) {
    console.error("❌ Error updating appointment:", error.stack || error);
    res.status(500).json({ success: false, message: 'Error updating appointment.', error: error.message });
  }
});


module.exports = router;





