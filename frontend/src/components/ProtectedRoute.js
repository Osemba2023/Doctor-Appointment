import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import axios from 'axios';
import { setUser } from '../redux/userSlice';

function ProtectedRoute({ children }) {
  const user = useSelector((state) => state.user.user, shallowEqual);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isAdminRoute = ['/admin', '/users', '/doctors'].includes(location.pathname);

  useEffect(() => {
    const getUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.post(
          '/api/user/get-user-info-by-id',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const user = response.data.data;
          dispatch(setUser({
            ...user,
            isAdmin: user.role === 'admin',
          }));
        } else {
          localStorage.clear();
          navigate('/login');
        }
      } catch (error) {
        localStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      getUser();
    } else {
      setLoading(false);
    }
  }, [user, dispatch, navigate]);

  // Show loading spinner
  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }

  // Check if token is missing or user is not authenticated
  if (!localStorage.getItem("token") || !user) {
    return <Navigate to="/login" replace />;
  }

  // Block non-admins from accessing admin routes
  if (isAdminRoute && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;








