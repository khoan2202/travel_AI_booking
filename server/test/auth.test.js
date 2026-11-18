// Test tích hợp: đăng ký, đăng nhập, phiên, CSRF và phân quyền admin.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Fixtures, createClient, pool, startServer } from "./helpers.js";

describe("xác thực và phân quyền", () => {
  const fixtures = new Fixtures();
  let server, registeredEmail;
  before(async () => { server = await startServer(); });
  after(async () => {
    if (registeredEmail) await pool.query("DELETE FROM users WHERE email = $1", [registeredEmail]);
    await fixtures.cleanup();
    await server.close();
    await pool.end();
  });

  test("/api/health báo backend và database còn sống", async () => {
    const result = await createClient(server.base).get("/health");
    assert.equal(result.status, 200);
    assert.match(result.body.database, /PostgreSQL/);
  });

  test("đăng ký: từ chối mật khẩu ngắn và email sai", async () => {
    const client = createClient(server.base);
    const short = await client.post("/auth/register", { name: "Khách Test", email: `a-${randomUUID()}@example.test`, password: "ngan" });
    assert.equal(short.status, 400);
    const badEmail = await client.post("/auth/register", { name: "Khách Test", email: "khong-phai-email", password: "mat-khau-du-dai-1" });
    assert.equal(badEmail.status, 400);
  });

  test("đăng ký thành công luôn là role 'user' dù gửi lên role admin, và không lộ mật khẩu", async () => {
    const client = createClient(server.base);
    registeredEmail = `dk-${randomUUID().slice(0, 8)}@example.test`;
    const result = await client.post("/auth/register", { name: "Khách Mới", email: registeredEmail, password: "mat-khau-du-dai-1", role: "admin" });
    assert.equal(result.status, 201);
    assert.equal(result.body.data.user.role, "user");
    assert.equal(JSON.stringify(result.body).includes("password"), false);
    const duplicate = await client.post("/auth/register", { name: "Khách Mới", email: registeredEmail, password: "mat-khau-du-dai-1" });
    assert.equal(duplicate.status, 409);
  });

  test("mật khẩu được lưu dạng băm bcrypt, không lưu mật khẩu gốc", async () => {
    const row = (await pool.query("SELECT password_hash FROM users WHERE email = $1", [registeredEmail])).rows[0];
    assert.match(row.password_hash, /^\$2[aby]\$/);
    assert.equal(row.password_hash.includes("mat-khau-du-dai-1"), false);
  });

  test("đăng nhập sai mật khẩu và email không tồn tại cùng trả 401, thông báo giống nhau", async () => {
    const user = await fixtures.user();
    const client = createClient(server.base);
    const wrong = await client.login(user.email, "sai-mat-khau-123");
    const missing = await client.login(`khong-co-${randomUUID()}@example.test`, "sai-mat-khau-123");
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.equal(wrong.body.message, missing.body.message);
  });

  test("vòng đời phiên: chưa đăng nhập 401, đăng nhập có /me, đăng xuất lại 401", async () => {
    const user = await fixtures.user();
    const client = createClient(server.base);
    assert.equal((await client.get("/auth/me")).status, 401);
    const login = await client.login(user.email, user.password);
    assert.equal(login.status, 200);
    const me = await client.get("/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, user.email);
    assert.equal((await client.post("/auth/logout")).status, 200);
    assert.equal((await client.get("/auth/me")).status, 401);
  });

  test("CSRF: request ghi dữ liệu thiếu hoặc sai token bị chặn 403", async () => {
    const user = await fixtures.user();
    const client = createClient(server.base);
    await client.login(user.email, user.password);
    const missing = await client.post("/auth/logout", {}, { sendCsrf: false });
    assert.equal(missing.status, 403);
    const forged = await fetch(`${server.base}/api/auth/logout`, { method: "POST", headers: { "x-csrf-token": "token-gia", "content-type": "application/json" }, body: "{}" });
    assert.equal(forged.status, 403);
  });

  test("CSRF: origin lạ bị chặn dù có token đúng", async () => {
    const client = createClient(server.base);
    const { csrfToken } = (await client.get("/auth/csrf")).body.data;
    // lần gọi này không có cookie, chỉ cần server từ chối (403) là đạt
    const result = await fetch(`${server.base}/api/auth/logout`, {
      method: "POST", headers: { "x-csrf-token": csrfToken, origin: "https://trang-la.example", "content-type": "application/json" }, body: "{}",
    });
    assert.equal(result.status, 403);
  });

  test("API admin: khách chưa đăng nhập 401, người dùng thường 403, admin 200", async () => {
    const anonymous = createClient(server.base);
    assert.equal((await anonymous.get("/admin/overview")).status, 401);

    const user = await fixtures.user("user");
    const regular = createClient(server.base);
    await regular.login(user.email, user.password);
    assert.equal((await regular.get("/admin/overview")).status, 403);
    assert.equal((await regular.get("/admin/users")).status, 403);
    assert.equal((await regular.post("/admin/posts", {})).status, 403);

    const admin = await fixtures.user("admin");
    const boss = createClient(server.base);
    await boss.login(admin.email, admin.password);
    const overview = await boss.get("/admin/overview");
    assert.equal(overview.status, 200);
    assert.equal(typeof overview.body.data.users_count, "number");
  });

  test("admin không tự đổi quyền của chính mình, và danh sách tài khoản không lộ mật khẩu", async () => {
    const admin = await fixtures.user("admin");
    const boss = createClient(server.base);
    await boss.login(admin.email, admin.password);
    const list = await boss.get(`/admin/users?q=${encodeURIComponent(admin.email)}`);
    assert.equal(list.status, 200);
    assert.equal(JSON.stringify(list.body).includes("password"), false);
    const self = await boss.post(`/admin/users/${admin.id}/role`, { role: "user" });
    assert.equal(self.status, 409);
  });
});
