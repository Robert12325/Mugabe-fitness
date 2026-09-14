import type { NextRequest } from "next/server";
import { parseRegistration } from "@/lib/account";
import {
  allowRegistration,
  listBookings,
  registerAccount,
  userFromRequest,
} from "@/lib/server/account";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
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

/** Signed-in visitor — their profile and bookings. */
export async function GET(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Accounts aren't available right now.");
  }

  try {
    const user = await userFromRequest(request);

    if (!user) return jsonError(401, "Please log in again.");

    return jsonOk({ user, bookings: await listBookings(user.id) });
  } catch (cause) {
    console.error("[account] load failed", cause);

    return jsonError(500, "Could not load your account.");
  }
}
