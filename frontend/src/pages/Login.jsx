import React from 'react';
import { Form, Input, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { showLoading, hideLoading } from '../redux/alertsSlice';
import { setUser } from '../redux/userSlice';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());

      // 🔐 Send login request
      const response = await axios.post('/api/user/login', values);
      dispatch(hideLoading());

      if (response.data.success) {
        const token = response.data.data.token;
        localStorage.setItem("token", token);

        // 🔓 Decode token to get role
        const decoded = jwtDecode(token);
        const role = decoded.role;

        // 👤 Fetch user info
        const userResponse = await axios.post(
          "/api/user/get-user-info-by-id",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (userResponse.data.success) {
          // ✅ Correct Redux action
          dispatch(setUser(userResponse.data.data));
        }

        toast.success("Login successful");

        // 🚀 Redirect based on role
        if (role === "admin") {
          toast("Redirecting to Admin Dashboard");
          navigate("/"); // Assuming '/' is the admin dashboard or a general landing page
        } else if (role === "doctor") {
          toast("Redirecting to Doctor Appointments");
          navigate("/doctor-appointments"); // <-- CORRECTED PATH: Redirect to a valid doctor route
        } else {
          toast("Redirecting to User Dashboard");
          navigate("/"); // Assuming '/' is the user dashboard or a general landing page
        }

      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
      toast.error(`An error occurred: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className='authentication'>
      <div className='authentication-form card p-3'>
        <h1 className='card-title'>Welcome Back</h1>
        <Form layout='vertical' onFinish={onFinish}>
          <Form.Item label='Email' name='email'>
            <Input placeholder='Email' />
          </Form.Item>
          <Form.Item label='Password' name='password'>
            <Input placeholder='Password' type='password' />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="primary-button my-2 full-width-button">
            LOGIN
          </Button>

          <Link to='/register' className='anchor mt-2'>
            CLICK HERE TO REGISTER
          </Link>

        </Form>
      </div>
    </div>
  );
}

export default Login;



