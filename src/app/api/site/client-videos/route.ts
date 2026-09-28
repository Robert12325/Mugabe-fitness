import type { NextRequest } from "next/server";
import { parseClientVideos } from "@/lib/client-videos";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  jsonError,
  jsonOk,
  jsonPublic,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";
import { getClientVideos, setClientVideos } from "@/lib/server/site";

/**
 * Public — the client workout clips on the homepage. Read on every visit,
 * so Vercel's CDN may serve it for up to 30 seconds rather than asking the
 * database each time.
 */
export async function GET() {
  if (!storageConfigured()) {
    return jsonError(503, "Site settings are not configured.");
  }

  try {
    return jsonPublic({ videos: await getClientVideos() }, 30);
  } catch (cause) {
    console.error("[client-videos] load failed", cause);

    return jsonError(500, "Could not load the client videos.");
  }
}

/** Admin — replace the whole list. */
export async function PUT(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  // Five links and titles; generous, and far short of anything worth
  // streaming into the parser.
  const body = await readJsonBody(request, 8_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseClientVideos(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    return jsonOk({ videos: await setClientVideos(parsed.value) });
  } catch (cause) {
    console.error("[client-videos] save failed", cause);

    return jsonError(500, "Could not save the client videos.");
  }
}
