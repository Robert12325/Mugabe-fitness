import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types";
import { rateLimit, redis } from "./redis";

const KEY = "mf:enquiries";

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

export type EnquiryPatch = Partial<Pick<Lead, "status" | "notes">>;

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

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  return { ok: true, value: patch };
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
  };
}

export async function createEnquiry(input: EnquiryInput): Promise<Lead> {
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
    notes: "",
  };

  await redis("HSET", KEY, lead.id, JSON.stringify(lead));

  return lead;
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

/**
 * Read-modify-write. Two people saving the same enquiry in the same instant
 * could overwrite each other; for a single coach that is acceptable and keeps
 * this free of server-side scripts.
 */
export async function updateEnquiry(
  id: string,
  patch: EnquiryPatch,
): Promise<Lead | null> {
  const current = fromStorage(await redis<unknown>("HGET", KEY, id));

  if (!current) return null;

  const next: Lead = { ...current, ...patch };

  await redis("HSET", KEY, id, JSON.stringify(next));

  return next;
}

export async function deleteEnquiry(id: string) {
  return Number(await redis("HDEL", KEY, id)) > 0;
}

export async function clearEnquiries() {
  await redis("DEL", KEY);
}

export function allowSubmission(ip: string) {
  return rateLimit(`mf:rl:enquiry:${ip}`, 5, 10 * 60);
}
