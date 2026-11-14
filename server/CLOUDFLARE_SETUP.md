# Cloudflare deployment setup

The real `wrangler.jsonc` is local-only because it contains your custom domain and Hyperdrive configuration ID.

1. Copy `wrangler.example.jsonc` to `wrangler.jsonc`.
2. Replace `YOUR_SUBDOMAIN.YOUR_DOMAIN` with a domain you control.
3. Replace `YOUR_HYPERDRIVE_CONFIG_ID` with your Hyperdrive configuration ID.
4. Add Worker secrets with Wrangler, for example `SESSION_SECRET`; add `GEMINI_API_KEY` if AI consultation is enabled.
5. From this directory, run `npm run cf:release` (on PowerShell, use `npm.cmd run cf:release`).

Do not commit `wrangler.jsonc`, `.env` files, `.dev.vars` files, or Cloudflare credentials.
