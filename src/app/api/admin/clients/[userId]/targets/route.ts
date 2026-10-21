import type { NextRequest } from "next/server";
import { parseTargets } from "@/lib/daily";
import { requireAdminClient } from "@/lib/server/admin-client";
import { setTargets } from "@/lib/server/daily";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";

type Context = { params: Promise<{ userId: string }> };

/** Admin — set a client's targets. Any target left empty is cleared. */
export async function PUT(request: NextRequest, { params }: Context) {
  const { userId } = await params;
  const gate = await requireAdminClient(request, userId);

  if (!gate.ok) return gate.response;

  const body = await readJsonBody(request, 2_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseTargets(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    return jsonOk({ targets: await setTargets(userId, parsed.value) });
  } catch (cause) {
    console.error("[clients] targets save failed", cause);

    return jsonError(500, "Could not save the targets.");
  }
}
