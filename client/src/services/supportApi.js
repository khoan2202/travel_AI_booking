import { postAuth } from "./authApi.js";

export function sendSupportRequest(form) {
  return postAuth("/support", form);
}