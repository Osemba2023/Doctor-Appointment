import React, { useEffect, useState } from "react";
import { Row, Col, DatePicker, TimePicker, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import Layout from "../components/Layout";
import moment from "moment";

function BookAppointment() {
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(null); // Will store the moment object
  const [selectedTimings, setSelectedTimings] = useState([]); // Will store the array of moment objects
  const [isAvailable, setIsAvailable] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const params = useParams();

  // ✅ Get doctor info
  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      // The GET request now includes the userId directly in the URL
      const res = await axios.get(
        `/api/doctor/get-doctor-info-by-user-id/${params.userId}`,
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
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("🚨 Error fetching doctor data:", error);
      message.error(error.response?.data?.message || "Something went wrong fetching doctor data");
    }
  };

  // ✅ Check availability
  const handleCheckAvailability = async () => {
    // Check if doctor data is loaded
    if (!doctor) {
      return message.error("Doctor data not loaded yet.");
    }

    // Validate inputs
    if (!date || selectedTimings.length !== 2) {
      return message.error("Please select a date and a valid time range");
    }

    try {
      dispatch(showLoading());

      // Correctly format date and time from the state moment objects
      const formattedDate = date.format("DD-MM-YYYY");
      const startTime = selectedTimings[0].format("HH:mm");
      const endTime = selectedTimings[1].format("HH:mm");

      const payload = {
        doctorId: doctor._id,
        date: formattedDate,
        time: [startTime, endTime], // IMPORTANT: Send as an array
      };

      const res = await axios.post(
        "/api/appointment/booking-availability",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());

      if (res.data.success) {
        message.success(res.data.message);
        setIsAvailable(true);
      } else {
        message.error(res.data.message);
        setIsAvailable(false);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error("❌ Availability check error: ", error);
      message.error(error.response?.data?.message || "Something went wrong during availability check");
      setIsAvailable(false);
    }
  };


  // ✅ Book appointment
  const handleBookAppointment = async () => {
  // Re-validate inputs before booking
  if (!date || selectedTimings.length !== 2) {
    return message.error("Please select a date and a valid time range");
  }

  if (!isAvailable) {
    return message.error("Please check availability first");
  }

  // Check if doctor data is loaded
  if (!doctor) {
    return message.error("Doctor data not loaded yet.");
  }
  // Build proper ISO strings for date & time
  const selectedDate = date.startOf('day'); // Reset time to 00:00
  const startTime = selectedTimings[0];
  const endTime = selectedTimings[1];

  // Combine date and time into full ISO strings
  const startDateTime = selectedDate
    .set({
      hour: startTime.hour(),
      minute: startTime.minute(),
      second: 0,
      millisecond: 0,
    })
    .toISOString();

  const endDateTime = selectedDate
    .set({
      hour: endTime.hour(),
      minute: endTime.minute(),
      second: 0,
      millisecond: 0,
    })
    .toISOString();

  const payload = {
    doctorId: doctor._id,
    userId: user._id,
    date: selectedDate.toISOString(), // Store the full day in ISO format
    time: [startDateTime, endDateTime],
  };

  try {
    dispatch(showLoading());
    const res = await axios.post(
      "/api/appointment/book-appointment",
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    dispatch(hideLoading());
    if (res.data.success) {
      message.success(res.data.message);
      navigate("/appointments");
      setDate(null);
      setSelectedTimings([]);
      setIsAvailable(false);
    } else {
      message.error(res.data.message);
    }
  } catch (error) {
    dispatch(hideLoading());
    console.error("❌ Booking error:", error);
    message.error(error.response?.data?.message || "Something went wrong while booking appointment");
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
              <div className="flex flex-col gap-2">
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
              </div>
            </Col>

            <Col xs={24} sm={24} lg={8}>
              <div className="flex flex-col gap-2">
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
              </div>
            </Col>

            <Col xs={24} sm={24} lg={8} className="flex items-end">
              <Button
                className="primary-button w-full"
                onClick={handleCheckAvailability}
                disabled={!doctor || !date || selectedTimings.length === 0}
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






















