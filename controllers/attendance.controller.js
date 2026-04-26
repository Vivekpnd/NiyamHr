import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkIn(req, res) {
  const client = await pool.connect();
  try {
    const { latitude, longitude, photo_url, note } = req.body;
    if (!latitude || !longitude) return fail(res, "latitude and longitude are required", 400);

    const today = todayISO();
    const existing = await client.query(
      `SELECT * FROM attendance WHERE user_id=$1 AND attendance_date=$2`,
      [req.user.id, today]
    );
    if (existing.rows.length && existing.rows[0].check_in_time) {
      return fail(res, "Already checked in today", 400);
    }

    const now = new Date();
    const status = now.getHours() >= 10 ? "late" : "present";

    const { rows } = await client.query(
      `INSERT INTO attendance(organization_id,user_id,attendance_date,check_in_time,check_in_lat,check_in_lng,check_in_photo_url,status,note)
       VALUES($1,$2,$3,NOW(),$4,$5,$6,$7,$8)
       ON CONFLICT(user_id, attendance_date)
       DO UPDATE SET check_in_time=NOW(), check_in_lat=$4, check_in_lng=$5, check_in_photo_url=$6, status=$7, note=$8, updated_at=NOW()
       RETURNING *`,
      [req.user.organization_id, req.user.id, today, latitude, longitude, photo_url || null, status, note || null]
    );

    return ok(res, { attendance: rows[0] }, "Check-in marked", 201);
  } catch (err) {
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}

export async function checkOut(req, res) {
  try {
    const { latitude, longitude, photo_url, note } = req.body;
    if (!latitude || !longitude) return fail(res, "latitude and longitude are required", 400);

    const today = todayISO();
    const { rows } = await pool.query(
      `UPDATE attendance
       SET check_out_time=NOW(), check_out_lat=$1, check_out_lng=$2, check_out_photo_url=$3,
           note=COALESCE($4,note), updated_at=NOW()
       WHERE user_id=$5 AND attendance_date=$6 AND check_in_time IS NOT NULL
       RETURNING *`,
      [latitude, longitude, photo_url || null, note || null, req.user.id, today]
    );

    if (!rows.length) return fail(res, "Check-in not found for today", 404);
    return ok(res, { attendance: rows[0] }, "Check-out marked");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function myAttendance(req, res) {
  try {
    const { from = "", to = "", status = "", page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await pool.query(
      `SELECT * FROM attendance
       WHERE user_id=$1
         AND ($2='' OR attendance_date >= $2::date)
         AND ($3='' OR attendance_date <= $3::date)
         AND ($4='' OR status=$4)
       ORDER BY attendance_date DESC
       LIMIT $5 OFFSET $6`,
      [req.user.id, from, to, status, Number(limit), offset]
    );

    return ok(res, { records: rows }, "My attendance fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function organizationAttendance(req, res) {
  try {
    const { employee_id = "", search = "", from = "", to = "", status = "", department = "", page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await pool.query(
      `SELECT a.*, u.name, u.email, u.employee_code, u.department, u.designation
       FROM attendance a
       JOIN users u ON u.id=a.user_id
       WHERE a.organization_id=$1
         AND ($2='' OR a.user_id=$2::int)
         AND ($3='' OR u.name ILIKE '%' || $3 || '%' OR u.employee_code ILIKE '%' || $3 || '%')
         AND ($4='' OR a.attendance_date >= $4::date)
         AND ($5='' OR a.attendance_date <= $5::date)
         AND ($6='' OR a.status=$6)
         AND ($7='' OR u.department=$7)
       ORDER BY a.attendance_date DESC, a.check_in_time DESC
       LIMIT $8 OFFSET $9`,
      [req.user.organization_id, employee_id, search, from, to, status, department, Number(limit), offset]
    );

    return ok(res, { records: rows }, "Attendance records fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function attendanceSummary(req, res) {
  try {
    const { from = "", to = "" } = req.query;
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='present') AS present,
        COUNT(*) FILTER (WHERE status='late') AS late,
        COUNT(*) FILTER (WHERE status='absent') AS absent,
        COUNT(*) FILTER (WHERE status='leave') AS leave,
        COUNT(*) AS total_records
       FROM attendance
       WHERE organization_id=$1
         AND ($2='' OR attendance_date >= $2::date)
         AND ($3='' OR attendance_date <= $3::date)`,
      [req.user.organization_id, from, to]
    );
    return ok(res, { summary: rows[0] }, "Attendance summary fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
