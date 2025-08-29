import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { Card, Form, Input, Button, message, Spin } from "antd";

function PatientDetails() {
  const { userId } = useParams();
  const { user } = useSelector((state) => state.user); // logged-in doctor
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch patient info + medical history
  const fetchPatientData = async () => {
    try {
      const res = await axios.get(`/api/doctor/patient-history/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        setPatient(res.data.patient); // patient info
        setHistory(res.data.data);    // medical history array
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching patient history");
    } finally {
      setLoading(false);
    }
  };

  // Add new medical record
  const onFinish = async (values) => {
    try {
      const res = await axios.post(
        `/api/doctor/add-medical-record/${userId}`,
        { ...values, doctorId: user._id }, // include doctorId
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        message.success("Record added successfully");
        setHistory(res.data.data); // refresh history
      }
    } catch (err) {
      console.error(err);
      message.error("Error adding record");
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [userId]);

  if (loading) return <Spin size="large" tip="Loading patient details..." />;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Patient Details</h2>

      {/* Patient Info */}
      {patient && (
        <Card title="Patient Information" className="mb-4 shadow">
          <p><b>Name:</b> {patient.name}</p>
          <p><b>Email:</b> {patient.email}</p>
        </Card>
      )}

      {/* Medical History */}
      <h3 className="text-lg font-semibold mt-6 mb-3">Medical History</h3>
      {history.length > 0 ? (
        history.map((record, index) => (
          <Card key={index} className="mb-3 shadow">
            <p><b>Date:</b> {new Date(record.date).toLocaleString()}</p>
            <p>
              <b>Doctor:</b> Dr. {record.doctorId?.name || "N/A"} ({record.doctorId?.specialization || "N/A"})
            </p>
            <p><b>Diagnosis:</b> {record.diagnosis || "N/A"}</p>
            <p><b>Treatment:</b> {record.treatment || "N/A"}</p>
            <p><b>Notes:</b> {record.notes || "N/A"}</p>
          </Card>
        ))
      ) : (
        <p>No medical history available.</p>
      )}

      {/* Add New Record */}
      <h3 className="text-lg font-semibold mt-6 mb-3">Add New Record</h3>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Diagnosis" name="diagnosis" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Treatment" name="treatment">
          <Input />
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Button type="primary" htmlType="submit">Add Record</Button>
      </Form>
    </div>
  );
}

export default PatientDetails;







