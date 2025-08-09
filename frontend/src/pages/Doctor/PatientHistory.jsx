import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Form, Input, Button, Card, Typography } from 'antd';
import toast from 'react-hot-toast';

const { Title, Paragraph } = Typography;

function PatientHistory() {
  const { userId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/doctor/patient-history/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setHistory(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const onFinish = async (values) => {
    try {
      const payload = { ...values, patientId: userId };
      await axios.post('/api/doctor/add-history', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Medical history added');
      fetchHistory(); // refresh list
    } catch (err) {
      toast.error('Error adding history');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={3}>Patient Medical History</Title>

      {loading ? (
        <Paragraph>Loading...</Paragraph>
      ) : history.length === 0 ? (
        <Paragraph>No medical history found.</Paragraph>
      ) : (
        history.map((entry, index) => (
          <Card key={index} style={{ marginBottom: '16px' }}>
            <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
            <p><strong>Diagnosis:</strong> {entry.diagnosis}</p>
            <p><strong>Prescription:</strong> {entry.prescription}</p>
            <p><strong>Notes:</strong> {entry.description}</p>
          </Card>
        ))
      )}

      <Title level={4}>Add New Medical Entry</Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Diagnosis"
          name="diagnosis"
          rules={[{ required: true, message: 'Diagnosis is required' }]}
        >
          <Input.TextArea rows={2} placeholder="Diagnosis" />
        </Form.Item>
        <Form.Item label="Prescription" name="prescription">
          <Input.TextArea rows={2} placeholder="Prescribed Medication" />
        </Form.Item>
        <Form.Item label="Additional Notes" name="description">
          <Input.TextArea rows={3} placeholder="Notes or symptoms..." />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Add Entry
        </Button>
      </Form>
    </div>
  );
}

export default PatientHistory;


