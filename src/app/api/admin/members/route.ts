import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { listMembers } from "@/lib/server/membership";

/** Admin — every client account with a trial or membership, and where its
 *  payments stand. */
export async function GET(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  try {
    return jsonOk({ members: await listMembers() });
  } catch (cause) {
    console.error("[members] list failed", cause);

    return jsonError(500, "Could not load memberships.");
  }
}
