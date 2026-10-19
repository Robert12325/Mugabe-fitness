import type { NextRequest } from "next/server";
import type { MembershipPaymentStatus } from "@/lib/membership";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";
import { reviewRenewal } from "@/lib/server/membership";

type Context = { params: Promise<{ userId: string; paymentId: string }> };

const ID = /^[A-Za-z0-9-]{8,64}$/;

const REVIEWS: MembershipPaymentStatus[] = ["submitted", "verified", "rejected"];

/**
 * Admin — confirm or reject a renewal payment a client sent from their
 * dashboard. Verifying it is what opens their access again; undoing it
 * ("submitted") closes it.
 *
 * Payments sent with a booking are reviewed on the enquiry, as before.
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const { userId, paymentId } = await params;

  if (!ID.test(userId) || !ID.test(paymentId)) {
    return jsonError(400, "Invalid payment.");
  }

  const body = await readJsonBody(request, 1_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const status =
    body.value && typeof body.value === "object"
      ? (body.value as Record<string, unknown>).status
      : undefined;

  if (!REVIEWS.includes(status as MembershipPaymentStatus)) {
    return jsonError(400, "Unknown payment status.");
  }

  try {
    const result = await reviewRenewal(
      userId,
      paymentId,
      status as MembershipPaymentStatus,
    );

    return result.ok
      ? jsonOk({ membership: result.membership })
      : jsonError(404, "Payment not found.");
  } catch (cause) {
    console.error("[members] review failed", cause);

    return jsonError(500, "Could not update the payment.");
  }
}
