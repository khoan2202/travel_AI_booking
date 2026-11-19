// Đồ nghề chung cho test tích hợp (chạy trên DB thật).
// Test tạo rồi xóa dữ liệu nên chỉ chịu chạy trên database tên kết thúc bằng "_test" (vd travel_test).
// Muốn chạy chỗ khác thì tự đặt ALLOW_TEST_ON_DB=1. Mỗi test chỉ xóa đúng dữ liệu do nó tạo.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

// phải đặt env trước khi import app, vì config đọc process.env ngay lúc import
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET ||= 'test-session-secret-0123456789-abcdefghij';
process.env.CLIENT_URL ||= 'http://localhost:5173';
// test không bao giờ gọi Gemini thật
delete process.env.GEMINI_API_KEY;

const dbName = process.env.PGDATABASE || '';
if (!dbName.endsWith('_test') && process.env.ALLOW_TEST_ON_DB !== '1') {
  throw new Error(
    `Từ chối chạy test trên database "${dbName}". Hãy tạo database riêng tên kết thúc bằng _test ` +
      '(xem README) hoặc đặt ALLOW_TEST_ON_DB=1 nếu chắc chắn.',
  );
}

const { default: pool } = await import('../src/db/pool.js');
const { createApp } = await import('../src/app.js');
export { pool };

// server thật, cổng ngẫu nhiên
export async function startServer() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await app.locals.sessionStore.close();
    },
  };
}

// các phiên do test tạo, để dọn khi xong
// "trình duyệt giả": tự giữ cookie và tự gắn CSRF token cho request ghi
const sessionIds = new Set();

export function createClient(base) {
  const jar = new Map();
  let csrf = null;

  async function call(method, path, body, { sendCsrf = true } = {}) {
    const headers = {};
    // lấy token trước, vì lần này cũng tạo cookie phiên cần gửi kèm
    if (method !== 'GET' && sendCsrf) {
      csrf ??= (await call('GET', '/auth/csrf')).body.data.csrfToken;
      headers['x-csrf-token'] = csrf;
    }
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const at = pair.indexOf('=');
      const name = pair.slice(0, at),
        value = pair.slice(at + 1);
      jar.set(name, value);
      // cookie có dạng s:<mã>.<chữ ký> (đã mã hóa URL)
      if (name === 'travel.sid') sessionIds.add(decodeURIComponent(value).slice(2).split('.')[0]);
    }
    return { status: response.status, body: await response.json().catch(() => null) };
  }

  return {
    get: (path) => call('GET', path),
    post: (path, body, options) => call('POST', path, body ?? {}, options),
    // đăng nhập xong server cấp token mới nên bỏ token cũ
    async login(email, password) {
      const result = await call('POST', '/auth/login', { email, password });
      csrf = null;
      return result;
    },
  };
}

// dữ liệu mẫu của test, cleanup() xóa sạch
export class Fixtures {
  users = [];
  destinations = [];
  tours = [];
  posts = [];

  // chèn thẳng vào DB, nhanh hơn đăng ký qua API và không vướng giới hạn đăng ký
  async user(role = 'user') {
    const id = randomUUID().slice(0, 8);
    const email = `test-${id}@example.test`;
    const password = `Mat-khau-${id}-ok`;
    const hash = await bcrypt.hash(password, 4);
    const row = (
      await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id', [
        `Người dùng test ${id}`,
        email,
        hash,
        role,
      ])
    ).rows[0];
    this.users.push(row.id);
    return { id: row.id, email, password };
  }

  // một tour đang bán với một lịch ở tương lai
  async tour({ capacity = 10, price = 2000000, inDays = 30 } = {}) {
    const id = randomUUID().slice(0, 8);
    const destination = (
      await pool.query("INSERT INTO destinations (name, slug, region) VALUES ($1, $2, 'Test') RETURNING id, name", [
        `Điểm đến test ${id}`,
        `diem-den-test-${id}`,
      ])
    ).rows[0];
    this.destinations.push(destination.id);
    const tour = (
      await pool.query(
        `INSERT INTO tours (destination_id, title, slug, description, duration_days, departure_location, tags, status)
       VALUES ($1, $2, $3, 'Mô tả tour dùng cho bài kiểm thử tự động.', 3, 'TP. Hồ Chí Minh', '{test}', 'active') RETURNING id`,
        [destination.id, `Tour test ${id}`, `tour-test-${id}`],
      )
    ).rows[0];
    this.tours.push(tour.id);
    const departure = (
      await pool.query(
        `INSERT INTO tour_departures (tour_id, start_date, price_per_person, capacity)
       VALUES ($1, CURRENT_DATE + $2::int, $3, $4) RETURNING id`,
        [tour.id, inDays, price, capacity],
      )
    ).rows[0];
    return { tourId: tour.id, departureId: departure.id, price: String(price), destination: destination.name };
  }

  async post({ status = 'published', publishedAt = "NOW() - INTERVAL '1 hour'", title } = {}) {
    const id = randomUUID().slice(0, 8);
    const row = (
      await pool.query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, category, status, published_at)
       VALUES ($1, $2, 'Đoạn tóm tắt của bài viết dùng cho kiểm thử.', $3, 'tips', $4, ${publishedAt}) RETURNING id, slug`,
        [title || `Bài viết test ${id}`, `bai-viet-test-${id}`, 'Nội dung bài viết kiểm thử. '.repeat(5), status],
      )
    ).rows[0];
    this.posts.push(row.id);
    return row;
  }

  // xóa từ bảng con lên bảng cha cho khỏi vướng khóa ngoại
  async cleanup() {
    const u = this.users,
      t = this.tours;
    await pool.query(
      'DELETE FROM booking_payment_events WHERE actor_id = ANY($1) OR booking_id IN (SELECT id FROM bookings WHERE user_id = ANY($1))',
      [u],
    );
    await pool.query(
      'DELETE FROM bookings WHERE user_id = ANY($1) OR departure_id IN (SELECT id FROM tour_departures WHERE tour_id = ANY($2))',
      [u, t],
    );
    await pool.query('DELETE FROM admin_audit_logs WHERE actor_id = ANY($1)', [u]);
    await pool.query('DELETE FROM blog_posts WHERE id = ANY($1) OR author_id = ANY($2)', [this.posts, u]);
    await pool.query('DELETE FROM tour_departures WHERE tour_id = ANY($1)', [t]);
    await pool.query('DELETE FROM tours WHERE id = ANY($1)', [t]);
    await pool.query('DELETE FROM destinations WHERE id = ANY($1)', [this.destinations]);
    await pool.query("DELETE FROM user_sessions WHERE sid = ANY($1) OR (sess->>'userId')::int = ANY($2)", [
      [...sessionIds],
      u,
    ]);
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [u]);
  }
}

// body đặt tour hợp lệ, test chỉ cần ghi đè chỗ muốn thử
export function bookingBody(departureId, price, overrides = {}) {
  return {
    departure_id: departureId,
    guest_count: 2,
    request_key: randomUUID(),
    contact_name: 'Nguyễn Văn Test',
    contact_phone: '0901234567',
    notes: '',
    expected_unit_price: price,
    ...overrides,
  };
}
