import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { Form, Input, Button, Spin, message, Tag } from 'antd'; 
import { useSelector } from 'react-redux';

function DoctorProfile() {
  const { userId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/doctor/get-doctor-info-by-user-id/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        setDoctor(res.data.data);
        form.setFieldsValue(res.data.data);
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      message.error('Error fetching doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      const res = await axios.put(
        `/api/doctor/update-doctor-profile/${userId}`,
        values,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.data.success) {
        message.success(res.data.message);
        fetchProfile(); // Refresh after save
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      message.error('Update failed');
    }
  };

  useEffect(() => {
  fetchProfile();
}, [userId]);

  const isDoctor = user?.role === 'doctor' && String(user._id) === String(userId);

  return (
    <Layout>
      <h1 className="page-title">Doctor Profile</h1>

      {loading ? (
        <Spin size="large" />
      ) : doctor ? (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="First Name" name="firstName">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Last Name" name="lastName">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Phone Number" name="phoneNumber">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Website" name="website">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Specialization" name="specialization">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input disabled={!isDoctor} />
          </Form.Item>

          <Form.Item label="Status">
            <span>
              <Tag
                color={
                  doctor.status === 'approved'
                    ? 'green'
                    : doctor.status === 'pending'
                    ? 'orange'
                    : 'red'
                }
              >
                {doctor.status?.toUpperCase()}
              </Tag>
            </span>
          </Form.Item>

          {isDoctor && (
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Profile
              </Button>
            </Form.Item>
          )}
        </Form>
      ) : (
        <p>Profile not found</p>
      )}
    </Layout>
  );
}

export default DoctorProfile;




