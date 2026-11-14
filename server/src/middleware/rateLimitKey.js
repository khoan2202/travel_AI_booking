import { ipKeyGenerator } from "express-rate-limit";

// Cloudflare provides the visitor address in CF-Connecting-IP. The Node HTTP
// adapter does not always populate Express req.ip, so use the edge header first.
export function rateLimitKey(req) {
  const ip =
    req.get("CF-Connecting-IP") ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";
  return ipKeyGenerator(ip);
}
