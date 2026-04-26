import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";

export async function createHoliday(req, res) {
  try {
    const { name, holiday_date, type = "festival" } = req.body;
    if (!name || !holiday_date) return fail(res, "name and holiday_date required", 400);
    const { rows } = await pool.query(
      `INSERT INTO holidays(organization_id,name,holiday_date,type) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.organization_id, name, holiday_date, type]
    );
    return ok(res, { holiday: rows[0] }, "Holiday created", 201);
  } catch (err) {
    if (err.code === "23505") return fail(res, "Holiday already exists for this date", 409);
    return fail(res, err.message, 500);
  }
}

export async function listHolidays(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM holidays WHERE organization_id=$1 AND EXTRACT(YEAR FROM holiday_date)=$2 ORDER BY holiday_date ASC`,
      [req.user.organization_id, Number(year)]
    );
    return ok(res, { holidays: rows }, "Holidays fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM holidays WHERE id=$1 AND organization_id=$2`, [id, req.user.organization_id]);
    if (!result.rowCount) return fail(res, "Holiday not found", 404);
    return ok(res, {}, "Holiday deleted");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
