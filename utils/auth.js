import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function hashPassword(password) {
  return bcrypt.hash(String(password), 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(String(password), hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      organization_id: user.organization_id,
      role: user.role,
      employee_code: user.employee_code || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function generateEmployeeCode(prefix = "EMP") {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}${stamp}${rand}`;
}

export function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + "@1";
}
