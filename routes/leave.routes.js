import express from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";
import { applyLeave, myLeaves, listLeaves, updateLeaveStatus } from "../controllers/leave.controller.js";

const router = express.Router();

router.post("/apply", protect, allowRoles("employee"), applyLeave);
router.get("/mine", protect, allowRoles("employee"), myLeaves);
router.get("/", protect, allowRoles("hr_admin"), listLeaves);
router.patch("/:id/status", protect, allowRoles("hr_admin"), updateLeaveStatus);

export default router;
