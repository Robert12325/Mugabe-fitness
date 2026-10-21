import type { NextRequest } from "next/server";
import { getAccountUsers } from "./account";
import { denyUnlessAdmin } from "./admin-auth";
import { jsonError } from "./http";

const ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * The gate for the coach's per-client routes: a signed-in admin, and an id
 * that belongs to a real account — so a typo can never leave targets or
 * notes filed under someone who doesn't exist.
 */
export async function requireAdminClient(
  request: NextRequest,
  userId: string,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const denied = denyUnlessAdmin(request);

  if (denied) return { ok: false, response: denied };

  if (!ID.test(userId)) {
    return { ok: false, response: jsonError(400, "Invalid client.") };
  }

  try {
    const users = await getAccountUsers([userId]);

    return users.has(userId)
      ? { ok: true }
      : { ok: false, response: jsonError(404, "Client not found.") };
  } catch (cause) {
    console.error("[admin-client] lookup failed", cause);

    return { ok: false, response: jsonError(500, "Could not load that client.") };
  }
}
