import User from "../models/User.js";

export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};