import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { jsonError } from "./http";
import { rateLimit, storageConfigured } from "./redis";

export const ADMIN_COOKIE = "mf_admin";

const SESSION_MS = 12 * 60 * 60 * 1000;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/**
 * Compares through fixed-length digests, so neither the password's length
 * nor how many leading characters were right leaks through response timing.
 */
export function passwordMatches(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) return false;

  return timingSafeEqual(digest(candidate), digest(expected));
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

/**
 * `v1.<expiry ms>.<hmac>` — stateless, expires on its own, and changing
 * ADMIN_PASSWORD invalidates every session already handed out.
 */
export function issueSessionToken(now = Date.now()) {
  const payload = `v1.${now + SESSION_MS}`;

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
) {
  if (!token || !sessionSecret()) return false;

  const parts = token.split(".");

  if (parts.length !== 3 || parts[0] !== "v1") return false;

  const [version, expiry, signature] = parts;
  const expires = Number(expiry);

  if (!Number.isFinite(expires) || expires <= now) return false;

  const expected = Buffer.from(sign(`${version}.${expiry}`));
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isAdminRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

/** Returns an error response unless the request is a signed-in admin and the
 *  server is fully configured; returns null when the request may proceed. */
export function denyUnlessAdmin(request: NextRequest) {
  if (!storageConfigured() || !adminConfigured()) {
    return jsonError(503, "Enquiry storage is not configured.");
  }

  if (!isAdminRequest(request)) {
    return jsonError(401, "Not signed in.");
  }

  return null;
}

export function allowSignInAttempt(ip: string) {
  return rateLimit(`mf:rl:signin:${ip}`, 10, 15 * 60);
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    ...cookieBase,
    maxAge: SESSION_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
}
