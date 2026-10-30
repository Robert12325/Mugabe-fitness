#!/usr/bin/env node
/**
 * The only supported way to publish an over-the-air (OTA) update.
 * See RELEASING.md for when to use each step.
 *
 *   node scripts/publish-update.mjs staging --message "Fix the rest timer label" [--dry-run]
 *   node scripts/publish-update.mjs promote --group <update-group-id> --rollout 10 \
 *     --message "Rest timer label fix" --owner-approved [--dry-run]
 *
 * staging: bundles the current commit for the staging app and publishes it
 *   to the "staging" branch, which only staging builds read.
 * promote: republishes an update group that was tested on staging to the
 *   "production" branch, byte for byte, to a percentage of members. Needs
 *   --owner-approved: no update reaches members without the owner's yes.
 *
 * Why this wrapper rather than plain `eas update`:
 * - The bundle is made here, with the server address and variant set
 *   explicitly and the local .env ignored, then checked, and exactly those
 *   files are uploaded (--skip-bundler). Plain `eas update` takes the
 *   address from the EAS environment or a developer's .env, and a wrong or
 *   missing one would reach every phone.
 * - It refuses uncommitted changes, so every update matches a commit.
 * - It never publishes straight to production.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = "dist-update";
const API_URL = "https://mugabe-fitness.vercel.app";

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("--")) fail(`Unexpected argument: ${arg}`);
    const name = arg.slice(2);
    if (["dry-run", "owner-approved"].includes(name)) flags[name] = true;
    else if (["message", "group", "rollout"].includes(name)) flags[name] = rest[++i];
    else fail(`Unknown option: ${arg}`);
  }

  return { command, flags };
}

// Kept to characters that are safe on every shell, Windows' included.
function checkMessage(message) {
  if (!message || !/^[\w .,:;!?()'/+-]{3,120}$/.test(message)) {
    fail('Give a short --message "..." (3 to 120 letters, digits and basic punctuation).');
  }
}

function run(cmd, args, { env = process.env, dryRun = false } = {}) {
  const quoted = args.map((a) => (/^[\w./:=-]+$/.test(a) ? a : `"${a}"`));
  console.log(`\n$ ${cmd} ${quoted.join(" ")}`);
  if (dryRun) return console.log("  (dry run: not executed)");

  const result = spawnSync(cmd, quoted, { cwd: APP_DIR, env, stdio: "inherit", shell: true });
  if (result.status !== 0) fail(`${cmd} ${args[0]} failed (exit ${result.status}).`);
}

function requireCleanTree(dryRun) {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd: APP_DIR, encoding: "utf8" });
  if (result.status !== 0) fail("Couldn't read git status.");
  if (result.stdout.trim()) {
    const problem = "Commit or stash your changes first: an update must match a commit.";
    if (!dryRun) fail(problem);
    console.warn(`! ${problem} (Allowed in a dry run.)`);
  }

  const head = spawnSync("git", ["log", "-1", "--format=%h %s"], { cwd: APP_DIR, encoding: "utf8" });
  console.log(`Commit: ${head.stdout.trim()}`);
}

/** The exported bundle must exist and must not point at a development server. */
function checkBundle() {
  const metadataPath = path.join(APP_DIR, OUT_DIR, "metadata.json");
  if (!fs.existsSync(metadataPath)) fail(`${OUT_DIR}/metadata.json is missing: the export didn't finish.`);

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const bundle = metadata.fileMetadata?.android?.bundle;
  if (!bundle) fail("The export has no Android bundle.");

  const code = fs.readFileSync(path.join(APP_DIR, OUT_DIR, bundle)).toString("latin1");
  // React Native and expo-router ship "http://localhost:8081" as their
  // fallback Metro address; it is in every bundle and is never the API.
  // Any other local or private address would be a developer's backend.
  const devAddresses = [
    ...code.matchAll(/https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?/g),
  ]
    .map((match) => match[0])
    .filter((address) => address !== "http://localhost:8081");

  if (devAddresses.length) {
    fail(`The bundle contains a development address (${[...new Set(devAddresses)].join(", ")}). Not publishing.`);
  }
  if (!code.includes(API_URL)) fail(`The bundle doesn't contain ${API_URL}. Not publishing.`);

  console.log(`✓ Bundle checked: ${bundle} (${(fs.statSync(path.join(APP_DIR, OUT_DIR, bundle)).size / 1e6).toFixed(1)} MB)`);
}

function staging({ message, "dry-run": dryRun }) {
  checkMessage(message);
  requireCleanTree(dryRun);

  // The bundle is made with exactly these values; the local .env is ignored.
  const env = {
    ...process.env,
    EXPO_NO_DOTENV: "1",
    NODE_ENV: "production",
    APP_VARIANT: "staging",
    EXPO_PUBLIC_API_URL: API_URL,
  };

  // Exporting only writes dist-update/, so a dry run does it too.
  run("npx", ["expo", "export", "--platform", "android", "--output-dir", OUT_DIR, "--clear"], { env });
  checkBundle();

  run(
    "npx",
    [
      "eas-cli", "update",
      "--branch", "staging",
      "--platform", "android",
      "--environment", "preview",
      "--skip-bundler",
      "--input-dir", OUT_DIR,
      "--message", message,
      "--non-interactive",
    ],
    { env, dryRun },
  );

  console.log(
    dryRun
      ? "\nDry run finished: nothing was published."
      : "\nPublished to staging. Test it on an installed staging build before promoting its group ID.",
  );
}

function promote({ group, rollout, message, "owner-approved": approved, "dry-run": dryRun }) {
  if (!approved) fail("Promotion to production needs the owner's approval: add --owner-approved once you have it.");
  if (!group || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(group)) {
    fail("Give the --group ID of the staging update you tested (eas update:list --branch staging).");
  }
  const percent = Number(rollout);
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    fail("Give --rollout as a whole percentage from 1 to 100 (start small, e.g. 10).");
  }
  checkMessage(message);

  run(
    "npx",
    [
      "eas-cli", "update:republish",
      "--group", group,
      "--destination-branch", "production",
      "--platform", "android",
      "--rollout-percentage", String(percent),
      "--message", message,
      "--non-interactive",
    ],
    { dryRun },
  );

  console.log(dryRun ? "\nDry run finished: nothing was published." : `\nPromoted to ${percent}% of production.`);
}

const { command, flags } = parseArgs(process.argv.slice(2));

if (command === "staging") staging(flags);
else if (command === "promote") promote(flags);
else fail("Usage: publish-update.mjs staging|promote [options] (see the top of this file).");
