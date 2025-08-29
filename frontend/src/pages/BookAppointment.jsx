import React, { useEffect, useState } from "react";
import { DatePicker, TimePicker, Button, message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const BookAppointment = () => {
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(null);
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilitySuggestions, setAvailabilitySuggestions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { userId } = useParams();

  // Fetch doctor info
  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "/api/doctor/get-doctor-info-by-user-id",
        { userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      dispatch(hideLoading());
      if (res.data.success) setDoctor(res.data.data);
      else message.error(res.data.message || "Doctor not found");
    } catch (error) {
      dispatch(hideLoading());
      message.error("Error fetching doctor info");
      console.error(error);
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);

  // Disable past dates and Sundays
  const disabledDate = (current) => {
    if (!current) return false;
    const today = dayjs().startOf("day");
    return current.isBefore(today) || current.day() === 0; // block past dates and Sundays
  };

  // Disable invalid times for Saturday
  const disabledTime = (dateValue) => {
    if (!dateValue) return {};
    const hourDisabled = [];
    const minuteDisabled = [];
    if (dateValue.day() === 6) {
      // Saturday: disable hours >= 16
      for (let h = 16; h <= 23; h++) hourDisabled.push(h);
    }
    return {
      disabledHours: () => hourDisabled,
      disabledMinutes: () => minuteDisabled,
    };
  };

  // Check availability
  const handleCheckAvailability = async () => {
    if (!date || selectedTimings.length !== 2)
      return message.error("Please select a date and valid time range");

    const [start, end] = selectedTimings;
    const startDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(start).format("HH:mm")}`, "YYYY-MM-DD HH:mm");
    const endDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(end).format("HH:mm")}`, "YYYY-MM-DD HH:mm");

    if (!startDateTime.isValid() || !endDateTime.isValid()) return message.error("Invalid date or time");
    if (startDateTime.isSameOrAfter(endDateTime)) return message.error("End time must be after start time");

    try {
      const token = localStorage.getItem("token");
      if (!token) return message.error("You must be logged in to check availability");

      const payload = {
        doctorId: doctor._id,
        date: startDateTime.format("YYYY-MM-DD"),
        startTime: startDateTime.format("HH:mm"),
        endTime: endDateTime.format("HH:mm"),
      };

      const res = await axios.post("/api/appointment/booking-availability", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        message.success(res.data.message);
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
        const suggestions = res.data.suggestions || [];
        if (suggestions.length > 0) {
          setAvailabilitySuggestions(suggestions);
          setIsModalVisible(true);
        } else {
          message.error(res.data.message);
        }
      }
    } catch (error) {
      console.error("Availability check error:", error);
      message.error("Error checking availability");
    }
  };

  const handleBookAppointment = async () => {
    if (!date || selectedTimings.length !== 2) return message.error("Please select a date and valid time range");
    if (!isAvailable) return message.error("Please check availability first");
    if (!doctor) return message.error("Doctor data not loaded yet");

    const [start, end] = selectedTimings;
    const startDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(start).format("HH:mm")}`, "YYYY-MM-DD HH:mm");
    const endDateTime = dayjs(`${dayjs(date).format("YYYY-MM-DD")} ${dayjs(end).format("HH:mm")}`, "YYYY-MM-DD HH:mm");

    const payload = {
      doctorId: doctor._id,
      userId: user._id,
      date: startDateTime.format("YYYY-MM-DD"),
      startTime: startDateTime.format("HH:mm"),
      endTime: endDateTime.format("HH:mm"),
    };

    try {
      dispatch(showLoading());
      const res = await axios.post("/api/appointment/book-appointment", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      dispatch(hideLoading());

      if (res.data.success) {
        message.success(res.data.message);
        navigate("/appointments");
        setDate(null);
        setSelectedTimings([]);
        setIsAvailable(false);
      } else message.error(res.data.message);
    } catch (error) {
      dispatch(hideLoading());
      console.error("Booking error:", error);
      message.error("Something went wrong while booking appointment");
      setIsAvailable(false);
    }
  };

  // Modal for suggestions
  const renderSuggestionsModal = () => (
    <Modal
      title="Suggested Available Slots"
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={null}
    >
      <p>The requested time is not available. Please choose one of these suggestions:</p>
      {availabilitySuggestions.map((slot, idx) => (
        <Button
          key={idx}
          style={{ margin: "5px" }}
          onClick={() => {
            setDate(dayjs(slot.date, "YYYY-MM-DD"));
            setSelectedTimings([dayjs(slot.start, "HH:mm"), dayjs(slot.end, "HH:mm")]);
            setIsModalVisible(false);
            message.success(`Selected suggested slot: ${slot.date} ${slot.start} - ${slot.end}`);
          }}
        >
          {slot.date} {slot.start} - {slot.end}
        </Button>
      ))}
    </Modal>
  );

  return (
    <div className="p-4">
      {doctor && (
        <>
          <h3 className="page-title mb-4">Book Appointment with Dr. {doctor.firstName} {doctor.lastName}</h3>
          <DatePicker
            placeholder="Select Date"
            value={date}
            onChange={(d) => setDate(d)}
            disabledDate={disabledDate}
          />
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <TimePicker.RangePicker
              format="HH:mm"
              value={selectedTimings}
              onChange={(times) => setSelectedTimings(times)}
              disabledTime={(current) => {
                if (!current || !date) return {}; // nothing selected yet or date not chosen

                const selectedDay = date.day(); // 0 = Sunday, 6 = Saturday
                const disabledHoursArr = [];

                if (selectedDay === 0) {
                  // Sunday: disable all hours
                  for (let h = 0; h < 24; h++) disabledHoursArr.push(h);
                } else if (selectedDay === 6) {
                  // Saturday: disable hours >= 16
                  for (let h = 16; h < 24; h++) disabledHoursArr.push(h);
                }

                return {
                  disabledHours: () => disabledHoursArr,
                  disabledMinutes: () => [],
                  disabledSeconds: () => [],
                };
              }}
            />

          </div>
          <Button type="primary" onClick={handleCheckAvailability}>Check Availability</Button>
          {isAvailable && <p style={{ color: "green" }}>This slot is available! You can proceed to book.</p>}
          <div style={{ marginTop: "1rem" }}>
            <Button type="primary" onClick={handleBookAppointment} disabled={!isAvailable}>Book Appointment</Button>
          </div>
          {renderSuggestionsModal()}
        </>
      )}
    </div>
  );
};

export default BookAppointment;


























