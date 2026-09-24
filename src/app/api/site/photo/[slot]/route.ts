import type { NextRequest } from "next/server";
import { denyUnlessAdmin } from "@/lib/server/admin-auth";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/http";
import {
  getPhoto,
  parsePhoto,
  readSlot,
  removePhoto,
  setPhoto,
} from "@/lib/server/photos";
import { storageConfigured } from "@/lib/server/redis";

type Context = { params: Promise<{ slot: string }> };

/** Public — the image itself, so pages can point an img at it. */
export async function GET(_request: NextRequest, { params }: Context) {
  if (!storageConfigured()) return jsonError(503, "Photos are not configured.");

  const slot = readSlot((await params).slot);

  if (slot === null) return jsonError(404, "No such photo.");

  try {
    const photo = await getPhoto(slot);

    if (!photo) return jsonError(404, "No photo set for this slot.");

    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(photo.bytes.byteLength),
        // Replacing a photo shows up within a minute.
        "Cache-Control":
          "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (cause) {
    console.error("[site-photo] load failed", cause);

    return jsonError(500, "Could not load the photo.");
  }
}

/** Admin — replace the photo in one slot. */
export async function PUT(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const slot = readSlot((await params).slot);

  if (slot === null) return jsonError(404, "No such photo.");

  // Roomy enough for a 900KB image once base64 has grown it by a third.
  const body = await readJsonBody(request, 1_400_000);

  if (!body.ok) return jsonError(body.status, body.message);

  const photo = parsePhoto(
    body.value && typeof body.value === "object"
      ? (body.value as Record<string, unknown>).dataUrl
      : undefined,
  );

  if (!photo.ok) return jsonError(400, photo.error);

  try {
    await setPhoto(slot, photo.dataUrl);

    return jsonOk({ ok: true, url: `/api/site/photo/${slot}` });
  } catch (cause) {
    console.error("[site-photo] save failed", cause);

    return jsonError(500, "Could not save the photo.");
  }
}

/** Admin — go back to the built-in picture for this slot. */
export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = denyUnlessAdmin(request);

  if (denied) return denied;

  const slot = readSlot((await params).slot);

  if (slot === null) return jsonError(404, "No such photo.");

  try {
    await removePhoto(slot);

    return jsonOk({ ok: true });
  } catch (cause) {
    console.error("[site-photo] delete failed", cause);

    return jsonError(500, "Could not remove the photo.");
  }
}
