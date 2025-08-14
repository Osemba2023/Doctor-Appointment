const cron = require("node-cron");
const moment = require("moment");
const Appointment = require("./models/appointmentModel");
const User = require("./models/UserModel");
const sendEmail = require("./utils/sendEmail");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const tomorrowStart = moment().add(1, "days").startOf("day");
    const tomorrowEnd = moment().add(1, "days").endOf("day");

    // Find appointments happening tomorrow that are already approved
    const appointments = await Appointment.find({
      start: { $gte: tomorrowStart.toDate(), $lte: tomorrowEnd.toDate() },
      status: "approved",
    }).populate("userId doctorId");

    for (const appt of appointments) {
      const user = await User.findById(appt.userId);
      if (!user) continue;

      const formattedDate = moment(appt.start).format("dddd, MMMM D, YYYY");
      const formattedTimeRange = `${moment(appt.start).format("h:mm A")} - ${moment(appt.end).format("h:mm A")}`;

      await sendEmail({
        to: user.email,
        subject: "Appointment Reminder",
        html: `
          <h3>Hello ${user.name},</h3>
          <p>This is a friendly reminder about your upcoming appointment.</p>
          <p><strong>Doctor:</strong> Dr. ${appt.doctorInfo.firstName} ${appt.doctorInfo.lastName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTimeRange}</p>
          <p>Please make sure to arrive a few minutes early.</p>
        `,
      });
    }

    console.log("✅ Reminders sent for tomorrow's appointments.");
  } catch (err) {
    console.error("🚨 Error sending reminders:", err);
  }
});


