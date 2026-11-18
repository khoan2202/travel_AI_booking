// API blog công khai.
import { request } from "./authApi.js";

export const getBlogPosts = (filters, signal) => request("/blog?" + new URLSearchParams(filters), { signal });
export const getBlogPost = (slug, signal) => request(`/blog/${encodeURIComponent(slug)}`, { signal });
