// scripts/updateDoctorNotifications.js
require("dotenv").config(); // Load .env
const mongoose = require("mongoose");
const User = require("../models/UserModel");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");

// Connect to MongoDB using MONGO_URL from .env
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function updateDoctorNotifications() {
  try {
    const doctors = await Doctor.find();
    console.log("Doctors raw:", doctors);
    console.log(`Found ${doctors.length} doctors.`);

    if (doctors.length === 0) {
      console.warn("⚠️ No doctors found. Make sure your database has doctor documents.");
      return;
    }

    for (const doctor of doctors) {
      const doctorUser = await User.findById(doctor.userId);
      if (!doctorUser) continue;

      let updatedCount = 0;

      // Update unseenNotifications
      for (let i = 0; i < doctorUser.unseenNotifications.length; i++) {
        const notif = doctorUser.unseenNotifications[i];

        if (notif.type === "New Appointment Request" && notif.appointmentId) {
          const appointment = await Appointment.findById(notif.appointmentId);
          if (!appointment) continue;

          const startDate = new Date(appointment.start);

          doctorUser.unseenNotifications[i] = {
            ...notif,
            message: `New appointment request from ${appointment.userInfo.name} on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            onClickPath: `/doctor/appointments/details/${appointment._id}`,
          };

          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await doctorUser.save();
        console.log(`✅ Updated ${updatedCount} notifications for doctor: ${doctor.firstName} ${doctor.lastName}`);
      }
    }

    console.log("🎉 All doctor notifications updated successfully!");
  } catch (error) {
    console.error("❌ Error updating notifications:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the update
updateDoctorNotifications();







