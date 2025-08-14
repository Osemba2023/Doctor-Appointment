import React, { useEffect, useState } from "react"; 
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import toast from "react-hot-toast"; 
import moment from "moment"; 

function DoctorAppointmentDetails() { 
  const { appointmentId } = useParams(); 
  const navigate = useNavigate(); 
  const [appointment, setAppointment] = useState(null); 

  const fetchAppointment = async () => { 
    try { 
      const res = await axios.get(`/api/appointment/details/${appointmentId}`, { 
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, 
      }); 
      if (res.data.success) { 
        setAppointment(res.data.data); 
      } else { 
        toast.error("Failed to fetch appointment"); 
      } 
    } catch (error) { 
      toast.error("Error fetching appointment details"); 
    } 
  }; 

  const changeStatus = async (status) => { 
    try { 
      const res = await axios.post( 
        "/api/doctor/change-appointment-status", 
        { appointmentId, status }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } } 
      ); 
      if (res.data.success) { 
        toast.success(`Appointment ${status} successfully`); 
        navigate("/doctor-appointments"); 
      } else { 
        toast.error("Failed to update appointment"); 
      } 
    } catch (error) { 
      toast.error("Error updating appointment"); 
    } 
  }; 

  useEffect(() => { 
    fetchAppointment(); 
  }, [appointmentId]); 

  if (!appointment) return <p>Loading...</p>; 

  // Defensive date checks before formatting 
  const startMoment = appointment.start ? moment(appointment.start) : null; 
  const endMoment = appointment.end ? moment(appointment.end) : null; 

  return ( 
    <div> 
      <h2>Appointment Details</h2> 
      <p><strong>Patient:</strong> {appointment.userInfo?.name || appointment.userId?.name}</p> 

      <p> 
        <strong>Date:</strong>{" "} 
        {startMoment ? startMoment.format("dddd, MMMM D, YYYY") : "No date provided"} 
      </p> 
      <p> 
        <strong>Time:</strong>{" "} 
        {startMoment && endMoment 
          ? `${startMoment.format("h:mm A")} - ${endMoment.format("h:mm A")}` 
          : "No time provided"} 
      </p> 

      <p><strong>Status:</strong> {appointment.status}</p> 

      {appointment.status === "pending" && ( 
        <div> 
          <button 
            className="btn btn-success" 
            onClick={() => changeStatus("approved")} 
          > 
            Approve 
          </button> 
          <button 
            className="btn btn-danger" 
            onClick={() => changeStatus("rejected")} 
          > 
            Reject 
          </button> 
        </div> 
      )} 
    </div> 
  ); 
} 

export default DoctorAppointmentDetails;












