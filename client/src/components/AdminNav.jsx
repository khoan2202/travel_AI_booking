// Thanh menu con trong khu quản trị: Tổng quan, Tour & lịch đi, Đơn & thanh toán.
// NavLink tự thêm class "active" cho mục ứng với trang đang mở.
import { NavLink } from 'react-router';
export default function AdminNav() {
  return <nav className="admin-nav" aria-label="Quản trị"><NavLink to="/admin" end>Tổng quan</NavLink><NavLink to="/admin/tours">Tour & lịch đi</NavLink><NavLink to="/admin/bookings">Đơn & thanh toán</NavLink></nav>;
}
