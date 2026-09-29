import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool();
pool.on("error", (error) => {
  console.error("Lỗi kết nối PostgreSQL:", error.code);
});

export default pool;