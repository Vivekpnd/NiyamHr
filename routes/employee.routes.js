import express from "express";
import { createEmployee, listEmployees, getEmployee, updateEmployee, resetEmployeePassword } from "../controllers/employee.controller.js";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect, allowRoles("hr_admin"));
router.post("/", createEmployee);
router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.patch("/:id", updateEmployee);
router.patch("/:id/reset-password", resetEmployeePassword);

export default router;
