import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/authMiddleware.js";
import { getProfile, listUsers, listPendingUsers, approveUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.get("/pending", authMiddleware, adminMiddleware, listPendingUsers);
router.post("/:id/approve", authMiddleware, adminMiddleware, approveUser);
router.get("/", authMiddleware, adminMiddleware, listUsers);

export default router;
