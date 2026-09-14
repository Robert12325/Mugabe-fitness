import type { NextRequest } from "next/server";
import { MAX_QR_IMAGE, parsePaymentSettings } from "@/lib/payment";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import {
  jsonError,
  jsonOk,
  jsonPublic,
  readJsonBody,
} from "@/lib/server/http";
import { storageConfigured } from "@/lib/server/redis";
import { getPaymentSettings, setPaymentSettings } from "@/lib/server/site";

/**
 * Public — the UPI ID and QR code visitors pay to. Vercel's CDN may serve it
 * for up to 30 seconds instead of asking the database each time.
 */
export async function GET() {
  if (!storageConfigured()) {
    return jsonError(503, "Site settings are not configured.");
  }

  try {
    return jsonPublic(await getPaymentSettings(), 30);
  } catch (cause) {
    console.error("[payment-settings] load failed", cause);

    return jsonError(500, "Could not load the payment details.");
  }
}

/** Admin — set the UPI ID, payee name and QR code. */
export async function PUT(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const body = await readJsonBody(request, MAX_QR_IMAGE + 4_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const parsed = parsePaymentSettings(body.value);

  if (!parsed.ok) return jsonError(400, parsed.error);

  try {
    return jsonOk(await setPaymentSettings(parsed.value));
  } catch (cause) {
    console.error("[payment-settings] save failed", cause);

    return jsonError(500, "Could not save the payment details.");
  }
}
