import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, message, Spin, Button } from "antd";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all appointments for logged-in doctor
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("/api/doctor/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAppointments(res.data.data);
      } else {
        message.error(res.data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      message.error("Server error while fetching appointments");
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject appointment
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "/api/doctor/change-appointment-status",
        { appointmentId: id, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        message.success(`Appointment ${status} successfully`);

        // Refresh list after status update
        fetchAppointments();
      } else {
        message.error(res.data.message || "Error updating appointment");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Server error while updating appointment");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const columns = [
    { title: "Patient Name", dataIndex: "patientName", key: "patientName" },
    { title: "Email", dataIndex: "patientEmail", key: "patientEmail" },
    { title: "Phone", dataIndex: "patientPhone", key: "patientPhone" },
    { title: "Date", dataIndex: "formattedDate", key: "date" },
    { title: "Time", dataIndex: "formattedTime", key: "time" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <span style={{ textTransform: "capitalize" }}>{status}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          {record.status === "pending" && (
            <>
              <button
                className="btn btn-success btn-sm me-2"
                onClick={() => updateStatus(record._id, "approved")}
              >
                Approve
              </button>
              <button
                className="btn btn-danger btn-sm me-2"
                onClick={() => updateStatus(record._id, "rejected")}
              >
                Reject
              </button>
            </>
          )}
          <Button onClick={() => navigate(`/doctor/patient-details/${record.userId}`)}>
            View Details
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h3 className="page-title mb-4">Doctor Appointments</h3>
      {loading ? (
        <Spin size="large" tip="Loading appointments..." />
      ) : (
        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
};

export default DoctorAppointments;




















