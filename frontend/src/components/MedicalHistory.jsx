import React, { useEffect, useState } from "react";
import axios from "axios";

const MedicalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/user/my-history") // fetch logged-in patient history
      .then(res => {
        setHistory(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching medical history:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading medical history...</p>;

  return (
    <div>
      <h2>Medical History</h2>
      {history.length > 0 ? (
        history.map((record) => (
          <div key={record._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
            <p><strong>Date:</strong> {new Date(record.date).toLocaleString()}</p>
            <p>
              <strong>Doctor:</strong>{" "}
              {record.doctorId
                ? `Dr. ${record.doctorId.firstName} ${record.doctorId.lastName} (${record.doctorId.specialization})`
                : "N/A"}
            </p>
            <p><strong>Diagnosis:</strong> {record.diagnosis || "N/A"}</p>
            <p><strong>Treatment:</strong> {record.treatment || "N/A"}</p>
            <p><strong>Notes:</strong> {record.notes || "N/A"}</p>
          </div>
        ))
      ) : (
        <p>No medical history available.</p>
      )}
    </div>
  );
};

export default MedicalHistory;



