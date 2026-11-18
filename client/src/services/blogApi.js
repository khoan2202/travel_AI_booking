// Các hàm gọi API blog công khai (không cần đăng nhập).
import { request } from "./authApi.js";

export const getBlogPosts = (filters, signal) => request("/blog?" + new URLSearchParams(filters), { signal });
export const getBlogPost = (slug, signal) => request(`/blog/${encodeURIComponent(slug)}`, { signal });
