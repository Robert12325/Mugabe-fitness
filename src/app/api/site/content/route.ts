import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  getSiteContent,
  parseSiteContent,
  setSiteContent,
} from "@/lib/server/site-content";
import {
  jsonError,
  jsonOk,
  jsonPublic,
  readJsonBody,
} from "@/lib/server/http";
import { photoSlots } from "@/lib/server/photos";
import { storageConfigured } from "@/lib/server/redis";

/**
 * Public — the programs and method steps every visitor should see. Read on
 * each homepage view, so the CDN may reuse it for up to 30 seconds.
 *
 * `initialized: false` means nothing has been published yet, and the site
 * keeps the built-in content that ships in the code.
 */
export async function GET() {
  if (!storageConfigured()) {
    return jsonError(503, "Site content is not configured.");
  }

  try {
    const [content, slots] = await Promise.all([
      getSiteContent(),
      photoSlots(),
    ]);

    return jsonPublic(
      {
        initialized: content !== null,
        programs: content?.programs ?? [],
        method: content?.method ?? [],
        settings: content?.settings ?? null,
        photoSlots: slots,
      },
      30,
    );
  } catch (cause) {
    console.error("[site-content] load failed", cause);

    return jsonError(500, "Could not load the site content.");
  }
}

/** Admin — publish the dashboard's programs and method steps. */
export async function PUT(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const body = await readJsonBody(request, 256_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseSiteContent(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    await setSiteContent(parsed.value);

    return jsonOk({ ok: true });
  } catch (cause) {
    console.error("[site-content] save failed", cause);

    return jsonError(500, "Could not publish the site content.");
  }
}
