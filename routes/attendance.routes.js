import express from "express";
import {
  getMyAttendance,
  markAttendance,
} from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/mark", protect, markAttendance);
router.get("/mine", protect, getMyAttendance);

export default router;