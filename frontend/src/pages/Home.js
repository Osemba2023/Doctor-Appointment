import React, { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // ✅ Decode token ONCE and check expiry
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        // ✅ Send userId in request body
       const response = await axios.post(
  "/api/user/get-user-info-by-id",
  {}, // ✅ No need to send userId
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


        console.log("User info:", response.data.data); // Check for isAdmin here
      } catch (error) {
        console.error("Error fetching user info:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    getData();
  }, [navigate]);

  return (
    <Layout>
      <h1>Home</h1>
    </Layout>
  );
}

export default Home;




