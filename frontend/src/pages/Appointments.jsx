import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '@/redux/alertsSlice';
import axios from 'axios';
import { Table, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getAppointmentsData = useCallback(async () => {
    try {
      dispatch(showLoading());
      const res = await axios.get('/api/user/get-appointments-by-user-id', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(hideLoading());

      if (res.data.success) {
        setAppointments(res.data.data);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error fetching appointments:", error);
      message.error("Failed to fetch appointments");
    }
  }, [dispatch]);

  const columns = [
    {
      title: 'Appointment ID',
      dataIndex: '_id',
    },
    {
      title: 'Doctor',
      render: (text, record) => (
        <span>{record.doctorInfo?.firstName} {record.doctorInfo?.lastName}</span>
      ),
    },
    {
      title: 'Phone',
      render: (text, record) => (
        <span>{record.doctorInfo?.phoneNumber}</span>
      ),
    },
    {
      title: 'Date & Time',
      render: (text, record) => (
        <span>{moment(record.date).format("DD-MM-YYYY")} {moment(record.time).format("HH:mm")}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
  ];

  useEffect(() => {
    getAppointmentsData();
  }, [getAppointmentsData]);

  return (
    <>
      <h1 className="page-title">Appointments</h1>
      <hr/>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
        onRow={(record) => ({
          onClick: () => navigate(`/profile/${record.userId}`),
        })}
      />
    </>
  );
}

export default Appointments;


