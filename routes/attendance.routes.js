import express from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";
import { checkIn, checkOut, myAttendance, organizationAttendance, attendanceSummary } from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/check-in", protect, allowRoles("employee"), checkIn);
router.patch("/check-out", protect, allowRoles("employee"), checkOut);
router.get("/mine", protect, allowRoles("employee"), myAttendance);
router.get("/records", protect, allowRoles("hr_admin"), organizationAttendance);
router.get("/summary", protect, allowRoles("hr_admin"), attendanceSummary);

export default router;
