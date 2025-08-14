import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Table, message, Spin } from "antd";
import moment from "moment";

const PatientsHistory = () => {
  const { userId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPatientHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/doctor/get-patient-history/${userId}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (res.data.success) {
        setHistory(res.data.data);
      } else {
        message.error(res.data.message || "Failed to fetch history");
      }
    } catch (error) {
      console.error(error);
      message.error("Error fetching patient history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPatientHistory();
  }, [userId]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => moment(text).format("DD-MM-YYYY"),
    },
    {
      title: "Doctor",
      dataIndex: ["doctorId", "name"],
      key: "doctor",
      render: (name) => name || "Unknown Doctor",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Diagnosis",
      dataIndex: "diagnosis",
      key: "diagnosis",
    },
    {
      title: "Prescription",
      dataIndex: "prescription",
      key: "prescription",
    },
  ];

  return (
    <div>
      <h2>Patient Medical History</h2>
      {loading ? (
        <Spin size="large" />
      ) : history.length > 0 ? (
        <Table
          columns={columns}
          dataSource={history}
          rowKey={(record) => record._id || record.date}
        />
      ) : (
        <p>No medical history available for this patient.</p>
      )}
    </div>
  );
};

export default PatientsHistory;




