// Copies the app's web export (dist/) into the website's public/app, where
// the website serves it at /app. Replaces whatever was there, so removed
// files don't linger. Run with `npm run export:web`.
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "..", "dist");
const target = path.resolve(here, "..", "..", "..", "public", "app");

if (!existsSync(path.join(dist, "index.html"))) {
  throw new Error(`No web export at ${dist}. Run "expo export --platform web" first.`);
}

rmSync(target, { recursive: true, force: true });
cpSync(dist, target, { recursive: true });
console.log(`Published the app's web version to ${path.relative(process.cwd(), target)}`);
