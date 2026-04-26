import express from "express";
import { createOwner, createOrganizationWithHR, listOrganizations } from "../controllers/owner.controller.js";
import { protect, allowRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register-owner", createOwner);
router.post("/organizations", protect, allowRoles("owner"), createOrganizationWithHR);
router.get("/organizations", protect, allowRoles("owner"), listOrganizations);

export default router;
