import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../config/db.js";

function generateOrganizationCode() {
  return `ORG-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function registerOrganization(req, res) {
  const client = await pool.connect();

  try {
    const { organization, admin } = req.body;

    if (!organization?.companyName || !organization?.email) {
      return res.status(400).json({
        success: false,
        message: "Company name and company email are required",
      });
    }

    if (!admin?.fullName || !admin?.email || !admin?.password || !admin?.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Admin details are required",
      });
    }

    if (admin.password !== admin.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    await client.query("BEGIN");

    const organizationCode = generateOrganizationCode();

    const orgResult = await client.query(
      `
      INSERT INTO organizations (
        organization_code, company_name, email, phone, industry,
        company_size, gst_number, pan_number, address, logo_url, website
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        organizationCode,
        organization.companyName,
        organization.email,
        organization.phone || null,
        organization.industry || null,
        organization.companySize || null,
        organization.gstNumber || null,
        organization.panNumber || null,
        organization.address || null,
        organization.logoUrl || null,
        organization.website || null,
      ]
    );

    const createdOrg = orgResult.rows[0];
    const passwordHash = await bcrypt.hash(admin.password, 10);

    const adminResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        full_name,
        email,
        mobile_number,
        designation,
        role,
        password_hash,
        is_active,
        must_reset_password
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,false)
      RETURNING id, organization_id, full_name, email, role
      `,
      [
        createdOrg.id,
        admin.fullName,
        admin.email,
        admin.mobileNumber || null,
        admin.designation || null,
        admin.role || "organization_admin",
        passwordHash,
      ]
    );

    await client.query(
      `
      INSERT INTO attendance_rules (organization_id)
      VALUES ($1)
      `,
      [createdOrg.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Organization registered successfully",
      organizationCode: createdOrg.organization_code,
      organization: createdOrg,
      admin: adminResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Register organization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register organization",
      error: error.message,
    });
  } finally {
    client.release();
  }
}