import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import axios from 'axios';
import { setUser } from '../redux/userSlice';

function ProtectedRoute({ children, role }) {
  const user = useSelector((state) => state.user.user, shallowEqual);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchedUser, setFetchedUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.post(
          '/api/user/get-user-info-by-id',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const data = response.data.data;
          dispatch(setUser(data));
          setFetchedUser(data);
        } else {
          localStorage.clear();
          setFetchedUser(null);
        }
      } catch (err) {
        console.error(err);
        localStorage.clear();
        setFetchedUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (!user) fetchUser();
    else {
      setFetchedUser(user);
      setLoading(false);
    }
  }, [user, dispatch]);

  if (loading) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;

  // No user after fetch
  if (!fetchedUser) return <Navigate to="/login" replace />;

  // Role check
  if (role && fetchedUser.role !== role && fetchedUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;









