import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";
import { generateEmployeeCode, generateTempPassword, hashPassword } from "../utils/auth.js";

export async function createEmployee(req, res) {
  const client = await pool.connect();
  try {
    const { name, email, phone, department, designation, joining_date, salary, password } = req.body;
    if (!name || !email) return fail(res, "name and email are required", 400);

    const tempPassword = password || generateTempPassword();
    const employeeCode = generateEmployeeCode("EMP");
    const hash = await hashPassword(tempPassword);

    const { rows } = await client.query(
      `INSERT INTO users(organization_id,name,email,phone,password_hash,role,employee_code,department,designation,joining_date,salary,is_active,must_reset_password)
       VALUES($1,$2,$3,$4,$5,'employee',$6,$7,$8,$9,$10,true,true)
       RETURNING id,organization_id,name,email,phone,role,employee_code,department,designation,joining_date,salary,is_active,created_at`,
      [req.user.organization_id, name, email, phone || null, hash, employeeCode, department || null, designation || null, joining_date || null, salary || null]
    );

    return ok(res, { employee: rows[0], temporary_password: tempPassword }, "Employee created", 201);
  } catch (err) {
    if (err.code === "23505") return fail(res, "Employee email or code already exists", 409);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}

export async function listEmployees(req, res) {
  try {
    const { search = "", department = "", status = "", page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await pool.query(
      `SELECT id,name,email,phone,employee_code,department,designation,joining_date,salary,is_active,created_at
       FROM users
       WHERE organization_id=$1 AND role='employee'
         AND ($2='' OR name ILIKE '%' || $2 || '%' OR email ILIKE '%' || $2 || '%' OR employee_code ILIKE '%' || $2 || '%')
         AND ($3='' OR department=$3)
         AND ($4='' OR is_active = ($4='active'))
       ORDER BY created_at DESC
       LIMIT $5 OFFSET $6`,
      [req.user.organization_id, search, department, status, Number(limit), offset]
    );

    return ok(res, { employees: rows, page: Number(page), limit: Number(limit) }, "Employees fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function getEmployee(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id,name,email,phone,employee_code,department,designation,joining_date,salary,is_active,created_at
       FROM users
       WHERE id=$1 AND organization_id=$2 AND role='employee'`,
      [id, req.user.organization_id]
    );
    if (!rows.length) return fail(res, "Employee not found", 404);
    return ok(res, { employee: rows[0] }, "Employee fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, department, designation, joining_date, salary, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
        name=COALESCE($1,name), phone=COALESCE($2,phone), department=COALESCE($3,department),
        designation=COALESCE($4,designation), joining_date=COALESCE($5,joining_date),
        salary=COALESCE($6,salary), is_active=COALESCE($7,is_active), updated_at=NOW()
       WHERE id=$8 AND organization_id=$9 AND role='employee'
       RETURNING id,name,email,phone,employee_code,department,designation,joining_date,salary,is_active`,
      [name ?? null, phone ?? null, department ?? null, designation ?? null, joining_date ?? null, salary ?? null, is_active ?? null, id, req.user.organization_id]
    );
    if (!rows.length) return fail(res, "Employee not found", 404);
    return ok(res, { employee: rows[0] }, "Employee updated");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function resetEmployeePassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const newPassword = password || generateTempPassword();
    const hash = await hashPassword(newPassword);

    const { rows } = await pool.query(
      `UPDATE users SET password_hash=$1, must_reset_password=true, updated_at=NOW()
       WHERE id=$2 AND organization_id=$3 AND role='employee'
       RETURNING id,name,email,employee_code`,
      [hash, id, req.user.organization_id]
    );
    if (!rows.length) return fail(res, "Employee not found", 404);
    return ok(res, { employee: rows[0], temporary_password: newPassword }, "Password reset successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
