// Test đặt tour, phần quan trọng nhất: không bán quá chỗ, không tạo đơn trùng khi gửi lại, giá lấy từ DB.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Fixtures, bookingBody, createClient, pool, startServer } from "./helpers.js";

describe("đặt tour", () => {
  const fixtures = new Fixtures();
  let server;
  before(async () => { server = await startServer(); });
  after(async () => { await fixtures.cleanup(); await server.close(); await pool.end(); });

  // một khách đã đăng nhập sẵn
  async function signedInUser() {
    const user = await fixtures.user();
    const client = createClient(server.base);
    assert.equal((await client.login(user.email, user.password)).status, 200);
    return { ...user, client };
  }
  const seats = async (departureId) => (await pool.query("SELECT seats_booked FROM tour_departures WHERE id = $1", [departureId])).rows[0].seats_booked;

  test("khách chưa đăng nhập không đặt được", async () => {
    const { departureId, price } = await fixtures.tour();
    const result = await createClient(server.base).post("/bookings", bookingBody(departureId, price));
    assert.equal(result.status, 401);
  });

  test("đặt thành công: giá lấy từ database và trừ đúng số chỗ", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 10, price: 2500000 });
    const { client } = await signedInUser();
    // gửi kèm tổng tiền và quyền giả, server phải lờ đi
    const result = await client.post("/bookings", { ...bookingBody(departureId, price, { guest_count: 3 }), total_price: "1", user_id: 1, role: "admin" });
    assert.equal(result.status, 201);
    const { booking } = result.body.data;
    assert.equal(booking.total_price, "7500000");
    assert.equal(booking.status, "confirmed");
    assert.equal(booking.payment_status, "unpaid");
    assert.equal(await seats(departureId), 3);
  });

  test("gửi lại cùng request_key (bấm hai lần, rớt mạng) không tạo đơn thứ hai", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 10 });
    const { client } = await signedInUser();
    const body = bookingBody(departureId, price, { guest_count: 2 });
    const first = await client.post("/bookings", body);
    const again = await client.post("/bookings", body);
    assert.equal(first.status, 201);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.replayed, true);
    assert.equal(again.body.data.booking.id, first.body.data.booking.id);
    assert.equal(await seats(departureId), 2);
    // cùng mã mà nội dung khác thì không phải gửi lại
    const changed = await client.post("/bookings", { ...body, guest_count: 5 });
    assert.equal(changed.status, 409);
    assert.equal(changed.body.code, "REQUEST_CHANGED");
  });

  test("giá đã đổi sau khi khách xem: từ chối và yêu cầu xem lại", async () => {
    const { departureId } = await fixtures.tour({ price: 2000000 });
    const { client } = await signedInUser();
    const result = await client.post("/bookings", bookingBody(departureId, "1500000"));
    assert.equal(result.status, 409);
    assert.equal(result.body.code, "PRICE_CHANGED");
    assert.equal(await seats(departureId), 0);
  });

  test("không đủ chỗ: từ chối và không trừ chỗ", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 2 });
    const { client } = await signedInUser();
    const result = await client.post("/bookings", bookingBody(departureId, price, { guest_count: 3 }));
    assert.equal(result.status, 409);
    assert.equal(result.body.code, "INSUFFICIENT_SEATS");
    assert.equal(await seats(departureId), 0);
  });

  test("dữ liệu sai bị chặn: số khách, số điện thoại, mã yêu cầu", async () => {
    const { departureId, price } = await fixtures.tour();
    const { client } = await signedInUser();
    for (const bad of [{ guest_count: 0 }, { guest_count: 21 }, { guest_count: "2" }, { contact_phone: "abc" }, { request_key: "khong-phai-uuid" }, { contact_name: "A" }]) {
      const result = await client.post("/bookings", bookingBody(departureId, price, bad));
      assert.equal(result.status, 400, `phải chặn ${JSON.stringify(bad)}`);
    }
    assert.equal(await seats(departureId), 0);
  });

  test("lịch đã hủy hoặc tour ngừng bán thì không đặt được", async () => {
    const closed = await fixtures.tour();
    await pool.query("UPDATE tour_departures SET status = 'cancelled' WHERE id = $1", [closed.departureId]);
    const archived = await fixtures.tour();
    await pool.query("UPDATE tours SET status = 'archived' WHERE id = $1", [archived.tourId]);
    const { client } = await signedInUser();
    for (const target of [closed, archived]) {
      const result = await client.post("/bookings", bookingBody(target.departureId, target.price));
      assert.equal(result.status, 409);
      assert.equal(result.body.code, "DEPARTURE_CLOSED");
    }
  });

  test("12 người đặt cùng lúc 5 chỗ cuối: đúng 5 người được chỗ, không bán quá", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 5 });
    // đăng nhập lần lượt thôi, giới hạn đăng nhập đếm cả request đang chạy nên 12 cái song song sẽ dính mức 10
    const buyers = [];
    for (let i = 0; i < 12; i += 1) buyers.push(await signedInUser());
    // 12 yêu cầu bắn cùng lúc
    const results = await Promise.all(buyers.map(({ client }) => client.post("/bookings", bookingBody(departureId, price, { guest_count: 1 }))));
    const created = results.filter((r) => r.status === 201).length;
    const rejected = results.filter((r) => r.status === 409 && r.body.code === "INSUFFICIENT_SEATS").length;
    assert.equal(created, 5);
    assert.equal(rejected, 7);
    assert.equal(await seats(departureId), 5);
    const rows = (await pool.query("SELECT COUNT(*)::int AS n FROM bookings WHERE departure_id = $1", [departureId])).rows[0].n;
    assert.equal(rows, 5);
  });

  test("hủy đơn trả lại chỗ; bấm hủy hai lần không trả chỗ hai lần", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 10 });
    const { client } = await signedInUser();
    const { booking } = (await client.post("/bookings", bookingBody(departureId, price, { guest_count: 4 }))).body.data;
    assert.equal(await seats(departureId), 4);
    const first = await client.post(`/bookings/${booking.id}/cancel`);
    const second = await client.post(`/bookings/${booking.id}/cancel`);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.replayed, true);
    assert.equal(await seats(departureId), 0);
    assert.equal(first.body.data.booking.status, "cancelled");
  });

  test("không xem hay hủy được đơn của người khác", async () => {
    const { departureId, price } = await fixtures.tour();
    const owner = await signedInUser();
    const stranger = await signedInUser();
    const { booking } = (await owner.client.post("/bookings", bookingBody(departureId, price))).body.data;
    assert.equal((await owner.client.get(`/bookings/${booking.id}`)).status, 200);
    assert.equal((await stranger.client.get(`/bookings/${booking.id}`)).status, 404);
    assert.equal((await stranger.client.post(`/bookings/${booking.id}/cancel`)).status, 404);
    const mine = await stranger.client.get("/bookings");
    assert.equal(mine.body.data.total, 0);
    assert.equal(await seats(departureId), 2);
  });

  test("admin ghi nhận thanh toán, sau đó hoàn tiền và hủy: chỗ được trả lại, có nhật ký", async () => {
    const { departureId, price } = await fixtures.tour({ capacity: 10, price: 3000000 });
    const buyer = await signedInUser();
    const { booking } = (await buyer.client.post("/bookings", bookingBody(departureId, price, { guest_count: 2 }))).body.data;
    const adminUser = await fixtures.user("admin");
    const admin = createClient(server.base);
    await admin.login(adminUser.email, adminUser.password);

    // thiếu xác nhận hoặc mã đối soát thì bị từ chối
    assert.equal((await admin.post(`/admin/bookings/${booking.id}/action`, { action: "mark_paid", note: "Đã nhận chuyển khoản", reference: "FT123456" })).status, 400);
    assert.equal((await admin.post(`/admin/bookings/${booking.id}/action`, { action: "mark_paid", confirmed: true, note: "Đã nhận chuyển khoản" })).status, 400);

    const paid = await admin.post(`/admin/bookings/${booking.id}/action`, { action: "mark_paid", confirmed: true, note: "Đã nhận chuyển khoản", reference: "FT123456" });
    assert.equal(paid.status, 200);
    assert.equal(paid.body.data.payment_status, "paid");
    // bấm lần nữa cũng không ghi nhận lần thanh toán thứ hai
    assert.equal((await admin.post(`/admin/bookings/${booking.id}/action`, { action: "mark_paid", confirmed: true, note: "Đã nhận chuyển khoản", reference: "FT123456" })).status, 200);
    const events = (await pool.query("SELECT COUNT(*)::int AS n FROM booking_payment_events WHERE booking_id = $1 AND kind = 'payment'", [booking.id])).rows[0].n;
    assert.equal(events, 1);
    // đơn đã trả tiền thì khách không tự hủy được
    assert.equal((await buyer.client.post(`/bookings/${booking.id}/cancel`)).status, 409);

    const refunded = await admin.post(`/admin/bookings/${booking.id}/action`, { action: "refund_cancel", confirmed: true, note: "Khách đổi kế hoạch", reference: "RF987654" });
    assert.equal(refunded.status, 200);
    assert.equal(refunded.body.data.status, "cancelled");
    assert.equal(refunded.body.data.payment_status, "refunded");
    assert.equal(await seats(departureId), 0);

    const detail = await admin.get(`/admin/bookings/${booking.id}`);
    assert.equal(detail.body.data.events.length, 2);
    assert.ok(detail.body.data.logs.some((log) => log.action === "booking.mark_paid"));
  });

  test("xuất danh sách đơn cho admin lọc đúng theo từ khóa", async () => {
    const { departureId, price } = await fixtures.tour();
    const buyer = await signedInUser();
    await buyer.client.post("/bookings", bookingBody(departureId, price, { contact_name: `Khách ${randomUUID().slice(0, 6)}` }));
    const adminUser = await fixtures.user("admin");
    const admin = createClient(server.base);
    await admin.login(adminUser.email, adminUser.password);
    const result = await admin.get(`/admin/bookings/export?q=${encodeURIComponent(buyer.email)}`);
    assert.equal(result.status, 200);
    assert.equal(result.body.data.length, 1);
    assert.equal(result.body.data[0].contact_email, buyer.email);
  });
});
