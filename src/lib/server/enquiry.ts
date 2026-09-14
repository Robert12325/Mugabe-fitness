import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  MAX_SCREENSHOT,
  NO_PAYMENT,
  PAYMENT_REVIEWS,
  cleanTxnId,
  isImageDataUrl,
  isValidTxnId,
  normalizeEnquiryPayment,
  type PaymentReview,
} from "@/lib/payment";
import {
  LEAD_STATUSES,
  type EnquiryPayment,
  type Lead,
  type LeadStatus,
} from "@/lib/types";
import { pipeline, rateLimit, redis } from "./redis";

const KEY = "mf:enquiries";
/** enquiry id -> sha256 of the token that visitor holds. */
const TOKENS = "mf:enquiry-tokens";
/** enquiry id -> payment screenshot data URL. Kept apart from the enquiry
 *  itself so listing every enquiry never drags every image along. */
const SCREENSHOTS = "mf:payment-screenshots";

/** Set of enquiry ids sent from one visitor account. */
function userEnquiries(userId: string) {
  return `mf:user-enquiries:${userId}`;
}

/** Sent in a header, not the URL, so it never lands in access logs. */
export const ENQUIRY_TOKEN_HEADER = "x-enquiry-token";

// Enquiry ids are UUIDs; anything else never reaches storage.
export const ENQUIRY_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export const LIMITS = {
  name: 100,
  email: 200,
  phone: 30,
  programId: 64,
  slot: 64,
  goal: 64,
  message: 2000,
  notes: 4000,
} as const;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export type EnquiryInput = Pick<
  Lead,
  "name" | "email" | "phone" | "programId" | "slot" | "goal" | "message"
>;

export type EnquiryPatch = Partial<Pick<Lead, "status" | "notes">> & {
  paymentStatus?: PaymentReview;
};

export type PaymentProof = { txnId: string; screenshot: string };

const INPUT_FIELDS = [
  "name",
  "email",
  "phone",
  "programId",
  "slot",
  "goal",
  "message",
] as const;

