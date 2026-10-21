import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { trackingSnapshots } from "@/lib/server/daily";
import { jsonError, jsonOk } from "@/lib/server/http";
import { listMembers } from "@/lib/server/membership";

/**
 * Admin — every client account with a trial or membership, with the last
 * two weeks of their log: enough to spot who has gone quiet or is missing
 * workouts without opening each one.
 */
export async function GET(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  try {
    const members = await listMembers();
    const snapshots = await trackingSnapshots(members.map((m) => m.userId));

    return jsonOk({
      clients: members.map((member) => ({
        userId: member.userId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        status: member.membership.status,
        programName: member.membership.programName,
        ...snapshots.get(member.userId),
      })),
    });
  } catch (cause) {
    console.error("[clients] list failed", cause);

    return jsonError(500, "Could not load clients.");
  }
}
