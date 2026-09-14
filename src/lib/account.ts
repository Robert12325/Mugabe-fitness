/**
 * Visitor accounts: what a signed-in visitor looks like, and the checks on
 * sign-up and log-in details.
 *
 * Shared by the server (to validate before saving) and the browser (to show
 * the same message next to the field before sending).
 */

import { normalizeEnquiryPayment } from "@/lib/payment";
import type { EnquiryPayment } from "@/lib/types";

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

/** An enquiry as its sender sees it — never the coach's notes or pipeline
 *  status. */
export type AccountBooking = {
  id: string;
  programId: string;
  slot: string;
  goal: string;
  createdAt: string;
  payment: EnquiryPayment;
};

export type Registration = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type Credentials = { email: string; password: string };

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; field: string; error: string };

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function readString(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? (body[key] as string) : "";
}

/** Emails are matched case-insensitively: "Ravi@Gmail.com" is one account. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function passwordProblem(password: string) {
  if (password.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }

  if (password.length > PASSWORD_MAX) return "That password is too long.";

  return "";
}

export function parseRegistration(input: unknown): Parsed<Registration> {
  const body = asObject(input);

  const name = readString(body, "name").trim();
  const email = normalizeEmail(readString(body, "email"));
  const phone = readString(body, "phone").trim();
  // Passwords are taken exactly as typed — spaces included.
  const password = readString(body, "password");

  if (!name) {
    return { ok: false, field: "name", error: "Please enter your name." };
  }

  if (name.length > 100) {
    return { ok: false, field: "name", error: "That name is too long." };
  }

  const digits = phone.replace(/\D/g, "").length;

  if (phone.length > 30 || digits < 7 || digits > 15) {
    return {
      ok: false,
      field: "phone",
      error: "Please enter a valid phone number.",
    };
  }

  if (email.length > 200 || !EMAIL.test(email)) {
    return { ok: false, field: "email", error: "Please enter a valid email." };
  }

  const problem = passwordProblem(password);

  if (problem) return { ok: false, field: "password", error: problem };

  return { ok: true, value: { name, email, phone, password } };
}

export function parseCredentials(input: unknown): Parsed<Credentials> {
  const body = asObject(input);

  const email = normalizeEmail(readString(body, "email"));
  const password = readString(body, "password");

  if (email.length > 200 || !EMAIL.test(email)) {
    return { ok: false, field: "email", error: "Please enter a valid email." };
  }

  if (!password || password.length > PASSWORD_MAX) {
    return { ok: false, field: "password", error: "Enter your password." };
  }

  return { ok: true, value: { email, password } };
}

export function normalizeAccountUser(raw: unknown): AccountUser | null {
  const body = asObject(raw);

  if (typeof body.id !== "string" || typeof body.email !== "string") {
    return null;
  }

  return {
    id: body.id,
    name: readString(body, "name"),
    email: body.email,
    phone: readString(body, "phone"),
    createdAt: readString(body, "createdAt"),
  };
}

export function normalizeAccountBooking(raw: unknown): AccountBooking | null {
  const body = asObject(raw);

  if (typeof body.id !== "string") return null;

  return {
    id: body.id,
    programId: readString(body, "programId"),
    slot: readString(body, "slot"),
    goal: readString(body, "goal"),
    createdAt: readString(body, "createdAt"),
    payment: normalizeEnquiryPayment(body.payment),
  };
}
