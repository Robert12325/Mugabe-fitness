import type { NextRequest } from "next/server";
import { parseCoachMedia } from "@/lib/coach-media";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  jsonError,
  jsonOk,
  jsonPublic,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";
import { getCoachMedia, setCoachMedia } from "@/lib/server/site";

/**
 * Public — what the coach section should show. Read on every homepage view,
 * so Vercel's CDN may serve it for up to 30 seconds instead of asking the
 * database each time.
 */
export async function GET() {
  if (!storageConfigured()) {
    return jsonError(503, "Site settings are not configured.");
  }

  try {
    return jsonPublic(await getCoachMedia(), 30);
  } catch (cause) {
    console.error("[coach-media] load failed", cause);

    return jsonError(500, "Could not load the coach media setting.");
  }
}

/** Admin — choose photo or video, and set the video link. */
export async function PUT(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const body = await readJsonBody(request, 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseCoachMedia(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    return jsonOk(await setCoachMedia(parsed.value));
  } catch (cause) {
    console.error("[coach-media] save failed", cause);

    return jsonError(500, "Could not save the coach media setting.");
  }
}
