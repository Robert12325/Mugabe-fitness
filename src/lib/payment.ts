/**
 * UPI payment for an enquiry: the coach's payment details, and the proof a
 * visitor sends after paying.
 *
 * Shared by the server (to validate before saving) and the browser (to check
 * before sending), so both refuse exactly the same things.
 */

import {
  ENQUIRY_PAYMENT_STATUSES,
  type EnquiryPayment,
  type EnquiryPaymentStatus,
} from "@/lib/types";

export const NO_PAYMENT: EnquiryPayment = {
  status: "none",
  txnId: "",
  submittedAt: "",
  reviewedAt: "",
};

/** What the coach can set a submitted payment to. */
export type PaymentReview = Exclude<EnquiryPaymentStatus, "none">;

export const PAYMENT_REVIEWS: PaymentReview[] = [
  "submitted",
  "verified",
  "rejected",
];

/** Rebuilds a stored payment defensively — an enquiry from before payments
 *  existed simply has none. */
export function normalizeEnquiryPayment(raw: unknown): EnquiryPayment {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return NO_PAYMENT;

  const body = raw as Record<string, unknown>;
  const text = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string) : "";

  return {
    status: ENQUIRY_PAYMENT_STATUSES.includes(
      body.status as EnquiryPaymentStatus,
    )
      ? (body.status as EnquiryPaymentStatus)
      : "none",
    txnId: text("txnId"),
    submittedAt: text("submittedAt"),
    reviewedAt: text("reviewedAt"),
  };
}

/* ------------------------------------------------------------------ */
/* Coach payment details                                               */
/* ------------------------------------------------------------------ */

export type PaymentSettings = {
  upiId: string;
  payeeName: string;
  /** JPEG data URL of the coach's UPI QR code, or "". */
  qrImage: string;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: "",
  payeeName: "",
  qrImage: "",
};

export const MAX_PAYEE_NAME = 80;

/** Base64 characters. Kept well under a megabyte so a single storage request
 *  stays small on Upstash's free plan. */
export const MAX_QR_IMAGE = 400_000;
export const MAX_SCREENSHOT = 700_000;

const UPI_ID = /^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$/;
const TXN_ID = /^[A-Za-z0-9-]{6,40}$/;
const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidUpiId(value: string) {
  return UPI_ID.test(value);
}

/** People paste UTRs with spaces ("4123 5678 9012"); those never matter. */
export function cleanTxnId(value: string) {
  return value.replace(/\s+/g, "");
}

export function isValidTxnId(value: string) {
  return TXN_ID.test(value);
}

export function isImageDataUrl(value: string, maxLength: number) {
  return value.length <= maxLength && IMAGE_DATA_URL.test(value);
}

/** Payments are switched on by the coach saving a UPI ID. */
export function paymentsEnabled(settings: PaymentSettings) {
  return settings.upiId !== "";
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parsePaymentSettings(input: unknown): Parsed<PaymentSettings> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid request." };
  }

  const body = input as Record<string, unknown>;
  const { upiId = "", payeeName = "", qrImage = "" } = body;

  if (
    typeof upiId !== "string" ||
    typeof payeeName !== "string" ||
    typeof qrImage !== "string"
  ) {
    return { ok: false, error: "Invalid request." };
  }

  const value: PaymentSettings = {
    upiId: upiId.trim(),
    payeeName: payeeName.trim(),
    qrImage,
  };

  // An empty UPI ID is allowed: it switches payments off.
  if (value.upiId && !isValidUpiId(value.upiId)) {
    return { ok: false, error: "Enter a UPI ID like name@okaxis." };
  }

  if (value.payeeName.length > MAX_PAYEE_NAME) {
    return { ok: false, error: "The payee name is too long." };
  }

  if (value.qrImage && !isImageDataUrl(value.qrImage, MAX_QR_IMAGE)) {
    return { ok: false, error: "The QR image is invalid or too large." };
  }

  return { ok: true, value };
}

/**
 * A `upi://pay` link that opens the visitor's UPI app with the details filled
 * in. Only useful on a phone. The UPI ID is already restricted to URL-safe
 * characters, so it goes in as-is — some apps misread an encoded "@".
 */
export function upiPayLink(
  settings: PaymentSettings,
  amountMinor: number,
  note: string,
) {
  const parts = [`pa=${settings.upiId}`];

  if (settings.payeeName) {
    parts.push(`pn=${encodeURIComponent(settings.payeeName)}`);
  }

  if (amountMinor > 0) parts.push(`am=${(amountMinor / 100).toFixed(2)}`);

  parts.push("cu=INR");

  if (note) parts.push(`tn=${encodeURIComponent(note.slice(0, 50))}`);

  return `upi://pay?${parts.join("&")}`;
}
