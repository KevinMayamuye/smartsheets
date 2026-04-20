import express from "express";
import authMiddleware, { adminMiddleware } from "../middleware/authMiddleware.js";
import {
  listSheets,
  createSheet,
  getSheet,
  updateSheet,
  deleteSheet,
  approveSheet,
  rejectSheet,
} from "../controllers/sheetController.js";
import {
  listRows,
  createRow,
  updateRow,
  deleteRow,
} from "../controllers/rowController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listSheets);
router.post("/", createSheet);
router.post("/:id/approve", adminMiddleware, approveSheet);
router.post("/:id/reject", adminMiddleware, rejectSheet);

router.get("/:id/rows", listRows);
router.post("/:id/rows", createRow);
router.put("/:id/rows/:rowId", updateRow);
router.delete("/:id/rows/:rowId", deleteRow);

router.get("/:id", getSheet);
router.put("/:id", updateSheet);
router.delete("/:id", deleteSheet);

export default router;
