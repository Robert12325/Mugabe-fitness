import { pipeline, redis } from "./redis";

/**
 * Site photos live one per key, and are served as real image files rather
 * than inside the content document: four pictures would add roughly a
 * megabyte to a response the homepage fetches on every visit.
 */

export const MAX_PHOTO_SLOTS = 4;

/** Uploads are downscaled in the browser first; this is the backstop. */
const MAX_PHOTO_BYTES = 900 * 1024;

const DATA_URL = /^data:image\/(jpeg|png|webp|avif);base64,([A-Za-z0-9+/=]+)$/;

function key(slot: number) {
  return `mf:site:photo:${slot}`;
}

/** Returns the slot number, or null when it is out of range. */
export function readSlot(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;

  const slot = Number(raw);

  return slot >= 0 && slot < MAX_PHOTO_SLOTS ? slot : null;
}

type Parsed = { ok: true; dataUrl: string } | { ok: false; error: string };

export function parsePhoto(input: unknown): Parsed {
  if (typeof input !== "string") {
    return { ok: false, error: "Expected an image." };
  }

  const dataUrl = input.trim();
  const match = DATA_URL.exec(dataUrl);

  if (!match) {
    return {
      ok: false,
      error: "Only JPG, PNG, WebP or AVIF images can be stored.",
    };
  }

  // base64 carries three bytes in every four characters.
  const bytes = Math.floor((match[2].length * 3) / 4);

  if (bytes > MAX_PHOTO_BYTES) {
    return { ok: false, error: "That image is too large to store." };
  }

  return { ok: true, dataUrl };
}

export type StoredPhoto = { contentType: string; bytes: Buffer };

export async function getPhoto(slot: number): Promise<StoredPhoto | null> {
  const raw = await redis<unknown>("GET", key(slot));

  if (typeof raw !== "string") return null;

  const match = DATA_URL.exec(raw);

  if (!match) return null;

  return {
    contentType: `image/${match[1]}`,
    bytes: Buffer.from(match[2], "base64"),
  };
}

export async function setPhoto(slot: number, dataUrl: string) {
  await redis("SET", key(slot), dataUrl);
}

export async function removePhoto(slot: number) {
  await redis("DEL", key(slot));
}

/** Which slots have a photo — asked for on every homepage view, so it must
 *  not drag the image data along with it. */
export async function photoSlots(): Promise<boolean[]> {
  const results = await pipeline(
    Array.from({ length: MAX_PHOTO_SLOTS }, (_, slot) => ["EXISTS", key(slot)]),
  );

  return results.map((result) => Number(result) === 1);
}
