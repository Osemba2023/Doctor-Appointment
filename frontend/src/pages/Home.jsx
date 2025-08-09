import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { Row, Col } from "antd";
import Doctor from "../components/Doctor";
import { useDispatch } from "react-redux";
import { hideLoading, showLoading } from "../redux/alertsSlice";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    const getData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        dispatch(showLoading());
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const userRes = await axios.post(
          "/api/user/get-user-info-by-id",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const doctorsRes = await axios.get(
          "/api/user/get-all-approved-doctors",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          setUser(userRes.data.data);
          if (doctorsRes.data.success) {
            setDoctors(doctorsRes.data.data);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        dispatch(hideLoading());
      }
    };

    getData();

    return () => {
      isMounted = false;
    };
  }, [navigate, dispatch]);

  return (
    <>
      {user ? (
        <>
          <h2>Welcome, {user.name}</h2>

          {user.role === "user" && (
            <>
              <p>Available Doctors to Book</p>
              {doctors.length > 0 ? (
                <Row gutter={16}>
                  {doctors.map((doc) => (
                    <Col xs={24} sm={24} md={12} lg={8} key={doc._id}>
                      <Doctor doctor={doc} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <p>No approved doctors found.</p>
              )}
            </>
          )}

          {user.role === "doctor" && (
            <p>You are logged in as a doctor.</p>
          )}

          {user.role === "admin" && (
            <p>You are logged in as an admin.</p>
          )}
        </>
      ) : (
        <p>Loading user...</p>
      )}
    </>
  );
}

export default Home;





