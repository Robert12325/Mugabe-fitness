import type { NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/account";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";
import {
  allowProgressWrite,
  getProgress,
  parseEntry,
  parseGoal,
  removeEntry,
  saveEntry,
  saveGoal,
} from "@/lib/server/progress";
import { storageConfigured } from "@/lib/server/redis";

/**
 * A client's own weight log. Every method is the signed-in visitor acting
 * on their own record — the user id comes from the session, never from the
 * request body, so one client cannot read or write another's log.
 */

const UNAVAILABLE = "Progress tracking isn't available right now.";

async function requireUser(request: NextRequest) {
  if (!storageConfigured()) {
    return { ok: false as const, response: jsonError(503, UNAVAILABLE) };
  }

  const user = await userFromRequest(request);

  if (!user) {
    return { ok: false as const, response: jsonError(401, "Please log in again.") };
  }

  return { ok: true as const, user };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);

  if (!auth.ok) return auth.response;

  try {
    return jsonOk({ progress: await getProgress(auth.user.id) });
  } catch (cause) {
    console.error("[progress] load failed", cause);

    return jsonError(500, "Could not load your progress.");
  }
}

/** Set (or clear) the target weight. */
export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);

  if (!auth.ok) return auth.response;

  const body = await readJsonBody(request, 2_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseGoal(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    if (!(await allowProgressWrite(auth.user.id))) {
      return jsonError(429, "Too many changes. Please try again later.");
    }

    return jsonOk({ progress: await saveGoal(auth.user.id, parsed.value) });
  } catch (cause) {
    console.error("[progress] goal save failed", cause);

    return jsonError(500, "Your goal couldn't be saved. Please try again.");
  }
}

/** Add a weigh-in, or replace the one already logged for that day. */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);

  if (!auth.ok) return auth.response;

  const body = await readJsonBody(request, 2_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseEntry(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    if (!(await allowProgressWrite(auth.user.id))) {
      return jsonError(429, "Too many changes. Please try again later.");
    }

    const result = await saveEntry(auth.user.id, parsed.value);

    if (!result.ok) return jsonError(409, result.error);

    return jsonOk({ progress: result.progress });
  } catch (cause) {
    console.error("[progress] entry save failed", cause);

    return jsonError(500, "That weigh-in couldn't be saved. Please try again.");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);

  if (!auth.ok) return auth.response;

  const on = request.nextUrl.searchParams.get("on") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(on)) {
    return jsonError(400, "Which weigh-in should be removed?");
  }

  try {
    if (!(await allowProgressWrite(auth.user.id))) {
      return jsonError(429, "Too many changes. Please try again later.");
    }

    return jsonOk({ progress: await removeEntry(auth.user.id, on) });
  } catch (cause) {
    console.error("[progress] entry delete failed", cause);

    return jsonError(500, "That weigh-in couldn't be removed. Please try again.");
  }
}
