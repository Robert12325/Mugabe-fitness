import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { loadBilling } from "@/lib/server/billing";
import { jsonError, jsonOk } from "@/lib/server/http";

/** Admin — every client and invoice. */
export async function GET(request: NextRequest) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  try {
    return jsonOk(await loadBilling());
  } catch (cause) {
    console.error("[billing] load failed", cause);

    return jsonError(500, "Could not load clients and payments.");
  }
}
