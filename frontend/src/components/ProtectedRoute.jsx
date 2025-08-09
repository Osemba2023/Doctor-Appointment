import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import axios from 'axios';
import { setUser } from '../redux/userSlice';
// Assuming you have showLoading and hideLoading from alertsSlice
// import { showLoading, hideLoading } from '../redux/alertsSlice';

function ProtectedRoute({ children, role }) {
  // Using shallowEqual for user selector is good for performance
  const user = useSelector((state) => state.user.user, shallowEqual);
  const [loading, setLoading] = useState(true); // Local loading state for this component
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // Useful for debugging current path

  useEffect(() => {
    const getUser = async () => {
      try {
        // console.log("ProtectedRoute: Attempting to fetch user data for path:", location.pathname);
        // dispatch(showLoading()); // If you want to use global loading spinner here

        const token = localStorage.getItem("token");
        if (!token) {
          // console.log("ProtectedRoute: No token found, redirecting to login.");
          setLoading(false); // No token, so loading is done, and we'll redirect
          navigate('/login', { replace: true }); // Use replace to prevent back button issues
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
          const fetchedUser = response.data.data;
          // console.log("ProtectedRoute: User data fetched successfully:", fetchedUser);
          dispatch(setUser({
            ...fetchedUser,
            isAdmin: fetchedUser.role === 'admin',
          }));
        } else {
          // console.log("ProtectedRoute: Failed to fetch user data, clearing token and redirecting.");
          localStorage.clear();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error("ProtectedRoute: Error fetching user info:", error);
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        // Ensure loading is set to false only after the async operation completes
        // regardless of success or failure.
        setLoading(false);
        // dispatch(hideLoading()); // If you use global loading spinner here
      }
    };

    // This condition ensures getUser is called only if user is not yet in Redux
    // but a token exists (meaning we should try to fetch it).
    // If user is already present, we just set loading to false.
    if (!user && localStorage.getItem("token")) {
      getUser();
    } else if (user) {
      // If user is already loaded in Redux, we are done loading.
      setLoading(false);
      // console.log("ProtectedRoute: User already in Redux, setting loading to false.");
    } else {
      // If no user and no token, then loading is also done, and the Navigate below will handle it.
      setLoading(false);
      // console.log("ProtectedRoute: No user and no token, setting loading to false.");
    }
  }, [user, dispatch, navigate, location.pathname]); // Added location.pathname to dependencies for re-evaluation on path change

  // Show loading spinner while fetching user data
  if (loading) {
    // console.log("ProtectedRoute: Rendering loading state...");
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }

  // If loading is false, now check authentication and role
  // This order is important: first check token, then user object, then role.
  if (!localStorage.getItem("token") || !user) {
    // console.log("ProtectedRoute: No token or user object, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // Role-based protection
  if (role && user.role !== role && user.role !== 'admin') { // Added user.role !== 'admin' to allow admins access
    // console.log("ProtectedRoute: Role mismatch, redirecting to home. Required:", role, "Actual:", user.role);
    return <Navigate to="/" replace />; // Redirect to home or unauthorized page
  }

  // If all checks pass, render the children
  // console.log("ProtectedRoute: All checks passed, rendering children.");
  return children;
}

export default ProtectedRoute;








