import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // ✅ SAME SECRET as auth routes
    const decoded = jwt.verify(token, "mySuperSecretKey123!");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token error:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
