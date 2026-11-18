// Thanh menu con trong khu quản trị.
// NavLink tự thêm class "active" cho mục ứng với trang đang mở.
import { NavLink } from 'react-router';

const ITEMS = [
  ['/admin', 'Tổng quan', true],
  ['/admin/bookings', 'Đơn & thanh toán'],
  ['/admin/tours', 'Tour & lịch đi'],
  ['/admin/blog', 'Blog'],
  ['/admin/users', 'Khách hàng'],
  ['/admin/support', 'Hỗ trợ'],
  ['/admin/activity', 'Nhật ký'],
];

export default function AdminNav() {
  return <nav className="admin-nav" aria-label="Quản trị">{ITEMS.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}</nav>;
}
