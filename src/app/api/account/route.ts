import type { NextRequest } from "next/server";
import { parseRegistration } from "@/lib/account";
import {
  allowLogin,
  allowRegistration,
  listBookings,
  registerAccount,
  userFromRequest,
} from "@/lib/server/account";
import { deleteAccount } from "@/lib/server/account-deletion";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { getMembership } from "@/lib/server/membership";
import { storageConfigured } from "@/lib/server/redis";

/** Public — create a visitor account and sign in. */
export async function POST(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Accounts aren't available right now.");
  }

  const body = await readJsonBody(request, 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseRegistration(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    if (!(await allowRegistration(clientIp(request)))) {
      return jsonError(
        429,
        "Too many sign-ups from this device. Please try again later.",
      );
    }

    const result = await registerAccount(parsed.value);

    if (!result.ok) {
      return jsonError(
        409,
        "An account with this email already exists. Log in instead.",
      );
    }

    return jsonOk({ user: result.user, token: result.token }, 201);
  } catch (cause) {
    console.error("[account] register failed", cause);

    return jsonError(500, "Your account couldn't be created. Please try again.");
  }
}

/**
 * Signed-in visitor — permanently delete their account, after confirming
 * the password. A wrong password is a 400, not a 401, so the app doesn't
 * mistake it for an expired session and sign the member out.
 */
export async function DELETE(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Accounts aren't available right now.");
  }

  const body = await readJsonBody(request, 1_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const value = body.value as { password?: unknown } | null;
  const password = typeof value?.password === "string" ? value.password : "";

  if (!password || password.length > 200) {
    return jsonError(400, "Enter your password to confirm.");
  }

  try {
    if (!(await allowLogin(clientIp(request)))) {
      return jsonError(429, "Too many attempts. Try again in a few minutes.");
    }

    const result = await deleteAccount(request, password);

    if (result === "unauthorized") return jsonError(401, "Please log in again.");
    if (result === "wrong-password") return jsonError(400, "That password isn't right.");

    return jsonOk({ ok: true });
  } catch (cause) {
    console.error("[account] delete failed", cause);

    return jsonError(500, "Your account couldn't be deleted. Please try again.");
  }
}

/** Signed-in visitor — their profile and bookings. */
export async function GET(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Accounts aren't available right now.");
  }

  try {
    const user = await userFromRequest(request);

    if (!user) return jsonError(401, "Please log in again.");

    const [bookings, membership] = await Promise.all([
      listBookings(user.id),
      getMembership(user.id),
    ]);

    return jsonOk({ user, bookings, membership });
  } catch (cause) {
    console.error("[account] load failed", cause);

    return jsonError(500, "Could not load your account.");
  }
}