function asObject(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

/** "" for a missing field, null for a non-string or over-long one. */
function readText(
  body: Record<string, unknown>,
  key: keyof typeof LIMITS,
): string | null {
  const value = body[key];

  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > LIMITS[key] ? null : trimmed;
}

/** A hidden form field real visitors never see. Anything in it means a bot. */
export function isHoneypotFilled(input: unknown) {
  const body = asObject(input);

  return typeof body?.company === "string" && body.company.trim() !== "";
}

export function parseEnquiry(input: unknown): Parsed<EnquiryInput> {
  const body = asObject(input);

  if (!body) return { ok: false, error: "Invalid request." };

  const value = {} as EnquiryInput;

  for (const key of INPUT_FIELDS) {
    const text = readText(body, key);

    if (text === null) {
      return { ok: false, error: `The ${key} field is too long.` };
    }

    value[key] = text;
  }

  if (!value.name) return { ok: false, error: "Please enter your name." };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const digits = value.phone.replace(/\D/g, "").length;

  if (digits < 7 || digits > 15) {
    return { ok: false, error: "Please enter a valid phone number." };
  }

  return { ok: true, value };
}

export function parsePatch(input: unknown): Parsed<EnquiryPatch> {
  const body = asObject(input);

  if (!body) return { ok: false, error: "Invalid request." };

  const patch: EnquiryPatch = {};

  if ("status" in body) {
    if (!LEAD_STATUSES.includes(body.status as LeadStatus)) {
      return { ok: false, error: "Unknown status." };
    }

    patch.status = body.status as LeadStatus;
  }

  if ("notes" in body) {
    const notes = readText(body, "notes");

    if (notes === null) return { ok: false, error: "Notes are too long." };

    patch.notes = notes;
  }

  if ("paymentStatus" in body) {
    if (!PAYMENT_REVIEWS.includes(body.paymentStatus as PaymentReview)) {
      return { ok: false, error: "Unknown payment status." };
    }

    patch.paymentStatus = body.paymentStatus as PaymentReview;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  return { ok: true, value: patch };
}

export function parsePaymentProof(input: unknown): Parsed<PaymentProof> {
  const body = asObject(input);

  if (!body) return { ok: false, error: "Invalid request." };

  const txnId =
    typeof body.txnId === "string" ? cleanTxnId(body.txnId) : "";

  if (!isValidTxnId(txnId)) {
    return {
      ok: false,
      error: "Enter the transaction ID (UTR) from your payment app.",
    };
  }

  const screenshot = typeof body.screenshot === "string" ? body.screenshot : "";

  if (!isImageDataUrl(screenshot, MAX_SCREENSHOT)) {
    return {
      ok: false,
      error: "Upload the payment screenshot as a JPG, PNG or WebP image.",
    };
  }

  return { ok: true, value: { txnId, screenshot } };
}

/** Rebuilds a stored record defensively — a hand-edited or older value must
 *  never break the admin list. */
function fromStorage(raw: unknown): Lead | null {
  let data: unknown = raw;

  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const body = asObject(data);

  if (!body || typeof body.id !== "string") return null;

  const text = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string) : "";

  return {
    id: body.id,
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    programId: text("programId"),
    slot: text("slot"),
    goal: text("goal"),
    message: text("message"),
    status: LEAD_STATUSES.includes(body.status as LeadStatus)
      ? (body.status as LeadStatus)
      : "new",
    createdAt: text("createdAt") || new Date(0).toISOString(),
    notes: text("notes"),
    payment: normalizeEnquiryPayment(body.payment),
    userId: text("userId"),
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest();
}

/**
 * Saves the enquiry and hands back a token only its sender holds. The token
 * is what lets that visitor — and nobody guessing ids — send payment proof
 * and see whether it was verified. Only its hash is stored.
 *
 * Sent while signed in, it is also filed under that account.
 */
export async function createEnquiry(
  input: EnquiryInput,
  userId = "",
): Promise<{ lead: Lead; token: string }> {
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
    notes: "",
    payment: NO_PAYMENT,
    userId,
  };

  const token = randomBytes(24).toString("base64url");

  const commands: (string | number)[][] = [
    ["HSET", KEY, lead.id, JSON.stringify(lead)],
    ["HSET", TOKENS, lead.id, hashToken(token).toString("hex")],
  ];

  if (userId) commands.push(["SADD", userEnquiries(userId), lead.id]);

  await pipeline(commands);

  return { lead, token };
}

export async function tokenMatches(id: string, token: string) {
  if (!token || token.length > 100) return false;

  const stored = await redis<unknown>("HGET", TOKENS, id);

  if (typeof stored !== "string") return false;

  const expected = Buffer.from(stored, "hex");
  const actual = hashToken(token);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function listEnquiries(): Promise<Lead[]> {
  const result = await redis<unknown>("HGETALL", KEY);

  // The REST API returns HGETALL as a flat [field, value, field, value] list.
  const values: unknown[] = Array.isArray(result)
    ? result.filter((_, index) => index % 2 === 1)
    : result && typeof result === "object"
      ? Object.values(result)
      : [];

  return values
    .map((value) => fromStorage(value))
    .filter((lead): lead is Lead => lead !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEnquiry(id: string) {
  return fromStorage(await redis<unknown>("HGET", KEY, id));
}

/** Every enquiry sent from one account, newest first. Ids whose enquiry has
 *  since been deleted simply drop out. */
export async function listUserEnquiries(userId: string): Promise<Lead[]> {
  const ids = await redis<unknown>("SMEMBERS", userEnquiries(userId));

  if (!Array.isArray(ids) || ids.length === 0) return [];

  const values = await redis<unknown>("HMGET", KEY, ...ids.map(String));

  return (Array.isArray(values) ? values : [])
    .map((value) => fromStorage(value))
    .filter((lead): lead is Lead => lead !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type UpdateResult =
  | { ok: true; lead: Lead }
  | { ok: false; reason: "missing" | "no-proof" };

/**
 * Read-modify-write. Two people saving the same enquiry in the same instant
 * could overwrite each other; for a single coach that is acceptable and keeps
 * this free of server-side scripts.
 */
export async function updateEnquiry(
  id: string,
  patch: EnquiryPatch,
): Promise<UpdateResult> {
  const current = await getEnquiry(id);

  if (!current) return { ok: false, reason: "missing" };

  const { paymentStatus, ...fields } = patch;
  let payment = current.payment;

  if (paymentStatus) {
    // Nothing to verify until the visitor has sent proof.
    if (current.payment.status === "none") {
      return { ok: false, reason: "no-proof" };
    }

    payment = {
      ...current.payment,
      status: paymentStatus,
      reviewedAt:
        paymentStatus === "submitted" ? "" : new Date().toISOString(),
    };
  }

  const next: Lead = { ...current, ...fields, payment };

  await redis("HSET", KEY, id, JSON.stringify(next));

  return { ok: true, lead: next };
}

export type ProofResult =
  | { ok: true; payment: EnquiryPayment }
  | { ok: false; reason: "missing" | "locked" };

/** Records a visitor's payment proof. Allowed once, and again only after the
 *  coach rejected the last attempt. */
export async function submitPaymentProof(
  id: string,
  proof: PaymentProof,
): Promise<ProofResult> {
  const current = await getEnquiry(id);

  if (!current) return { ok: false, reason: "missing" };

  if (
    current.payment.status === "submitted" ||
    current.payment.status === "verified"
  ) {
    return { ok: false, reason: "locked" };
  }

  const payment: EnquiryPayment = {
    status: "submitted",
    txnId: proof.txnId,
    submittedAt: new Date().toISOString(),
    reviewedAt: "",
  };

  await pipeline([
    ["HSET", SCREENSHOTS, id, proof.screenshot],
    ["HSET", KEY, id, JSON.stringify({ ...current, payment })],
  ]);

  return { ok: true, payment };
}

export async function getPaymentScreenshot(id: string) {
  const value = await redis<unknown>("HGET", SCREENSHOTS, id);

  return typeof value === "string" ? value : null;
}

export async function deleteEnquiry(id: string) {
  const current = await getEnquiry(id);

  const commands: (string | number)[][] = [
    ["HDEL", KEY, id],
    ["HDEL", TOKENS, id],
    ["HDEL", SCREENSHOTS, id],
  ];

  if (current?.userId) {
    commands.push(["SREM", userEnquiries(current.userId), id]);
  }

  const [removed] = await pipeline(commands);

  return Number(removed) > 0;
}

/** Account booking lists keep the stale ids; `listUserEnquiries` skips them. */
export async function clearEnquiries() {
  await redis("DEL", KEY, TOKENS, SCREENSHOTS);
}

export function allowSubmission(ip: string) {
  return rateLimit(`mf:rl:enquiry:${ip}`, 5, 10 * 60);
}

export function allowPaymentSubmission(ip: string) {
  return rateLimit(`mf:rl:payment:${ip}`, 10, 10 * 60);
}
