import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { fail } from "../utils/apiResponse.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) return fail(res, "Unauthorized: token missing", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT id, organization_id, name, email, role, employee_code, is_active
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return fail(res, "Unauthorized: user not found or inactive", 401);
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return fail(res, "Unauthorized: invalid token", 401);
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, "Forbidden: insufficient permission", 403);
    }
    next();
  };
}
