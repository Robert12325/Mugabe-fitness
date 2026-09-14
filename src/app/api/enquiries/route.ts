import type { NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/account";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  allowSubmission,
  clearEnquiries,
  createEnquiry,
  isHoneypotFilled,
  listEnquiries,
  parseEnquiry,
} from "@/lib/server/enquiry";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";

/** Public — a visitor submits the contact form. */
export async function POST(request: NextRequest) {
  if (!storageConfigured()) {
    return jsonError(503, "Requests can't be received online right now.");
  }

  const body = await readJsonBody(request, 16_000);

  if (!body.ok) return jsonError(body.status, body.message);

  // Answer bots exactly like a real success, so they learn nothing, and
  // store nothing.
  if (isHoneypotFilled(body.value)) return jsonOk({ ok: true }, 201);

  const parsed = parseEnquiry(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    // Checked after validation, so a mistyped form doesn't burn the quota.
    if (!(await allowSubmission(clientIp(request)))) {
      return jsonError(
        429,
        "Too many requests from this device. Please try again in a few minutes.",
      );
    }

    // Signed in: the request is filed under their account as well. An
    // expired session just sends it as a guest.
    const user = await userFromRequest(request);
    const { lead, token } = await createEnquiry(parsed.value, user?.id ?? "");

    // The token is the visitor's only key to paying for, and following, this
    // request — it is never shown to anyone else.
    return jsonOk({ ok: true, id: lead.id, token }, 201);
  } catch (cause) {
    console.error("[enquiries] create failed", cause);

    return jsonError(500, "Your request couldn't be saved. Please try again.");
  }
}

/** Admin — every enquiry, newest first. */
export async function GET(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  try {
    return jsonOk({ enquiries: await listEnquiries() });
  } catch (cause) {
    console.error("[enquiries] list failed", cause);

    return jsonError(500, "Could not load enquiries.");
  }
}

/** Admin — delete every enquiry. */
export async function DELETE(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  try {
    await clearEnquiries();

    return jsonOk({ ok: true });
  } catch (cause) {
    console.error("[enquiries] clear failed", cause);

    return jsonError(500, "Could not delete enquiries.");
  }
}
