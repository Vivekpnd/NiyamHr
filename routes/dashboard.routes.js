import express from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";
import { hrDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/hr", protect, allowRoles("hr_admin"), hrDashboard);

export default router;
