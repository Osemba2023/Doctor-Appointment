import React, { useEffect, useState } from "react";
import { Row, Col, DatePicker, TimePicker, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import moment from "moment";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // plugin import
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // optional if you use it

// Extend dayjs with the plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore); // if needed



function BookAppointment() {
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(null);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { userId } = useParams(); // ✅ Get from URL params
  const [rawStart, rawEnd] = selectedTimings;

  // ✅ Get doctor info
  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "/api/doctor/get-doctor-info-by-user-id",
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());

      if (res.data.success) {
        setDoctor(res.data.data);
      } else {
        message.error(res.data.message || "Doctor not found");
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error("Error fetching doctor info");
      console.error(error);
    }
  };

  // ✅ Check availability
  const handleCheckAvailability = async () => {
    if (!date || selectedTimings.length !== 2) {
      return message.error("Please select a date and valid time range");
    }

    const [start, end] = selectedTimings;

    // Combine date + time into proper dayjs objects
    const startDateTime = dayjs(
      `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(start).format("HH:mm")}`,
      "YYYY-MM-DD HH:mm"
    );
    const endDateTime = dayjs(
      `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(end).format("HH:mm")}`,
      "YYYY-MM-DD HH:mm"
    );

    console.log("📅 Start DateTime:", startDateTime.format());
    console.log("📅 End DateTime:", endDateTime.format());

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      return message.error("Invalid date or time");
    }

    if (startDateTime.isSameOrAfter(endDateTime)) {
      return message.error("End time must be after start time");
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return message.error("You must be logged in to check availability");
      }

      const payload = {
        doctorId: doctor._id,
        date: startDateTime.format("YYYY-MM-DD"),
        startTime: startDateTime.format("HH:mm"),
        endTime: endDateTime.format("HH:mm"),
      };

      console.log("📤 Sending availability check payload:", payload);

      const res = await axios.post(
        "/api/appointment/booking-availability",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ attach token
          },
        }
      );

      if (res.data.success) {
        message.success(res.data.message);
        setIsAvailable(true);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.error("❌ Availability check error:", error);
      if (error.response?.status === 401) {
        message.error("Unauthorized: Please log in again");
      } else {
        message.error("Error checking availability");
      }
    }
  };

  // ✅ Book appointment
  const handleBookAppointment = async () => {
    if (!date || selectedTimings.length !== 2) {
      return message.error('Please select a date and a valid time range');
    }
    if (!isAvailable) {
      return message.error('Please check availability first');
    }
    if (!doctor) {
      return message.error('Doctor data not loaded yet.');
    }

    const [start, end] = selectedTimings;

    // Merge selected date + times
    const startDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(start).format("HH:mm")}`, "YYYY-MM-DD HH:mm");
    const endDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(end).format("HH:mm")}`, "YYYY-MM-DD HH:mm");

    console.log("Selected timings:", selectedTimings);
    console.log("Start time (HH:mm):", startDateTime.format("HH:mm"));
    console.log("End time (HH:mm):", endDateTime.format("HH:mm"));
    console.log("Is start same or after end?", startDateTime.isSameOrAfter(endDateTime));

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      return message.error('Invalid time selected');
    }
    if (startDateTime.isSameOrAfter(endDateTime)) {
      return message.error('End time must be after start time.');
    }

    const payload = {
      doctorId: doctor._id,
      date: startDateTime.format("YYYY-MM-DD"),
      startTime: startDateTime.format("HH:mm"),
      endTime: endDateTime.format("HH:mm"),
    };

    console.log('Booking payload:', payload);
    const formattedDate = dayjs(date).format("YYYY-MM-DD");
    const formattedTime = `${selectedTimings[0]} - ${selectedTimings[1]}`;

    try {
      dispatch(showLoading());
      const res = await axios.post('/api/appointment/book-appointment', payload, {
        date: formattedDate,
        time: formattedTime,
        doctorId: doctor._id,
        userId: user._id,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      dispatch(hideLoading());

      if (res.data.success) {
        message.success(res.data.message);
        navigate('/appointments');
        setDate(null);
        setSelectedTimings([]);
        setIsAvailable(false);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error('❌ Booking error:', error);
      message.error('Something went wrong while booking appointment');
      setIsAvailable(false);
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);

  return (
    <>
      {doctor && (
        <div className="p-4">
          <h1 className="page-title text-2xl font-bold mb-4">
            Book Appointment with Dr. {doctor.firstName} {doctor.lastName}
          </h1>
          <hr className="mb-4" />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} lg={8}>
              <label className="font-semibold">Select Date</label>
              <DatePicker
                format="DD-MM-YYYY"
                className="w-full"
                onChange={(value) => {
                  setDate(value);
                  setIsAvailable(false);
                }}
                disabledDate={(current) =>
                  current && current < moment().startOf("day")
                }
                value={date}
              />
            </Col>

            <Col xs={24} sm={24} lg={8}>
              <label className="font-semibold">Select Time Range</label>
              <TimePicker.RangePicker
                format="HH:mm"
                className="w-full"
                onChange={(values) => {
                  setSelectedTimings(values || []);
                  setIsAvailable(false);
                }}
                value={selectedTimings}
              />
            </Col>

            <Col xs={24} sm={24} lg={8} className="flex items-end">
              <Button
                className="primary-button w-full"
                onClick={handleCheckAvailability}
              >
                Check Availability
              </Button>
            </Col>
          </Row>

          {isAvailable && (
            <Row className="mt-4">
              <Col xs={24}>
                <Button
                  className="btn btn-success w-full"
                  onClick={handleBookAppointment}
                >
                  Book Now
                </Button>
              </Col>
            </Row>
          )}
        </div>
      )}
    </>
  );
}

export default BookAppointment;























