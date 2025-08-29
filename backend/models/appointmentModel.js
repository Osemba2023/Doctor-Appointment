const mongoose = require("mongoose");
const moment = require("moment");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorInfo: { type: Object, required: true },
    userInfo: { type: Object, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "approved", "rejected"],
    },
  },
  { timestamps: true }
);

// Virtual for formatted date (not stored in DB)
appointmentSchema.virtual("formattedDate").get(function () {
  return this.start ? moment(this.start).format("YYYY-MM-DD") : "Not set";
});

// Virtual for formatted time range (not stored in DB)
appointmentSchema.virtual("formattedTimeRange").get(function () {
  return this.start && this.end
    ? `${moment(this.start).format("HH:mm")} - ${moment(this.end).format("HH:mm")}`
    : "Not set";
});

// Ensure virtuals are included in JSON and object outputs
appointmentSchema.set("toJSON", { virtuals: true });
appointmentSchema.set("toObject", { virtuals: true });

// Prevent OverwriteModelError in watch mode
const Appointment =
  mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;













