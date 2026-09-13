import { NextResponse } from "next/server";

// Nothing these routes return should ever be cached by a browser or CDN —
// several responses carry personal details.
const NO_STORE = { "Cache-Control": "no-store" };

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

type Body =
  | { ok: true; value: unknown }
  | { ok: false; status: number; message: string };

/** Reads a JSON body, refusing anything over `maxBytes` before parsing it. */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<Body> {
  const declared = Number(request.headers.get("content-length") ?? "0");

  if (declared > maxBytes) {
    return { ok: false, status: 413, message: "Request is too large." };
  }

  let raw: string;

  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400, message: "Could not read the request." };
  }

  if (raw.length > maxBytes) {
    return { ok: false, status: 413, message: "Request is too large." };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400, message: "Request body must be JSON." };
  }
}

/**
 * The caller's IP, used only as a rate-limit key. Vercel overwrites
 * x-forwarded-for at its edge, so in production a client cannot forge it.
 */
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
