import type { NextRequest } from "next/server";
import { parseDay } from "@/lib/daily";
import { requireClient } from "@/lib/server/client-access";
import { getDailyLog, getTargets, removeDay, saveDay } from "@/lib/server/daily";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";
import {
  allowProgressWrite,
  getProgress,
  latestToday,
} from "@/lib/server/progress";

/**
 * A client's own daily log, and the targets their coach set for it.
 *
 * Same gate as the weight log: signed in, with an open trial or paid month,
 * acting only on their own record. The coach's private notes are never
 * part of any response here.
 */

const UNAVAILABLE = "Daily tracking isn't available right now.";

export async function GET(request: NextRequest) {
  const auth = await requireClient(request, UNAVAILABLE);

  if (!auth.ok) return auth.response;

  try {
    const [log, targets, progress] = await Promise.all([
      getDailyLog(auth.user.id),
      getTargets(auth.user.id),
      getProgress(auth.user.id),
    ]);

    return jsonOk({ log, targets, progress });
  } catch (cause) {
    console.error("[daily] load failed", cause);

    return jsonError(500, "Could not load your daily log.");
  }
}

/** Save one day: everything the form shows, weight included. */
export async function POST(request: NextRequest) {
  const auth = await requireClient(request, UNAVAILABLE);

  if (!auth.ok) return auth.response;

  const body = await readJsonBody(request, 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseDay(body.value, latestToday());

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    if (!(await allowProgressWrite(auth.user.id))) {
      return jsonError(429, "Too many changes. Please try again later.");
    }

    const result = await saveDay(auth.user.id, parsed.value);

    if (!result.ok) return jsonError(409, result.error);

    return jsonOk({ log: result.log, progress: result.progress });
  } catch (cause) {
    console.error("[daily] save failed", cause);

    return jsonError(500, "That day couldn't be saved. Please try again.");
  }
}

/** Remove one whole day, its weigh-in included. */
export async function DELETE(request: NextRequest) {
  const auth = await requireClient(request, UNAVAILABLE);

  if (!auth.ok) return auth.response;

  const on = request.nextUrl.searchParams.get("on") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(on)) {
    return jsonError(400, "Which day should be removed?");
  }

  try {
    if (!(await allowProgressWrite(auth.user.id))) {
      return jsonError(429, "Too many changes. Please try again later.");
    }

    return jsonOk(await removeDay(auth.user.id, on));
  } catch (cause) {
    console.error("[daily] delete failed", cause);

    return jsonError(500, "That day couldn't be removed. Please try again.");
  }
}
