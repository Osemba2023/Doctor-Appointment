import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import Appointments from '@/pages/Appointments.jsx';
import DoctorAppointmentDetails from "@/pages/Doctor/DoctorAppointmentDetails.jsx";
import PatientHistory from '@/pages/Doctor/PatientHistory.jsx';
import DoctorAppointments from '@/pages/Doctor/DoctorAppointments.jsx';
import PatientDetails from "@/pages/Doctor/PatientDetails";
import PatientProfile from './pages/Patient/PatientProfile';


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

    // ✅ Doctor routes
    { path: '/doctor/appointments', element: <DoctorAppointments />, role: 'doctor' },
    { path: '/doctor/appointments/details/:appointmentId', element: <DoctorAppointmentDetails />, role: 'doctor' },
    { path: '/doctor/patient-history/:userId', element: <PatientHistory />, role: 'doctor' },
    { path: '/doctor/patient-details/:userId', element: <PatientDetails />, role: 'doctor' },
    { path: '/profile/:userId', element: <DoctorProfile />, role: 'doctor' }, // doctor sees a specific patient

    // ✅ Add this so notifications redirect properly
    { path: '/doctor-appointments', element: <DoctorAppointments />, role: 'doctor' },


    // ✅ Public user routes (patients)
    { path: '/profile', element: <PatientProfile />, role: 'user' },
    { path: '/appointments', element: <Appointments />, role: 'user' },
    { path: '/book-appointment/:userId', element: <BookAppointment />, role: 'user' },
    { path: '/apply-doctor', element: <ApplyDoctor />, role: 'user' },
    { path: '/notifications', element: <Notifications />, role: 'user' },

    // ✅ Admin routes
    { path: '/admin', element: <AdminDashboard />, role: 'admin' },
    { path: '/users', element: <UsersList />, role: 'admin' },
    { path: '/doctors', element: <DoctorsList />, role: 'admin' },
    { path: '/admin/doctors', element: <DoctorsList />, role: 'admin' },
    { path: '/admin/doctorslist', element: <DoctorsList />, role: 'admin' },
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









