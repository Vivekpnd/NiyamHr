import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Attendance backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

export default app;