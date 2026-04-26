import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";

export async function login(req, res) {
  try {
    const { email, employee_code, password } = req.body;
    if ((!email && !employee_code) || !password) {
      return fail(res, "email or employee_code and password are required", 400);
    }

    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(email) = LOWER($1) OR employee_code = $2
       LIMIT 1`,
      [email || "", employee_code || ""]
    );

    if (!rows.length) return fail(res, "Invalid credentials", 401);
    const user = rows[0];
    if (!user.is_active) return fail(res, "Your account is inactive", 403);

    const matched = await comparePassword(password, user.password_hash);
    if (!matched) return fail(res, "Invalid credentials", 401);

    const token = signToken(user);
    delete user.password_hash;
    return ok(res, { token, user }, "Login successful");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function me(req, res) {
  return ok(res, { user: req.user }, "Profile fetched");
}

export async function changePassword(req, res) {
  const client = await pool.connect();
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return fail(res, "old_password and new_password required", 400);

    const { rows } = await client.query(`SELECT * FROM users WHERE id=$1`, [req.user.id]);
    const user = rows[0];
    const matched = await comparePassword(old_password, user.password_hash);
    if (!matched) return fail(res, "Old password is incorrect", 400);

    const hash = await hashPassword(new_password);
    await client.query(
      `UPDATE users SET password_hash=$1, must_reset_password=false, updated_at=NOW() WHERE id=$2`,
      [hash, req.user.id]
    );

    return ok(res, {}, "Password changed successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}
