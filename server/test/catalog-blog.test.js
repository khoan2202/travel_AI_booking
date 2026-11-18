// Test tích hợp: danh sách tour công khai, blog công khai và trình soạn bài của admin.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Fixtures, createClient, pool, startServer } from "./helpers.js";

describe("tour và blog", () => {
  const fixtures = new Fixtures();
  let server, admin;
  before(async () => {
    server = await startServer();
    const adminUser = await fixtures.user("admin");
    admin = createClient(server.base);
    assert.equal((await admin.login(adminUser.email, adminUser.password)).status, 200);
  });
  after(async () => { await fixtures.cleanup(); await server.close(); await pool.end(); });

  test("danh sách tour chỉ gồm tour đang bán còn lịch tương lai còn chỗ", async () => {
    const open = await fixtures.tour({ capacity: 5, price: 1800000 });
    const full = await fixtures.tour({ capacity: 1 });
    await pool.query("UPDATE tour_departures SET seats_booked = capacity WHERE id = $1", [full.departureId]);
    const past = await fixtures.tour({ inDays: -3 });
    const draft = await fixtures.tour();
    await pool.query("UPDATE tours SET status = 'draft' WHERE id = $1", [draft.tourId]);

    const result = await createClient(server.base).get("/tours");
    assert.equal(result.status, 200);
    const ids = result.body.data.map((t) => t.id);
    assert.ok(ids.includes(open.tourId), "tour còn chỗ phải hiện");
    for (const hidden of [full, past, draft]) assert.equal(ids.includes(hidden.tourId), false);
    assert.equal(result.body.data.find((t) => t.id === open.tourId).price_from, "1800000");
  });

  test("chi tiết tour: ID sai 400, tour nháp 404, tour thường 200 kèm lịch", async () => {
    const client = createClient(server.base);
    const open = await fixtures.tour();
    const draft = await fixtures.tour();
    await pool.query("UPDATE tours SET status = 'draft' WHERE id = $1", [draft.tourId]);
    assert.equal((await client.get("/tours/abc")).status, 400);
    assert.equal((await client.get("/tours/1' OR '1'='1")).status, 400);
    assert.equal((await client.get(`/tours/${draft.tourId}`)).status, 404);
    assert.equal((await client.get(`/tours/${open.tourId}`)).status, 200);
    const departures = await client.get(`/tours/${open.tourId}/departures`);
    assert.equal(departures.body.data.length, 1);
    assert.equal(departures.body.data[0].available_seats, 10);
  });

  test("blog công khai: chỉ thấy bài đã đăng và đã tới giờ", async () => {
    const live = await fixtures.post();
    const draft = await fixtures.post({ status: "draft", publishedAt: "NULL" });
    const scheduled = await fixtures.post({ publishedAt: "NOW() + INTERVAL '2 days'" });
    const archived = await fixtures.post({ status: "archived" });
    const client = createClient(server.base);

    assert.equal((await client.get(`/blog/${live.slug}`)).status, 200);
    for (const hidden of [draft, scheduled, archived]) assert.equal((await client.get(`/blog/${hidden.slug}`)).status, 404, `${hidden.slug} phải bị ẩn`);
    const list = await client.get("/blog?q=Bài viết test");
    const slugs = [list.body.data.featured, ...list.body.data.items].filter(Boolean).map((p) => p.slug);
    assert.ok(slugs.includes(live.slug));
    for (const hidden of [draft, scheduled, archived]) assert.equal(slugs.includes(hidden.slug), false);
  });

  test("blog: mỗi lần mở bài tăng 1 lượt xem; slug lạ hoặc chứa ký tự nguy hiểm trả 404", async () => {
    const post = await fixtures.post();
    const client = createClient(server.base);
    await client.get(`/blog/${post.slug}`);
    await client.get(`/blog/${post.slug}`);
    const views = (await pool.query("SELECT view_count FROM blog_posts WHERE id = $1", [post.id])).rows[0].view_count;
    assert.equal(views, 2);
    assert.equal((await client.get("/blog/khong-co-bai-nay")).status, 404);
    assert.equal((await client.get("/blog/..%2F..%2Fetc%2Fpasswd")).status, 404);
    assert.equal((await client.get("/blog?category=khong-hop-le")).status, 400);
  });

  test("admin tạo bài: kiểm tra dữ liệu, đăng ngay, hẹn giờ, sửa, xóa", async () => {
    const slug = `bai-admin-${randomUUID().slice(0, 8)}`;
    const body = {
      title: "Bài viết do admin tạo khi kiểm thử", slug, category: "guide", status: "published", tags: ["thử", "nghiệm"],
      excerpt: "Tóm tắt đủ dài để qua bước kiểm tra dữ liệu của máy chủ.", featured: false,
      content: "## Mục một\n\nNội dung bài viết đủ dài để vượt qua giới hạn tối thiểu của máy chủ khi kiểm thử.",
    };
    // Dữ liệu sai bị chặn.
    assert.equal((await admin.post("/admin/posts", { ...body, slug: "Sai Slug" })).status, 400);
    assert.equal((await admin.post("/admin/posts", { ...body, category: "khac" })).status, 400);
    assert.equal((await admin.post("/admin/posts", { ...body, cover_image: "javascript:alert(1)" })).status, 400);
    assert.equal((await admin.post("/admin/posts", { ...body, cover_image: "/images/../../etc/passwd" })).status, 400);

    const created = await admin.post("/admin/posts", body);
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    assert.ok(created.body.data.published_at, "bài đã đăng phải có ngày đăng");
    assert.equal((await createClient(server.base).get(`/blog/${slug}`)).status, 200);
    // Trùng slug báo 409.
    assert.equal((await admin.post("/admin/posts", body)).status, 409);

    // Hẹn giờ ở tương lai: khách chưa thấy.
    const later = new Date(Date.now() + 3 * 86400000).toISOString();
    assert.equal((await admin.post(`/admin/posts/${id}/update`, { ...body, published_at: later })).status, 200);
    assert.equal((await createClient(server.base).get(`/blog/${slug}`)).status, 404);

    // Chuyển về nháp rồi xóa.
    assert.equal((await admin.post(`/admin/posts/${id}/update`, { ...body, status: "draft" })).status, 200);
    assert.equal((await admin.post(`/admin/posts/${id}/delete`)).status, 200);
    assert.equal((await admin.get(`/admin/posts/${id}`)).status, 404);
    const logs = await admin.get("/admin/activity?type=post");
    const actions = logs.body.data.items.map((l) => l.action);
    for (const action of ["post.create", "post.update", "post.delete"]) assert.ok(actions.includes(action), `thiếu nhật ký ${action}`);
  });

  test("admin: nhân bản tour thành bản nháp và tạo nhiều lịch, ngày trùng được bỏ qua", async () => {
    const source = await fixtures.tour({ capacity: 8, price: 2200000 });
    const copy = await admin.post(`/admin/tours/${source.tourId}/duplicate`);
    assert.equal(copy.status, 201);
    fixtures.tours.push(copy.body.data.id);
    assert.equal(copy.body.data.status, "draft");

    const start = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const bulk = { start_date: start, every_days: 7, count: 4, price_per_person: 2500000, capacity: 20 };
    const first = await admin.post(`/admin/tours/${copy.body.data.id}/departures/bulk`, bulk);
    assert.deepEqual(first.body.data, { created: 4, skipped: 0 });
    const again = await admin.post(`/admin/tours/${copy.body.data.id}/departures/bulk`, { ...bulk, count: 6 });
    assert.deepEqual(again.body.data, { created: 2, skipped: 4 });
    assert.equal((await admin.post(`/admin/tours/${copy.body.data.id}/departures/bulk`, { ...bulk, every_days: 0 })).status, 400);
  });

  test("tài liệu API Swagger mở được", async () => {
    const response = await fetch(`${server.base}/api-docs.json`);
    assert.equal(response.status, 200);
    const spec = await response.json();
    assert.ok(Object.keys(spec.paths).length > 30);
    assert.ok(spec.paths["/blog"]);
  });
});
