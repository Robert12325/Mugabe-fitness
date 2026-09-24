import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getProgress } from "@/lib/server/progress";
import { storageConfigured } from "@/lib/server/redis";

/**
 * The coach reading one client's weight log.
 *
 * Read-only on purpose: the log is the client's own record, and a coach
 * quietly editing their weigh-ins would make it worth less to both of them.
 */
export async function GET(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  if (!storageConfigured()) {
    return jsonError(503, "Progress isn't available right now.");
  }

  const userId = request.nextUrl.searchParams.get("userId") ?? "";

  // The ids this asks about come from enquiries the admin can already see,
  // so anything else is a malformed request rather than a real client.
  if (!userId || userId.length > 100) {
    return jsonError(400, "Which client's progress?");
  }

  try {
    return jsonOk({ progress: await getProgress(userId) });
  } catch (cause) {
    console.error("[admin] progress load failed", cause);

    return jsonError(500, "Could not load that client's progress.");
  }
}
