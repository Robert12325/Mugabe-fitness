import { readError } from "@/lib/enquiries-client";
import { formatBytes, prepareImage } from "@/lib/image";
import { createLocalStore } from "@/lib/local-store";
import {
  DEFAULT_PAYMENT_SETTINGS,
  MAX_QR_IMAGE,
  MAX_SCREENSHOT,
  normalizeEnquiryPayment,
  type PaymentSettings,
} from "@/lib/payment";
import type { EnquiryPayment } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Coach payment details                                               */
/* ------------------------------------------------------------------ */

export type PaymentSettingsLoad =
  | { state: "online"; settings: PaymentSettings }
  | { state: "offline" }
  | { state: "error" };

const SETTINGS_ENDPOINT = "/api/site/payment";

function toSettings(body: unknown): PaymentSettings {
  if (!body || typeof body !== "object") return DEFAULT_PAYMENT_SETTINGS;

  const { upiId, payeeName, qrImage } = body as Record<string, unknown>;

  return {
    upiId: typeof upiId === "string" ? upiId : "",
    payeeName: typeof payeeName === "string" ? payeeName : "",
    qrImage: typeof qrImage === "string" ? qrImage : "",
  };
}

/** `fresh` skips the CDN copy, so the admin sees what was just saved. */
export async function fetchPaymentSettings({
  fresh = false,
}: { fresh?: boolean } = {}): Promise<PaymentSettingsLoad> {
  try {
    const response = await fetch(
      fresh ? `${SETTINGS_ENDPOINT}?fresh=${Date.now()}` : SETTINGS_ENDPOINT,
      fresh ? { cache: "no-store" } : undefined,
    );

    if (response.status === 503) return { state: "offline" };
    if (!response.ok) return { state: "error" };

    return { state: "online", settings: toSettings(await response.json()) };
  } catch {
    return { state: "error" };
  }
}

export type SettingsSave =
  | { ok: true; settings: PaymentSettings }
  | { ok: false; message: string };

export async function savePaymentSettings(
  settings: PaymentSettings,
): Promise<SettingsSave> {
  try {
    const response = await fetch(SETTINGS_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (response.ok) {
      return { ok: true, settings: toSettings(await response.json()) };
    }

    if (response.status === 401) {
      return {
        ok: false,
        message: "Your admin session expired. Lock, then sign in again.",
      };
    }

    return { ok: false, message: await readError(response) };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

/** Shrinks a picked image until it fits `maxLength` base64 characters. */
async function fitImage(
  file: File,
  maxLength: number,
  attempts: [maxEdge: number, quality: number][],
) {
  let last = "";

  for (const [maxEdge, quality] of attempts) {
    const image = await prepareImage(file, maxEdge, quality);

    if (image.dataUrl.length <= maxLength) return image.dataUrl;

    last = formatBytes(image.bytes);
  }

  throw new Error(`That image is still ${last} after compressing. Try a smaller one.`);
}

/** A QR code needs sharp edges, so it is compressed gently. */
export function prepareQrImage(file: File) {
  return fitImage(file, MAX_QR_IMAGE, [
    [900, 0.92],
    [700, 0.85],
  ]);
}

/** Tall phone screenshots keep enough detail to read the UTR and amount. */
export function prepareScreenshot(file: File) {
  return fitImage(file, MAX_SCREENSHOT, [
    [1600, 0.8],
    [1200, 0.65],
    [1000, 0.5],
  ]);
}

/* ------------------------------------------------------------------ */
/* Visitor payment                                                     */
/* ------------------------------------------------------------------ */

/**
 * An enquiry the visitor can pay for. `token` is either the enquiry's own
 * token (`via: "enquiry"`, from sending the form) or the visitor's account
 * session (`via: "account"`, from the account page).
 */
export type Booking = {
  id: string;
  token: string;
  via: "enquiry" | "account";
  programName: string;
  /** As shown on the program card, e.g. "₹3,000/month". */
  amountLabel: string;
  amountMinor: number;
};

type Access = Pick<Booking, "id" | "token" | "via">;

function paymentUrl(id: string) {
  return `/api/enquiries/${encodeURIComponent(id)}/payment`;
}

function accessHeaders(access: Access): Record<string, string> {
  return access.via === "account"
    ? { Authorization: `Bearer ${access.token}` }
    : { "x-enquiry-token": access.token };
}

async function readPayment(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    payment?: unknown;
  } | null;

  return normalizeEnquiryPayment(body?.payment);
}

export type StatusLoad =
  | { state: "ok"; payment: EnquiryPayment }
  | { state: "missing" }
  | { state: "error" };

export async function fetchEnquiryPayment(access: Access): Promise<StatusLoad> {
  try {
    const response = await fetch(paymentUrl(access.id), {
      headers: accessHeaders(access),
      cache: "no-store",
    });

    if (response.status === 404) return { state: "missing" };
    if (!response.ok) return { state: "error" };

    return { state: "ok", payment: await readPayment(response) };
  } catch {
    return { state: "error" };
  }
}

export type ProofResult =
  | { ok: true; payment: EnquiryPayment }
  | {
      ok: false;
      kind: "invalid" | "missing" | "locked" | "rate" | "unavailable" | "network";
      message: string;
    };

export async function sendPaymentProof(
  access: Access,
  proof: { txnId: string; screenshot: string },
): Promise<ProofResult> {
  let response: Response;

  try {
    response = await fetch(paymentUrl(access.id), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...accessHeaders(access) },
      body: JSON.stringify(proof),
    });
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "You appear to be offline. Check your connection and try again.",
    };
  }

  if (response.ok) return { ok: true, payment: await readPayment(response) };

  const message = await readError(response);

  const kind =
    response.status === 400
      ? "invalid"
      : response.status === 404
        ? "missing"
        : response.status === 409
          ? "locked"
          : response.status === 429
            ? "rate"
            : "unavailable";

  return { ok: false, kind, message };
}

/** Admin — the screenshot for one enquiry, or null if there isn't one. */
export async function loadPaymentScreenshot(id: string) {
  try {
    const response = await fetch(
      `/api/enquiries/${encodeURIComponent(id)}/screenshot`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    const body = (await response.json()) as { screenshot?: unknown };

    return typeof body.screenshot === "string" ? body.screenshot : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* The visitor's open booking                                          */
/*                                                                     */
/* Kept in localStorage so a visitor who reloads, or comes back later,  */
/* lands on their payment or its status instead of an empty form.       */
/* ------------------------------------------------------------------ */

function parseBooking(raw: unknown): Booking | null {
  if (!raw || typeof raw !== "object") return null;

  const body = raw as Partial<Booking>;

  if (typeof body.id !== "string" || typeof body.token !== "string") {
    return null;
  }

  return {
    id: body.id,
    token: body.token,
    via: body.via === "account" ? "account" : "enquiry",
    programName: typeof body.programName === "string" ? body.programName : "",
    amountLabel: typeof body.amountLabel === "string" ? body.amountLabel : "",
    amountMinor: Number.isFinite(body.amountMinor)
      ? Number(body.amountMinor)
      : 0,
  };
}

const bookingStore = createLocalStore("mugabe-fitness:booking", parseBooking);

export const subscribeBooking = bookingStore.subscribe;
export const getBooking = bookingStore.get;
export const getBookingOnServer = bookingStore.getServer;
export const saveBooking = bookingStore.set;
export const clearBooking = bookingStore.clear;
