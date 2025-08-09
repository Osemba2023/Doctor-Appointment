import React from 'react';
import { Form, Input, Row, Col, TimePicker, Button } from 'antd';
import { toast } from 'react-hot-toast';

function DoctorForm({ onFinish, initialValues = {}, loading, isUpdate = false }) {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues}
      onFinishFailed={(errorInfo) => {
        console.error("Form validation failed:", errorInfo);
        toast.error("Please fill all required fields correctly.");
      }}
    >
      {/* Personal Information */}
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
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
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

      {/* Professional Information */}
      <h1 className="card-title m-3">Professional Information</h1>
      <Row gutter={20}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="Specialization" name="specialization" rules={[{ required: true }]}>
            <Input placeholder="Specialization" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Form.Item label="Experience (in years)" name="experience" rules={[{ required: true }]}>
            <Input type="number" placeholder="e.g., 5" />
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
        <Button className="primary-button" htmlType="submit" loading={loading}>
          {isUpdate ? (loading ? "Saving..." : "Update Profile") : (loading ? "Submitting..." : "Submit Application")}
        </Button>
      </div>
    </Form>
  );
}

export default DoctorForm;



