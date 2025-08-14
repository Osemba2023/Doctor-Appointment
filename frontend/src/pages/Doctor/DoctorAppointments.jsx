// DoctorAppointments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "/api/doctor/get-appointments-by-doctor-id",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (res.data.success) {
        setAppointments(res.data.data || []);
      } else {
        toast.error("Failed to fetch appointments");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <p>Loading appointments...</p>;

  return (
    <div>
      <h2>My Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments found</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => {
              const start = appt.start
                ? new Date(appt.start).toLocaleString()
                : "N/A";
              return (
                <tr key={appt._id}>
                  <td>{appt.userInfo?.name || appt.userId?.name || "Unknown"}</td>
                  <td>{start.split(",")[0]}</td>
                  <td>{start.split(",")[1]}</td>
                  <td>{appt.status}</td>
                  <td>
                    <Link
                      to={`/doctor-appointment-details/${appt._id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DoctorAppointments;





