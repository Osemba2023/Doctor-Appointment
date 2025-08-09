import React from "react";
import { useNavigate } from "react-router-dom";

function Doctor({ doctor }) {
  const navigate = useNavigate();

  return (
    <div
      className="card p-3 cursor-pointer mb-3"
      onClick={() => navigate(`/book-appointment/${doctor.userId}`)}
    >
      <h3 className="card-title">Dr. {doctor.firstName} {doctor.lastName}</h3>
      <hr />
      <div className="doctor-info">
        <p><strong>Specialization:</strong> {doctor.specialization}</p>
        <p><strong>Phone:</strong> {doctor.phoneNumber}</p>
        <p><strong>Address:</strong> {doctor.address}</p>
        <p><strong>Consultation Fee:</strong> KES {doctor.consultationFee}</p>
        <p><strong>Timings:</strong> {doctor.timings?.[0]} - {doctor.timings?.[1]}</p>
      </div>
    </div>
  );
}

export default Doctor;






