import mongoose from "mongoose";
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

export const listPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user", accountApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.findById(id).select("role accountApproved");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "user") {
      return res.status(400).json({ message: "Only client accounts can be approved here" });
    }
    if (user.accountApproved === true) {
      return res.json({ message: "Account was already approved", user: await User.findById(id).select("-password") });
    }
    user.accountApproved = true;
    await user.save();
    const updated = await User.findById(id).select("-password");
    res.json({ message: "Account approved", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
