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
      const res = await axios.post("/api/user/register", values); // ✅ corrected endpoint
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
          <Form.Item label='Name' name='name'>
            <Input placeholder='Name' />
          </Form.Item>
          <Form.Item label='Email' name='email'>
            <Input placeholder='Email' />
          </Form.Item>
          <Form.Item label='Password' name='password'>
            <Input placeholder='Password' type='password' />
          </Form.Item>

          <button className='primary-button my-2 full-width-button' htmltype='submit'>REGISTER</button>

          <Link to='/login' className='anchor mt-2'>CLICK HERE TO LOGIN</Link>
        </Form>
      </div>
    </div>
  );
}

export default Register;




