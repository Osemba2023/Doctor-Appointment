import React from 'react';
import { Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../redux/alertsSlice';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const res = await axios.post("/api/user/register", values); // send name, email, password, phoneNumber
      dispatch(hideLoading());
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("An error occurred during registration.");
    }
  };

  return (
    <div className='authentication'>
      <div className='authentication-form card p-3'>
        <h1 className='card-title'>Welcome to our Online Health Platform</h1>
        <Form layout='vertical' onFinish={onFinish}>
          <Form.Item label='Name' name='name' rules={[{ required: true, message: "Please enter your name" }]}>
            <Input placeholder='Name' />
          </Form.Item>

          <Form.Item label='Email' name='email' rules={[{ required: true, message: "Please enter your email" }]}>
            <Input placeholder='Email' />
          </Form.Item>

          <Form.Item label='Password' name='password' rules={[{ required: true, message: "Please enter your password" }]}>
            <Input placeholder='Password' type='password' />
          </Form.Item>

          {/* ✅ New Phone Number Field */}
          <Form.Item label='Phone Number' name='phoneNumber' rules={[{ required: true, message: "Please enter your phone number" }]}>
            <Input placeholder='Phone Number' />
          </Form.Item>

          <button className='primary-button my-2 full-width-button' htmlType='submit'>REGISTER</button>

          <Link to='/login' className='anchor mt-2'>CLICK HERE TO LOGIN</Link>
        </Form>
      </div>
    </div>
  );
}

export default Register;





