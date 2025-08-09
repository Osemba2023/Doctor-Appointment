import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { Spin, message } from 'antd';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import DoctorForm from '../components/DoctorForm';

function DoctorProfile() {
  const { userId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching doctor profile...');

      const res = await axios.get(`/api/doctor/get-doctor-info-by-user-id/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Doctor response:', res.data);

      if (res.data.success) {
        const data = res.data.data;

        if (data.timings && Array.isArray(data.timings)) {
          data.timings = [
            moment(data.timings[0], "HH:mm"),
            moment(data.timings[1], "HH:mm")
          ];
        }

        setDoctor(data);
      } else {
        message.error(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      message.error('Error fetching doctor profile');
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, [userId]);


  const onFinish = async (values) => {
    try {
      setSubmitting(true);

      const timings = [
        values.timings[0].format("HH:mm"),
        values.timings[1].format("HH:mm"),
      ];

      const updatedData = { ...values, timings };

      const res = await axios.put(
        `/api/doctor/update-doctor-profile/${userId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        // Optional: re-fetch the updated data
        setDoctor({ ...doctor, ...updatedData });
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isDoctor = user?.role === 'doctor' && String(user._id) === String(userId);

  return (
    <>
      <h1 className="page-title">Doctor Profile</h1>
      <hr/>
      {loading ? (
        <div className="d-flex justify-content-center mt-5">
          <Spin size="large" />
        </div>
      ) : doctor ? (
        <DoctorForm
          onFinish={onFinish}
          initialValues={doctor}
          loading={submitting}
          isUpdate={isDoctor}
        />
      ) : (
        <p>Profile not found</p>
      )}
    </>
  );
}

export default DoctorProfile;







