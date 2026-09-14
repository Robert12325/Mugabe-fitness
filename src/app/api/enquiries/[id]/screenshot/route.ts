import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  ENQUIRY_ID_PATTERN,
  getPaymentScreenshot,
} from "@/lib/server/enquiry";
import { jsonError, jsonOk } from "@/lib/server/http";

type Context = { params: Promise<{ id: string }> };

/** Admin — the payment screenshot a visitor sent, loaded only when opened. */
export async function GET(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const { id } = await params;

  if (!ENQUIRY_ID_PATTERN.test(id)) return jsonError(400, "Invalid enquiry id.");

  try {
    const screenshot = await getPaymentScreenshot(id);

    return screenshot
      ? jsonOk({ screenshot })
      : jsonError(404, "No screenshot for this enquiry.");
  } catch (cause) {
    console.error("[payment] screenshot failed", cause);

    return jsonError(500, "Could not load the screenshot.");
  }
}
