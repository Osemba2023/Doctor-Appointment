import React, { useEffect, useState } from "react";
import axios from "axios";
import MedicalHistory from "../../components/MedicalHistory";

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data) {
          setPatient(res.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patient?._id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/doctor/patient-history/${patient._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching medical history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patient]);

  if (loading) return <p>Loading profile...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Profile</h1>
      <p><strong>Name:</strong> {patient?.name}</p>
      <p><strong>Email:</strong> {patient?.email}</p>
      <p><strong>Phone:</strong> {patient?.phoneNumber || "N/A"}</p>

      <h2>Medical History</h2>
      {history.length === 0 && <p>No medical history available.</p>}
      {history.map((record) => (
        <div key={record._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
          <p><strong>Date:</strong> {new Date(record.date || record.createdAt).toLocaleString()}</p>
          <p>
            <strong>Doctor:</strong> Dr. {record.doctorId?.firstName || "N/A"} ({record.doctorId?.specialization || "N/A"})
          </p>
          <p><strong>Diagnosis:</strong> {record.diagnosis || "N/A"}</p>
          <p><strong>Treatment:</strong> {record.treatment || "N/A"}</p>
          <p><strong>Notes:</strong> {record.notes || "N/A"}</p>
        </div>
      ))}
    </div>
  );
};

export default PatientProfile;






