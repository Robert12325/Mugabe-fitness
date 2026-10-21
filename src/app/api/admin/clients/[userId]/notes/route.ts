import type { NextRequest } from "next/server";
import { parseCoachNote } from "@/lib/daily";
import { requireAdminClient } from "@/lib/server/admin-client";
import { addCoachNote, removeCoachNote } from "@/lib/server/daily";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";

type Context = { params: Promise<{ userId: string }> };

/** Admin — add a private note on a client. Clients never see these. */
export async function POST(request: NextRequest, { params }: Context) {
  const { userId } = await params;
  const gate = await requireAdminClient(request, userId);

  if (!gate.ok) return gate.response;

  const body = await readJsonBody(request, 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parseCoachNote(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    return jsonOk({ notes: await addCoachNote(userId, parsed.value) }, 201);
  } catch (cause) {
    console.error("[clients] note save failed", cause);

    return jsonError(500, "Could not save the note.");
  }
}

/** Admin — delete one note. */
export async function DELETE(request: NextRequest, { params }: Context) {
  const { userId } = await params;
  const gate = await requireAdminClient(request, userId);

  if (!gate.ok) return gate.response;

  const id = request.nextUrl.searchParams.get("id") ?? "";

  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    return jsonError(400, "Which note should be removed?");
  }

  try {
    return jsonOk({ notes: await removeCoachNote(userId, id) });
  } catch (cause) {
    console.error("[clients] note delete failed", cause);

    return jsonError(500, "Could not remove the note.");
  }
}
