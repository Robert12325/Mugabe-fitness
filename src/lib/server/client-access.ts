import type { AccountUser } from "@/lib/account";
import { userFromRequest } from "./account";
import { jsonError } from "./http";
import { getMembership } from "./membership";
import { storageConfigured } from "./redis";

/**
 * The gate in front of every dashboard data route: a signed-in client whose
 * trial or paid month is open. Anyone else gets an error response, whatever
 * the page in front of them shows.
 *
 * The user comes from the session, never the request body, so a client can
 * only ever reach their own records.
 */
export async function requireClient(
  request: Request,
  unavailable: string,
): Promise<
  { ok: true; user: AccountUser } | { ok: false; response: Response }
> {
  if (!storageConfigured()) {
    return { ok: false, response: jsonError(503, unavailable) };
  }

  try {
    const user = await userFromRequest(request);

    if (!user) {
      return { ok: false, response: jsonError(401, "Please log in again.") };
    }

    // Open during the free trial and any paid month. The data is kept when
    // access lapses, and is waiting once a payment is confirmed.
    if (!(await getMembership(user.id)).hasAccess) {
      return {
        ok: false,
        response: jsonError(
          403,
          "Your access has expired. Renew your membership to continue.",
        ),
      };
    }

    return { ok: true, user };
  } catch (cause) {
    console.error("[client-access] check failed", cause);

    return { ok: false, response: jsonError(500, unavailable) };
  }
}
