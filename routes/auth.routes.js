import express from "express";
import { login, me, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, me);
router.patch("/change-password", protect, changePassword);

export default router;
