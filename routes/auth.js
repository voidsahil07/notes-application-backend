import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User exists" });

    const user = new User({ email, password });
    await user.save();

    // ✅ FIXED: Added fallback secret
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "mySuperSecretKey123!", { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // ✅ Added null check
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "mySuperSecretKey123!", { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
