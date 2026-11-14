// Gửi form Liên hệ lên server.
import { postAuth } from "./authApi.js";

export function sendSupportRequest(form) {
  return postAuth("/support", form);
}