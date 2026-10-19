import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk } from "@/lib/server/http";
import { getRenewalScreenshot } from "@/lib/server/membership";

type Context = { params: Promise<{ userId: string; paymentId: string }> };

const ID = /^[A-Za-z0-9-]{8,64}$/;

/** Admin — a renewal's payment screenshot, loaded only when opened. */
export async function GET(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const { userId, paymentId } = await params;

  if (!ID.test(userId) || !ID.test(paymentId)) {
    return jsonError(400, "Invalid payment.");
  }

  try {
    const screenshot = await getRenewalScreenshot(userId, paymentId);

    return screenshot
      ? jsonOk({ screenshot })
      : jsonError(404, "No screenshot for this payment.");
  } catch (cause) {
    console.error("[members] screenshot failed", cause);

    return jsonError(500, "Could not load the screenshot.");
  }
}
