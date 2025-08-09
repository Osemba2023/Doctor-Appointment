import React, { useEffect } from 'react';
import { Form, Input, Layout, Row, Col, TimePicker } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ApplyDoctor() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user); // ✅ Only get user.user
  const loading = useSelector((state) => state.alerts.loading);
  const navigate = useNavigate();

  // ✅ Prevent redirect until user is loaded
  useEffect(() => {
    if (user === null) return; // Wait until user is fetched
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
      <Form
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={(errorInfo) => {
          console.error("Form validation failed:", errorInfo);
          toast.error("Please fill all required fields correctly.");
        }}
      >
        <h1 className="card-title m-3">Personal Information</h1>
        <Row gutter={20}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true }]}>
              <Input placeholder="Phone Number" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Email" name="email" rules={[{ required: true }]}>
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Website" name="website" rules={[{ required: true }]}>
              <Input placeholder="Website" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Address" name="address" rules={[{ required: true }]}>
              <Input placeholder="Address" />
            </Form.Item>
          </Col>
        </Row>

        <h1 className="card-title m-3">Professional Information</h1>
        <Row gutter={20}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Specialization" name="specialization" rules={[{ required: true }]}>
              <Input placeholder="Specialization" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Experience (in years)" name="experience" rules={[{ required: true }]}>
              <Input placeholder="e.g., 5 years" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Consultation Fee (KES)" name="consultationFee" rules={[{ required: true }]}>
              <Input type="number" placeholder="Consultation Fee" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item label="Timings" name="timings" rules={[{ required: true }]}>
              <TimePicker.RangePicker format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </Form>
    </Layout>
  );
}

export default ApplyDoctor;


