import type { NextRequest } from "next/server";
import {
  adminConfigured,
  allowSignInAttempt,
  clearSessionCookie,
  isAdminRequest,
  issueSessionToken,
  passwordMatches,
  setSessionCookie,
} from "@/lib/server/admin-auth";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";

function serverReady() {
  return adminConfigured() && storageConfigured();
}

/** Whether the server is set up, and whether this browser is signed in. */
export async function GET(request: NextRequest) {
  const configured = serverReady();

  return jsonOk({
    configured,
    authenticated: configured && isAdminRequest(request),
  });
}

/** Sign in with ADMIN_PASSWORD; sets an httpOnly session cookie. */
export async function POST(request: NextRequest) {
  if (!serverReady()) {
    return jsonError(503, "Admin sign-in is not configured on the server.");
  }

  const body = await readJsonBody(request, 2_000);

  if (!body.ok) return jsonError(body.status, body.message);

  try {
    if (!(await allowSignInAttempt(clientIp(request)))) {
      return jsonError(429, "Too many attempts. Try again later.");
    }
  } catch (cause) {
    console.error("[admin/session] rate limit check failed", cause);

    return jsonError(500, "Sign-in is temporarily unavailable.");
  }

  const password =
    body.value && typeof body.value === "object"
      ? (body.value as Record<string, unknown>).password
      : undefined;

  if (typeof password !== "string" || !passwordMatches(password)) {
    return jsonError(401, "Incorrect password.");
  }

  const response = jsonOk({ ok: true });

  setSessionCookie(response, issueSessionToken());

  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = jsonOk({ ok: true });

  clearSessionCookie(response);

  return response;
}
