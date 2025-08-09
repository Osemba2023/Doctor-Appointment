const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No auth header");
      return res.status(401).send({ message: "Auth header missing", success: false });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
    res.status(500).send({ message: "Auth Failed", success: false, error: error.message });
  }
};








