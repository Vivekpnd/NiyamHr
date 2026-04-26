import { fail } from "../utils/apiResponse.js";

export function notFound(req, res) {
  return fail(res, `Route not found: ${req.originalUrl}`, 404);
}

export function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);
  return fail(res, err.message || "Internal server error", err.status || 500);
}
