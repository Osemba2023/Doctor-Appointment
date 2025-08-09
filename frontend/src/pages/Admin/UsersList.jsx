import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../../redux/alertsSlice';
import axios from 'axios';
import { Table, Tag, Button, message, Input } from 'antd';
import moment from 'moment';
import { render } from '@testing-library/react';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const dispatch = useDispatch();

  const getUsersData = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.get('/api/admin/get-all-users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      dispatch(hideLoading());
      if (res.data.success) setUsers(res.data.data);
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
    }
  };

const makeDoctor = async (userId) => {
  try {
    dispatch(showLoading());
    const res = await axios.post('/api/user/make-doctor', { userId }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    dispatch(hideLoading());
    if (res.data.success) {
      message.success('Doctor role assigned!');
      getUsersData(); // Refresh list
    } else {
      message.error(res.data.message);
    }
  } catch (err) {
    dispatch(hideLoading());
    message.error('Failed to make doctor');
  }
};

  useEffect(() => {
    getUsersData();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
  },
  {
    title: 'Email',
    dataIndex: 'email',
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    render: (text, record) => moment(record.createdAt).format("DD-MM-YYYY"),
  },
  {
    title: 'Role',
    dataIndex: 'role',
    render: (role) => (
      <Tag color={role === 'admin' ? 'volcano' : 'blue'}>
        {role.toUpperCase()}
      </Tag>
    ),
  },
  {
    title: 'Doctor Status',
    render: (_, record) => (
      <Tag color={record.isDoctor ? 'green' : 'default'}>
        {record.isDoctor ? 'Yes' : 'No'}
      </Tag>
    ),
  },
  {
    title: 'Action',
    render: (_, record) => (
      <div className='d-flex'>
        <h1 className='anchor'>Block</h1>
      </div>
    ),
  },
];


  return (
    <>
      <h1 className="page-title">Users List</h1>
      <hr/>
      {/* 🔍 Search Box */}
      <Input
        placeholder="Search by name or email..."
        style={{ width: 300, marginBottom: 16 }}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="_id"
        pagination={{ pageSize: 6 }}
      />
    </>
  );
}

export default UsersList;





