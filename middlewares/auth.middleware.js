import jwt from "jsonwebtoken";
import { fail } from "../utils/apiResponse.js";

export function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return fail(res, "Unauthorized. Token missing", 401);
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      organization_id: decoded.organization_id || decoded.organizationId,
      organizationId: decoded.organization_id || decoded.organizationId,
      role: decoded.role,
      email: decoded.email,
      employee_code: decoded.employee_code,
    };

    next();
  } catch (err) {
    return fail(res, "Invalid or expired token", 401);
  }
}

export const authMiddleware = protect;

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, "Access denied", 403);
    }

    next();
  };
}