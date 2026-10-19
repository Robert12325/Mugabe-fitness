import type { NextRequest } from "next/server";
import { MAX_SCREENSHOT } from "@/lib/payment";
import { userFromRequest } from "@/lib/server/account";
import {
  allowPaymentSubmission,
  parsePaymentProof,
} from "@/lib/server/enquiry";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { latestRenewal, submitRenewal } from "@/lib/server/membership";
import { storageConfigured } from "@/lib/server/redis";

/**
 * A signed-in client paying for their membership from the dashboard.
 *
 * The user id comes from the session, never the body. What is sent here is
 * only proof of a payment: it is stored as "submitted" and opens nothing
 * until the coach (or, later, a payment provider) confirms it.
 */

const UNAVAILABLE = "Payments can't be received online right now.";

/** Where the latest renewal stands, for the payment screen to follow. */
export async function GET(request: NextRequest) {
  if (!storageConfigured()) return jsonError(503, UNAVAILABLE);

  try {
    const user = await userFromRequest(request);

    if (!user) return jsonError(401, "Please log in again.");

    return jsonOk({ payment: await latestRenewal(user.id) });
  } catch (cause) {
    console.error("[membership] status failed", cause);

    return jsonError(500, "Could not check the payment status.");
  }
}

export async function POST(request: NextRequest) {
  if (!storageConfigured()) return jsonError(503, UNAVAILABLE);

  const body = await readJsonBody(request, MAX_SCREENSHOT + 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const proof = parsePaymentProof(body.value);

  if (!proof.ok) return jsonError(400, proof.error);

  try {
    const user = await userFromRequest(request);

    if (!user) return jsonError(401, "Please log in again.");

    if (!(await allowPaymentSubmission(clientIp(request)))) {
      return jsonError(
        429,
        "Too many attempts from this device. Please try again in a few minutes.",
      );
    }

    const result = await submitRenewal(user.id, proof.value);

    if (result.ok) return jsonOk({ payment: result.payment }, 201);

    return result.reason === "missing"
      ? jsonError(404, "Book a program first — your membership starts there.")
      : jsonError(409, "A payment is already with the coach for checking.");
  } catch (cause) {
    console.error("[membership] submit failed", cause);

    return jsonError(500, "Your payment details couldn't be saved. Please try again.");
  }
}
