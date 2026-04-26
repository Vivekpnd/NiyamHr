import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";

export async function applyLeave(req, res) {
  try {
    const { leave_type = "paid", start_date, end_date, reason } = req.body;
    if (!start_date || !end_date || !reason) return fail(res, "start_date, end_date and reason are required", 400);

    const { rows } = await pool.query(
      `INSERT INTO leave_requests(organization_id,user_id,leave_type,start_date,end_date,reason,status)
       VALUES($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [req.user.organization_id, req.user.id, leave_type, start_date, end_date, reason]
    );
    return ok(res, { leave: rows[0] }, "Leave applied", 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function myLeaves(req, res) {
  try {
    const { status = "" } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM leave_requests WHERE user_id=$1 AND ($2='' OR status=$2) ORDER BY created_at DESC`,
      [req.user.id, status]
    );
    return ok(res, { leaves: rows }, "My leaves fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function listLeaves(req, res) {
  try {
    const { status = "", employee_id = "", from = "", to = "" } = req.query;
    const { rows } = await pool.query(
      `SELECT lr.*, u.name, u.email, u.employee_code, u.department
       FROM leave_requests lr
       JOIN users u ON u.id=lr.user_id
       WHERE lr.organization_id=$1
         AND ($2='' OR lr.status=$2)
         AND ($3='' OR lr.user_id=$3::int)
         AND ($4='' OR lr.start_date >= $4::date)
         AND ($5='' OR lr.end_date <= $5::date)
       ORDER BY lr.created_at DESC`,
      [req.user.organization_id, status, employee_id, from, to]
    );
    return ok(res, { leaves: rows }, "Leave requests fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, hr_comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) return fail(res, "status must be approved or rejected", 400);

    const { rows } = await pool.query(
      `UPDATE leave_requests
       SET status=$1, hr_comment=$2, approved_by=$3, updated_at=NOW()
       WHERE id=$4 AND organization_id=$5
       RETURNING *`,
      [status, hr_comment || null, req.user.id, id, req.user.organization_id]
    );
    if (!rows.length) return fail(res, "Leave request not found", 404);
    return ok(res, { leave: rows[0] }, `Leave ${status}`);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
