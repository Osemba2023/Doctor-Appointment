// utils/suggestNextSlots.js
const moment = require("moment");
const Appointment = require("../models/appointmentModel");

async function suggestNextSlots(doctorId, afterTime, slotMinutes = 30, maxSuggestions = 3, maxDays = 7) {
  const suggestions = [];
  let candidateTime = moment(afterTime);
  let daysChecked = 0;

  while (suggestions.length < maxSuggestions && daysChecked < maxDays) {
    const slotEnd = moment(candidateTime).add(slotMinutes, "minutes");

    const slotTaken = await Appointment.findOne({
      doctorId,
      status: { $in: ["approved", "pending"] },
      $or: [
        { start: { $lt: slotEnd.toDate() }, end: { $gt: candidateTime.toDate() } }
      ]
    });

    if (!slotTaken) {
      suggestions.push({
        date: candidateTime.format("YYYY-MM-DD"),
        start: candidateTime.format("HH:mm"),
        end: slotEnd.format("HH:mm")
      });
    }

    candidateTime.add(slotMinutes, "minutes");

    if (candidateTime.hour() >= 18) { // after working hours
      candidateTime.add(1, "day").hour(9).minute(0); // next working day at 9 AM
      daysChecked++;
    }
  }

  return suggestions;
}

module.exports = suggestNextSlots;

