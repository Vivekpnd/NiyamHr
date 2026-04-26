import express from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";
import { createHoliday, listHolidays, deleteHoliday } from "../controllers/holiday.controller.js";

const router = express.Router();

router.get("/", protect, listHolidays);
router.post("/", protect, allowRoles("hr_admin"), createHoliday);
router.delete("/:id", protect, allowRoles("hr_admin"), deleteHoliday);

export default router;
