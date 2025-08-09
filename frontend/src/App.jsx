import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import PublicRoute from '@/components/PublicRoute.jsx';
import Layout from '@/components/Layout.jsx';

import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';
import Home from '@/pages/Home.jsx';
import ApplyDoctor from '@/pages/ApplyDoctor.jsx';
import Notifications from '@/pages/Notifications.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import UsersList from '@/pages/Admin/UsersList.jsx';
import DoctorsList from '@/pages/Admin/DoctorsList.jsx';
import DoctorProfile from '@/pages/DoctorProfile.jsx';
import BookAppointment from '@/pages/BookAppointment.jsx';
import Appointments from '@/pages/Appointments.jsx'; // ✅ Add this line
import DoctorAppointments from '@/pages/Doctor/DoctorAppointments.jsx';
import PatientHistory from '@/pages/Doctor/PatientHistory.jsx';


function App() {
  const { loading } = useSelector((state) => state.alerts);

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
  { path: '/admin/doctors', element: <DoctorsList /> },
  { path: '/doctor/appointments', element: <DoctorAppointments />, role: 'doctor' },
  { path: '/profile/:userId', element: <DoctorProfile />, role: 'doctor' },
  { path: '/book-appointment/:userId', element: <BookAppointment />, role: 'user' },
  { path: '/appointments', element: <Appointments />, role: 'user' },
  { path: '/admin/doctorslist', element: <DoctorsList /> },
  { path: '/doctor/patient-history/:userId', element: <PatientHistory />, role: 'doctor' }, // ✅ This is correct
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
          <Route
            key={index}
            path={path}
            element={<PublicRoute>{element}</PublicRoute>}
          />
        ))}

        {protectedRoutes.map(({ path, element, role }, index) => (
          <Route
            key={index}
            path={path}
            element={
              <ProtectedRoute role={role}>
                <Layout>{element}</Layout>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </>
  );
}

export default App;









