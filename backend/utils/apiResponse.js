export function ok(res, data = null, message = "", status = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
}

export function fail(res, message = "Error", status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    message,
  });
}
