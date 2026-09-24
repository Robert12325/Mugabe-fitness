/** Uploading and clearing the site photos the whole world sees. */

export type PhotoSave =
  | { ok: true; url: string }
  | { ok: false; offline?: true; message: string };

function endpoint(slot: number) {
  return `/api/site/photo/${slot}`;
}

async function readError(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();

    if (
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Keep the fallback.
  }

  return fallback;
}

export async function savePhotoSlot(
  slot: number,
  dataUrl: string,
): Promise<PhotoSave> {
  try {
    const response = await fetch(endpoint(slot), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });

    if (response.ok) {
      const body = (await response.json()) as { url?: unknown };

      return {
        ok: true,
        url: typeof body.url === "string" ? body.url : endpoint(slot),
      };
    }

    // Storage or the admin password is not set up: the caller can still keep
    // the picture in this browser.
    if (response.status === 503) {
      return { ok: false, offline: true, message: "No database connected." };
    }

    if (response.status === 401) {
      return {
        ok: false,
        message: "Your admin session expired. Lock, then sign in again.",
      };
    }

    return {
      ok: false,
      message: await readError(
        response,
        `The photo could not be saved (${response.status}).`,
      ),
    };
  } catch {
    return { ok: false, offline: true, message: "Could not reach the server." };
  }
}

export async function removePhotoSlot(slot: number) {
  try {
    const response = await fetch(endpoint(slot), { method: "DELETE" });

    return response.ok || response.status === 503;
  } catch {
    return false;
  }
}
