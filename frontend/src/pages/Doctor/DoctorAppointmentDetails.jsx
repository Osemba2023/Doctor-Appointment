import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function DoctorAppointmentDetails() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);

  // Fetch appointment details
  const fetchAppointment = async () => {
    try {
      const res = await axios.get(`/api/appointment/details/${appointmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        setAppointment(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to fetch appointment");
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Error fetching appointment details");
    }
  };

  // Change appointment status
  const changeStatus = async (status) => {
    try {
      const res = await axios.post(
        "/api/doctor/change-appointment-status",
        { appointmentId, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        toast.success(`Appointment ${status} successfully`);
        navigate("/doctor/appointments");
      } else {
        toast.error(res.data.message || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error updating appointment");
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  if (!appointment) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Appointment Details</h2>

      <p><strong>Patient:</strong> {appointment.userInfo?.name || appointment.userId?.name || "Unknown"}</p>
      <p><strong>Date:</strong> {appointment.formattedDate || "No date provided"}</p>
      <p><strong>Time:</strong> {appointment.formattedTimeRange || "No time provided"}</p>
      <p><strong>Status:</strong> {appointment.status}</p>

      {appointment.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-success"
            onClick={() => changeStatus("approved")}   // ✅ use changeStatus
          >
            Approve
          </button>
          <button
            className="btn btn-danger"
            onClick={() => changeStatus("rejected")}   // ✅ use changeStatus
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointmentDetails;














