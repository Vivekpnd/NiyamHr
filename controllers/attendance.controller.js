import { pool } from "../config/db.js";

export async function markAttendance(req, res) {
  try {
    const userId = req.user.id;
    const { status = "present" } = req.body;

    const result = await pool.query(
      `
      INSERT INTO attendance (user_id, status, attendance_date)
      VALUES ($1, $2, CURRENT_DATE)
      RETURNING *
      `,
      [userId, status]
    );

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
}

export async function getMyAttendance(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, user_id, status, attendance_date, created_at
      FROM attendance
      WHERE user_id = $1
      ORDER BY attendance_date DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
}