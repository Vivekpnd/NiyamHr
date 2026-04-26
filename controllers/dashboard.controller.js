import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";

export async function hrDashboard(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE organization_id=$1 AND role='employee' AND is_active=true) AS total_employees,
        (SELECT COUNT(*) FROM attendance WHERE organization_id=$1 AND attendance_date=$2 AND status IN ('present','late')) AS checked_in_today,
        (SELECT COUNT(*) FROM attendance WHERE organization_id=$1 AND attendance_date=$2 AND status='late') AS late_today,
        (SELECT COUNT(*) FROM leave_requests WHERE organization_id=$1 AND status='pending') AS pending_leaves`,
      [req.user.organization_id, today]
    );
    return ok(res, { dashboard: rows[0] }, "Dashboard fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
