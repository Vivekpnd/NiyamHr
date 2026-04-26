import express from "express";
import { registerOrganization } from "../controllers/public.controller.js";

const router = express.Router();

router.post("/register-organization", registerOrganization);

export default router;