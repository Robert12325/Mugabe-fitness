import type { NextRequest } from "next/server";
import { requireAdminClient } from "@/lib/server/admin-client";
import { getCoachNotes, getDailyLog, getTargets } from "@/lib/server/daily";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getProgress } from "@/lib/server/progress";

type Context = { params: Promise<{ userId: string }> };

/**
 * Admin — one client's whole record: daily log, weigh-ins, targets and the
 * coach's notes. The log and weigh-ins are read-only here; they are the
 * client's own record.
 */
export async function GET(request: NextRequest, { params }: Context) {
  const { userId } = await params;
  const gate = await requireAdminClient(request, userId);

  if (!gate.ok) return gate.response;

  try {
    const [log, progress, targets, notes] = await Promise.all([
      getDailyLog(userId),
      getProgress(userId),
      getTargets(userId),
      getCoachNotes(userId),
    ]);

    return jsonOk({ log, progress, targets, notes });
  } catch (cause) {
    console.error("[clients] load failed", cause);

    return jsonError(500, "Could not load that client's progress.");
  }
}
