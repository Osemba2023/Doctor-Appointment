const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const dbConfig = require("./config/dbconfig"); // this is where mongoose.connect should live


// ✅ Load environment variables from .env
dotenv.config();


const app = express();
app.use(express.json());

// ✅ CORS setup for frontend on port 3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// ✅ Routes
app.use('/api/user', userRoute);

const doctorRoute = require("./routes/doctorRoute");
app.use("/api/doctor", doctorRoute);

const adminRoute = require("./routes/adminRoute"); // adjust path if needed
app.use("/api/admin", adminRoute);
// ✅ Server start
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`node server started at port ${port}`));


