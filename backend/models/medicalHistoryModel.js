// models/medicalHistoryModel.js
const mongoose = require("mongoose");

const medicalHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  diagnosis: { type: String, required: true },
  treatment: { type: String, required: true },
  notes: { type: String },
}, { timestamps: true });

const MedicalHistory = mongoose.models.MedicalHistory || mongoose.model("MedicalHistory", medicalHistorySchema);
module.exports = MedicalHistory;
