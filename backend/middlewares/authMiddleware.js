const jwt = require("jsonwebtoken");
module.exports = async (req, res, next) => {
  console.log(req.headers.authorization)
  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Incoming auth header:", authHeader);

    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).send({ message: "Authorization token missing", success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧾 Decoded token:", decoded);

    if (!decoded?.id) {
      console.log("❌ Invalid token payload");
      return res.status(401).send({ message: "Invalid token", success: false });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("✅ Auth success:", req.user);
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(500).send({ message: "Auth Failed", success: false, error: error.message });
  }
};










