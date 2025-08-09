import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, message } from 'antd';
import axios from 'axios';
import Layout from '../../components/Layout';

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/doctor/get-appointments-by-doctor-id', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      setLoading(false);

      if (res.data.success) {
        setAppointments(res.data.data);
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      setLoading(false);
      message.error("Failed to fetch appointments");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const columns = [
    {
      title: 'Patient',
      dataIndex: 'userId',
      render: user => user?.name || 'N/A'
    },
    {
      title: 'Email',
      dataIndex: 'userId',
      render: user => user?.email || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: status => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    }
  ];

  return (
    <Layout>
      <h1 className="page-title">My Appointments</h1>
      {loading ? <Spin /> : <Table columns={columns} dataSource={appointments} rowKey="_id" />}
    </Layout>
  );
}

export default DoctorAppointments;


