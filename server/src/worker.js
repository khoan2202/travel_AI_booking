// Cloudflare entry point. Hyperdrive bindings are only read inside a request.
import { httpServerHandler } from "cloudflare:node";

let handlerPromise;

function configureEnvironment(env) {
  process.env.CLOUDFLARE_WORKER = "true";
  process.env.DATABASE_SSL = "true";
  process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;
  process.env.SESSION_SECRET = env.SESSION_SECRET;
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || "";
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
}

async function getHandler(env) {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      configureEnvironment(env);

      const { createApp } = await import("./app.js");
      const app = createApp({ serveClient: false, sameOriginWorker: true });
      app.listen(8787);
      return httpServerHandler({ port: 8787 });
    })();
  }
  return handlerPromise;
}

export default {
  async fetch(request, env, ctx) {
    const handler = await getHandler(env);
    const { withRequestDatabaseClient } = await import("./db/pool.js");
    return withRequestDatabaseClient(env.HYPERDRIVE.connectionString, () =>
      handler.fetch(request, env, ctx),
    );
  },
};
