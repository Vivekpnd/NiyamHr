import { pool } from "../config/db.js";
import { ok, fail } from "../utils/apiResponse.js";
import { hashPassword, signToken } from "../utils/auth.js";

export async function createOwner(req, res) {
  const client = await pool.connect();
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return fail(res, "name, email, password required", 400);

    const hash = await hashPassword(password);
    const { rows } = await client.query(
      `INSERT INTO users(name,email,password_hash,role,is_active)
       VALUES($1,$2,$3,'owner',true)
       RETURNING id,name,email,role,is_active,created_at`,
      [name, email, hash]
    );
    const token = signToken(rows[0]);
    return ok(res, { token, user: rows[0] }, "Owner created", 201);
  } catch (err) {
    if (err.code === "23505") return fail(res, "Email already exists", 409);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}

export async function createOrganizationWithHR(req, res) {
  const client = await pool.connect();
  try {
    const {
      organization_name,
      organization_email,
      phone,
      address,
      plan_name = "trial",
      max_employees = 50,
      hr_name,
      hr_email,
      hr_password,
    } = req.body;

    if (!organization_name || !hr_name || !hr_email || !hr_password) {
      return fail(res, "organization_name, hr_name, hr_email, hr_password are required", 400);
    }

    await client.query("BEGIN");

    const orgResult = await client.query(
      `INSERT INTO organizations(name,email,phone,address,status)
       VALUES($1,$2,$3,$4,'active') RETURNING *`,
      [organization_name, organization_email || null, phone || null, address || null]
    );
    const org = orgResult.rows[0];

    const subResult = await client.query(
      `INSERT INTO subscriptions(organization_id, plan_name, max_employees, starts_at, ends_at, status)
       VALUES($1,$2,$3,CURRENT_DATE,CURRENT_DATE + INTERVAL '30 days','active') RETURNING *`,
      [org.id, plan_name, max_employees]
    );

    const hash = await hashPassword(hr_password);
    const hrResult = await client.query(
      `INSERT INTO users(organization_id,name,email,password_hash,role,is_active)
       VALUES($1,$2,$3,$4,'hr_admin',true)
       RETURNING id,organization_id,name,email,role,is_active,created_at`,
      [org.id, hr_name, hr_email, hash]
    );

    await client.query("COMMIT");
    return ok(res, { organization: org, subscription: subResult.rows[0], hr_admin: hrResult.rows[0] }, "Organization and HR created", 201);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return fail(res, "Duplicate email or organization", 409);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
}

export async function listOrganizations(req, res) {
  try {
    const { search = "", status = "", page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await pool.query(
      `SELECT o.*, s.plan_name, s.max_employees, s.ends_at AS subscription_ends_at,
              COUNT(u.id) FILTER (WHERE u.role='employee') AS employee_count
       FROM organizations o
       LEFT JOIN subscriptions s ON s.organization_id=o.id AND s.status='active'
       LEFT JOIN users u ON u.organization_id=o.id
       WHERE ($1='' OR o.name ILIKE '%' || $1 || '%' OR o.email ILIKE '%' || $1 || '%')
         AND ($2='' OR o.status=$2)
       GROUP BY o.id, s.plan_name, s.max_employees, s.ends_at
       ORDER BY o.created_at DESC
       LIMIT $3 OFFSET $4`,
      [search, status, Number(limit), offset]
    );
    return ok(res, { organizations: rows, page: Number(page), limit: Number(limit) }, "Organizations fetched");
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
