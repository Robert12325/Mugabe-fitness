import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  ENQUIRY_ID_PATTERN,
  deleteEnquiry,
  parsePatch,
  updateEnquiry,
} from "@/lib/server/enquiry";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";

type Context = { params: Promise<{ id: string }> };

/** Admin — change an enquiry's status, notes, and/or payment review. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const { id } = await params;

  if (!ENQUIRY_ID_PATTERN.test(id)) return jsonError(400, "Invalid enquiry id.");

  const body = await readJsonBody(request, 8_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const patch = parsePatch(body.value);

  if (!patch.ok) return jsonError(400, patch.error);

  try {
    const updated = await updateEnquiry(id, patch.value);

    if (updated.ok) return jsonOk({ enquiry: updated.lead });

    return updated.reason === "missing"
      ? jsonError(404, "Enquiry not found.")
      : jsonError(409, "No payment has been submitted for this enquiry.");
  } catch (cause) {
    console.error("[enquiries] update failed", cause);

    return jsonError(500, "Could not update the enquiry.");
  }
}

/** Admin — delete one enquiry. */
export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const { id } = await params;

  if (!ENQUIRY_ID_PATTERN.test(id)) return jsonError(400, "Invalid enquiry id.");

  try {
    return (await deleteEnquiry(id))
      ? jsonOk({ ok: true })
      : jsonError(404, "Enquiry not found.");
  } catch (cause) {
    console.error("[enquiries] delete failed", cause);

    return jsonError(500, "Could not delete the enquiry.");
  }
}
