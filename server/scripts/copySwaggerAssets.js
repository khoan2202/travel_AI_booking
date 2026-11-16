import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const swaggerDist = path.dirname(require.resolve("swagger-ui-dist/package.json"));
const target = fileURLToPath(new URL("../../client/public/swagger-ui/", import.meta.url));
const assets = [
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "swagger-ui.css",
  "favicon-32x32.png",
  "favicon-16x16.png",
  "LICENSE",
];

await mkdir(target, { recursive: true });
await Promise.all(assets.map((asset) => copyFile(path.join(swaggerDist, asset), path.join(target, asset))));
console.log(`Copied ${assets.length} Swagger UI assets to the client build.`);
