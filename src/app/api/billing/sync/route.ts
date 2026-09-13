import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { applySync, parseSyncBatch } from "@/lib/server/billing";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";

/** Admin — apply a batch of client and invoice changes from the dashboard. */
export async function POST(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const body = await readJsonBody(request, 512_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const batch = parseSyncBatch(body.value);

  if (!batch.ok) return jsonError(400, batch.error);

  try {
    const { skipped } = await applySync(batch.value);

    return jsonOk({ ok: true, skipped });
  } catch (cause) {
    console.error("[billing] sync failed", cause);

    return jsonError(500, "Could not save changes.");
  }
}
