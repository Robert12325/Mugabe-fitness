import type { NextRequest } from "next/server";
import { parseCredentials } from "@/lib/account";
import {
  allowLogin,
  endSession,
  loginAccount,
} from "@/lib/server/account";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";

/** Public — log in with email and password. */
export async function POST(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Accounts aren't available right now.");
  }

  const body = await readJsonBody(request, 1_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseCredentials(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    if (!(await allowLogin(clientIp(request)))) {
      return jsonError(429, "Too many attempts. Try again in a few minutes.");
    }

    const result = await loginAccount(parsed.value);

    // One message for both a wrong email and a wrong password.
    if (!result.ok) return jsonError(401, "Email or password is incorrect.");

    return jsonOk({ user: result.user, token: result.token });
  } catch (cause) {
    console.error("[account] login failed", cause);

    return jsonError(500, "Couldn't log you in. Please try again.");
  }
}

/** Signed-in visitor — end this session on the server. */
export async function DELETE(request: NextRequest) {
  if (!storageConfigured()) return jsonOk({ ok: true });

  try {
    await endSession(request);
  } catch (cause) {
    // The browser has already forgotten the token; the session expires anyway.
    console.error("[account] logout failed", cause);
  }

  return jsonOk({ ok: true });
}
