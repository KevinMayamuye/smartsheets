import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";
import { getProfile, listUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.get("/", authMiddleware, adminMiddleware, listUsers);

export default router;