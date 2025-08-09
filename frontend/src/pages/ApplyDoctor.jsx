import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DoctorForm from '../components/DoctorForm';

function ApplyDoctor() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const loading = useSelector((state) => state.alerts.loading);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    try {
      const timings = [
        values.timings[0].format("HH:mm"),
        values.timings[1].format("HH:mm"),
      ];

      const payload = {
        ...values,
        userId: user._id,
        timings,
      };

      dispatch(showLoading());

      const response = await axios.post(
        "/api/user/apply-doctor-account",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("Submission error:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Apply as Doctor</h1>
      <hr />
      <DoctorForm onFinish={onFinish} loading={loading} />
    </Layout>
  );
}

export default ApplyDoctor;




