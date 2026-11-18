// Cấp quyền admin cho một tài khoản đã đăng ký.
// Cách dùng:  npm run make-admin -- email-cua-ban@example.com
// Trong Docker: docker compose exec app npm run make-admin -- email-cua-ban@example.com
// Tài khoản phải đăng ký trước trên website. Không tạo sẵn admin với mật khẩu cố định để tránh lộ mật khẩu mặc định.
import "dotenv/config";
import pool from "../src/db/pool.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Cách dùng: npm run make-admin -- email@example.com");
  process.exit(1);
}

try {
  const result = await pool.query(
    "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING name, email",
    [email],
  );
  if (result.rowCount === 0) {
    console.error(`Không tìm thấy tài khoản ${email}. Hãy đăng ký tài khoản trên website trước.`);
    process.exitCode = 1;
  } else {
    console.log(`Đã cấp quyền admin cho ${result.rows[0].name} (${result.rows[0].email}).`);
  }
} catch (error) {
  console.error("Không kết nối được database:", error.code || error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
