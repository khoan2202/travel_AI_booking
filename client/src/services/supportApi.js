// Gửi form Liên hệ.
import { postAuth } from "./authApi.js";

export function sendSupportRequest(form) {
  return postAuth("/support", form);
}