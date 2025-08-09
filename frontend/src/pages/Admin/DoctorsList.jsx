import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../../redux/alertsSlice';
import axios from 'axios';
import { Table, Tag, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';


function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getDoctorsData = useCallback(async () => {
    try {
      dispatch(showLoading());
      const res = await axios.get('/api/admin/get-all-doctors', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      dispatch(hideLoading());

      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Error fetching doctors:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    getDoctorsData();
  }, [getDoctorsData]);

  const handleStatusChange = async (record, status) => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        '/api/admin/change-doctor-status',
        {
          doctorId: record._id,
          userId: record.userId,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
        getDoctorsData(); // refresh list
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error("Something went wrong");
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: '',
      key: 'name',
      render: (record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Specialization',
      dataIndex: 'specialization',
      key: 'specialization',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={
            status === 'approved' ? 'green' :
            status === 'pending' ? 'orange' : 'red'
          }
        >
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      dataIndex: '',
      key: 'actions',
      render: (record) => (
        record.status === 'pending' && (
          <div className="d-flex gap-2">
            <Button
              type="primary"
              onClick={() => handleStatusChange(record, 'approved')}
            >
              Approve
            </Button>
            <Button
              danger
              onClick={() => handleStatusChange(record, 'rejected')}
            >
              Reject
            </Button>
          </div>
        )
      ),
    },
  ];

  return (
    <>
      <h1 className="page-title">Doctors List</h1>
      <hr/>
      <Table
        columns={columns}
        dataSource={doctors}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
        onRow={(record) => ({
          onClick: () => navigate(`/profile/${record.userId}`),
        })}
      />
    </>
  );
}

export default DoctorsList;




