// Các hàm gọi API quản trị (cần tài khoản admin).
// Lưu: có id thì gọi API cập nhật, không có id thì gọi API tạo mới.
import { request, postAuth } from './authApi.js';
export const getDestinations = (signal) => request('/admin/destinations', { signal });
export const saveDestination = (body) => postAuth('/admin/destinations', body);
export const getAdminTours = (page, q, status, signal) => request('/admin/tours?' + new URLSearchParams({ page, q, status }), { signal });
export const setTourStatus = (id, status) => postAuth(`/admin/tours/${id}/status`, { status });
export const duplicateTour = (id) => postAuth(`/admin/tours/${id}/duplicate`, {});
export const createBulkDepartures = (tourId, body) => postAuth(`/admin/tours/${tourId}/departures/bulk`, body);
export const saveTour = (id, body) => postAuth(id ? `/admin/tours/${id}/update` : '/admin/tours', body);
export const getAdminDepartures = (tourId, signal) => request(`/admin/tours/${tourId}/departures`, { signal });
export const saveDeparture = (tourId, id, body) => postAuth(id ? `/admin/departures/${id}/update` : `/admin/tours/${tourId}/departures`, body);
export const getAdminBookings = (filters, signal) => request('/admin/bookings?' + new URLSearchParams(filters), { signal });
export const getAdminBooking = (id, signal) => request(`/admin/bookings/${id}`, { signal });
export const actOnBooking = (id, body) => postAuth(`/admin/bookings/${id}/action`, body);
export const exportAdminBookings = (filters, signal) => request('/admin/bookings/export?' + new URLSearchParams(filters), { signal });
// Số liệu phân tích cho Dashboard.
export const getAdminInsights = (signal) => request('/admin/insights', { signal });
// Bài viết blog.
export const getAdminPosts = (filters, signal) => request('/admin/posts?' + new URLSearchParams(filters), { signal });
export const getAdminPost = (id, signal) => request(`/admin/posts/${id}`, { signal });
export const savePost = (id, body) => postAuth(id ? `/admin/posts/${id}/update` : '/admin/posts', body);
export const deletePost = (id) => postAuth(`/admin/posts/${id}/delete`, {});
// Khách hàng, hỗ trợ, nhật ký.
export const getAdminUsers = (filters, signal) => request('/admin/users?' + new URLSearchParams(filters), { signal });
export const setUserRole = (id, role) => postAuth(`/admin/users/${id}/role`, { role });
export const getAdminSupport = (filters, signal) => request('/admin/support?' + new URLSearchParams(filters), { signal });
export const setSupportStatus = (id, status) => postAuth(`/admin/support/${id}/status`, { status });
export const getAdminActivity = (filters, signal) => request('/admin/activity?' + new URLSearchParams(filters), { signal });
