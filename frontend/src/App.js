import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ApplyDoctor from './pages/ApplyDoctor';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import UsersList from './pages/Admin/UsersList';
import DoctorsList from './pages/Admin/DoctorsList';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAppointments from './pages/DoctorAppointments';

function App() {
  const { loading } = useSelector((state) => state.alerts);
  const { user } = useSelector((state) => state.user); // 👈 Add this line

  const publicRoutes = [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
  ];

  const protectedRoutes = [
    { path: '/', element: <Home /> },
    { path: '/apply-doctor', element: <ApplyDoctor /> },
    { path: '/notifications', element: <Notifications /> },
    { path: '/admin', element: <AdminDashboard /> },
    { path: '/users', element: <UsersList /> },
    { path: '/doctors', element: <DoctorsList /> },
  ];

  return (
    <>
      {loading && (
        <div className="spinner-parent">
          <div className="spinner-border" role="status"></div>
        </div>
      )}

      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {publicRoutes.map(({ path, element }, index) => (
          <Route key={index} path={path} element={<PublicRoute>{element}</PublicRoute>} />
        ))}

        {/* ✅ All protected routes available to logged-in users */}
        {protectedRoutes.map(({ path, element }, index) => (
          <Route key={index} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
        ))}

        {/* ✅ Only doctors can access these */}
        {user?.role === 'doctor' && (
          <>
            <Route
              path="/doctor-appointments"
              element={<ProtectedRoute><DoctorAppointments /></ProtectedRoute>}
            />
            <Route
              path="/profile/:userId"
              element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>}
            />
          </>
        )}
      </Routes>

    </>
  );
}

export default App;






