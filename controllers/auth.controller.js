import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";

export async function login(req, res) {
  try {
    const { email, employee_code, password, organizationCode } = req.body;

    if ((!email && !employee_code) || !password || !organizationCode) {
      return fail(
        res,
        "email or employee_code, password and organizationCode are required",
        400
      );
    }

    const { rows } = await pool.query(
      `
      SELECT 
        users.*,
        organizations.organization_code,
        organizations.company_name
      FROM users
      INNER JOIN organizations 
        ON organizations.id = users.organization_id
      WHERE organizations.organization_code = $1
      AND (
        LOWER(users.email) = LOWER($2)
        OR users.employee_code = $3
      )
      LIMIT 1
      `,
      [organizationCode, email || "", employee_code || ""]
    );

    if (!rows.length) {
      return fail(res, "Invalid credentials", 401);
    }

    const user = rows[0];

    if (!user.is_active) {
      return fail(res, "Your account is inactive", 403);
    }

    const matched = await comparePassword(password, user.password_hash);

    if (!matched) {
      return fail(res, "Invalid credentials", 401);
    }

    const token = signToken({
      id: user.id,
      organization_id: user.organization_id,
      role: user.role,
      email: user.email,
      employee_code: user.employee_code,
    });

    delete user.password_hash;

    return ok(
      res,
      {
        token,
        user: {
          ...user,
          organizationCode: user.organization_code,
          companyName: user.company_name,
        },
      },
      "Login successful"
    );
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

    if (!old_password || !new_password) {
      return fail(res, "old_password and new_password required", 400);
    }

    if (new_password.length < 8) {
      return fail(res, "New password must be at least 8 characters", 400);
    }

    const { rows } = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      AND organization_id = $2
      LIMIT 1
      `,
      [req.user.id, req.user.organization_id || req.user.organizationId]
    );

    if (!rows.length) {
      return fail(res, "User not found", 404);
    }

    const user = rows[0];

    const matched = await comparePassword(old_password, user.password_hash);

    if (!matched) {
      return fail(res, "Old password is incorrect", 400);
    }

    const hash = await hashPassword(new_password);

    await client.query(
      `
      UPDATE users
      SET 
        password_hash = $1,
        must_reset_password = false,
        updated_at = NOW()
      WHERE id = $2
      AND organization_id = $3
      `,
      [hash, req.user.id, req.user.organization_id || req.user.organizationId]
    );

    return ok(res, {}, "Password changed successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}