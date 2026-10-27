import pool from "../db/pool.js";

export async function createSupportRequest(req, res, next) {
  const body = req.body ?? {};

  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";

  // Cho phép khách nhập khoảng trắng, dấu chấm hoặc dấu gạch ngang.
  const phone =
    typeof body.phone === "string"
      ? body.phone.trim().replace(/[\s.-]/g, "")
      : "";

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  const bookingId =
    body.booking_id === undefined ||
    body.booking_id === null ||
    body.booking_id === ""
      ? null
      : body.booking_id;

  if ([...fullName].length < 2 || [...fullName].length > 100) {
    return res.status(400).json({
      message: "Họ tên cần có từ 2 đến 100 ký tự.",
    });
  }

  if (!/^\+?[0-9]{9,15}$/.test(phone)) {
    return res.status(400).json({
      message: "Số điện thoại cần có từ 9 đến 15 chữ số.",
    });
  }

  if ([...message].length < 10 || [...message].length > 3000) {
    return res.status(400).json({
      message: "Nội dung cần có từ 10 đến 3000 ký tự.",
    });
  }

  // Frontend phải gửi booking_id dạng số hoặc null.
  if (
    bookingId !== null &&
    (!Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      bookingId > 2147483647)
  ) {
    return res.status(400).json({
      message: "Mã đơn đặt tour không hợp lệ.",
    });
  }

  // Lấy tài khoản từ phiên đăng nhập, không nhận user_id từ form.
  const userId = req.user?.id ?? null;

  if (bookingId !== null && userId === null) {
    return res.status(401).json({
      message: "Bạn cần đăng nhập để gửi hỗ trợ cho tour đã đặt.",
    });
  }

  try {
    if (bookingId !== null) {
      // Chỉ được chọn đơn đặt tour thuộc tài khoản đang đăng nhập.
      const booking = await pool.query(
        "SELECT id FROM bookings WHERE id = $1 AND user_id = $2",
        [bookingId, userId],
      );

      if (booking.rowCount === 0) {
        return res.status(400).json({
          message: "Đơn đặt tour không hợp lệ hoặc không thuộc tài khoản của bạn.",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO support_requests
         (user_id, booking_id, full_name, phone, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, created_at`,
      [userId, bookingId, fullName, phone, message],
    );

    return res.status(201).json({
      message: "Đã gửi yêu cầu liên hệ. Chúng tôi sẽ liên hệ lại với bạn.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}