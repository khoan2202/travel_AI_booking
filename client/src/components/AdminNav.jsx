import { NavLink } from 'react-router';
export default function AdminNav() {
  return <nav className="admin-nav" aria-label="Quản trị"><NavLink to="/admin" end>Tổng quan</NavLink><NavLink to="/admin/tours">Tour & lịch đi</NavLink></nav>;
}
