import { request, postAuth } from './authApi.js';

export const createBooking = (body) => postAuth('/bookings', body);
export const getMyBookings = (page, signal) => request(`/bookings?page=${page}`, { signal });
export const getBooking = (id, signal) => request(`/bookings/${encodeURIComponent(id)}`, { signal });
export const cancelBooking = (id) => postAuth(`/bookings/${encodeURIComponent(id)}/cancel`);
