import type { NextRequest } from "next/server";
import { MAX_SCREENSHOT } from "@/lib/payment";
import { canAccessEnquiry } from "@/lib/server/account";
import {
  ENQUIRY_ID_PATTERN,
  allowPaymentSubmission,
  getEnquiry,
  parsePaymentProof,
  submitPaymentProof,
} from "@/lib/server/enquiry";
import {
  clientIp,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";

type Context = { params: Promise<{ id: string }> };

// A wrong id and a wrong token get the same answer, so neither reveals
// whether an enquiry exists.
const NOT_FOUND = "This request could not be found.";

/** The sender — by enquiry token or signed-in account — checks the status. */
export async function GET(request: NextRequest, { params }: Context) {
  if (!storageConfigured()) {
    return jsonError(503, "Payments can't be checked online right now.");
  }

  const { id } = await params;

  if (!ENQUIRY_ID_PATTERN.test(id)) return jsonError(404, NOT_FOUND);

  try {
    if (!(await canAccessEnquiry(request, id))) {
      return jsonError(404, NOT_FOUND);
    }

    const enquiry = await getEnquiry(id);

    return enquiry
      ? jsonOk({ payment: enquiry.payment })
      : jsonError(404, NOT_FOUND);
  } catch (cause) {
    console.error("[payment] status failed", cause);

    return jsonError(500, "Could not check the payment status.");
  }
}

/** The sender sends their screenshot and transaction ID. */
export async function POST(request: NextRequest, { params }: Context) {
  if (!storageConfigured()) {
    return jsonError(503, "Payments can't be received online right now.");
  }

  const { id } = await params;

  if (!ENQUIRY_ID_PATTERN.test(id)) return jsonError(404, NOT_FOUND);

  const body = await readJsonBody(request, MAX_SCREENSHOT + 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const proof = parsePaymentProof(body.value);

  if (!proof.ok) return jsonError(400, proof.error);

  try {
    if (!(await canAccessEnquiry(request, id))) {
      return jsonError(404, NOT_FOUND);
    }

    if (!(await allowPaymentSubmission(clientIp(request)))) {
      return jsonError(
        429,
        "Too many attempts from this device. Please try again in a few minutes.",
      );
    }

    const result = await submitPaymentProof(id, proof.value);

    if (result.ok) return jsonOk({ payment: result.payment }, 201);

    return result.reason === "missing"
      ? jsonError(404, NOT_FOUND)
      : jsonError(409, "A payment for this request is already with the coach.");
  } catch (cause) {
    console.error("[payment] submit failed", cause);

    return jsonError(500, "Your payment details couldn't be saved. Please try again.");
  }
}
