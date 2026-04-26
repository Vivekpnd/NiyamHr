export function ok(res, data = {}, message = "Success", status = 200) {
  return res.status(status).json({ success: true, message, ...data });
}

export function fail(res, message = "Something went wrong", status = 500, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}
