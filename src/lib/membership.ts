/**
 * A client's access: the free trial that starts when they book, and the
 * monthly payments that keep it open afterwards.
 *
 * Shared by the server (which works the status out and enforces it) and the
 * browser (which only shows what the server worked out).
 *
 * Nothing here trusts a click. A payment counts towards access only once it
 * is "verified" — today by the coach checking their UPI app, later by a
 * payment provider confirming it on the server. Access is never stored as a
 * flag either: like an overdue invoice, it is derived from the trial window
 * and the verified payments every time it is read, so it can't sit in the
 * database claiming something that stopped being true at midnight.
 *
 * Unlike billing due dates, these are instants (ISO timestamps), not calendar
 * days: a trial is 72 hours from the moment it starts, wherever the client is.
 */

import type { EnquiryPaymentStatus } from "@/lib/types";

export const TRIAL_DAYS = 3;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/**
 * - none: never booked a program while signed in, so there is no trial.
 * - trial: inside the free trial.
 * - paid: inside a month that has been paid for and confirmed.
 * - due: a paying client whose last paid month has run out.
 * - expired: the trial ran out and nothing was ever paid.
 *
 * Only "trial" and "paid" open the dashboard.
 */
export type MembershipStatus = "none" | "trial" | "paid" | "due" | "expired";

export const MEMBERSHIP_STATUSES: MembershipStatus[] = [
  "trial",
  "paid",
  "due",
  "expired",
];

/** A payment that has reached the coach — never one merely started. */
export type MembershipPaymentStatus = Exclude<EnquiryPaymentStatus, "none">;

export type MembershipPayment = {
  /** "booking:<enquiry id>" or a renewal's own id. */
  id: string;
  /** Paid with the booking it started from, or later from the dashboard. */
  source: "booking" | "renewal";
  /** The booking's enquiry id, or "" for a renewal. */
  enquiryId: string;
  amountMinor: number;
  status: MembershipPaymentStatus;
  /** How it was paid, e.g. "UPI". A gateway would put its name here. */
  method: string;
  /** UPI transaction reference (UTR), or the provider's payment id. */
  reference: string;
  submittedAt: string;
  reviewedAt: string;
  /** The month of access it bought. Only set once verified. */
  coversFrom: string;
  coversTo: string;
};

export type Membership = {
  status: MembershipStatus;
  hasAccess: boolean;
  programId: string;
  /** "" when the program has since been removed from the site. */
  programName: string;
  /** As on the program card, e.g. "₹3,000/month". */
  priceLabel: string;
  /** 0 when the price can't be read; the coach then confirms it. */
  feeMinor: number;
  trialStartedAt: string;
  trialEndsAt: string;
  /** End of the last paid month, or "" if nothing is paid yet. */
  paidThrough: string;
  /** When the next payment falls due: the trial's end, the paid month's
   *  end, or — once access has lapsed — the moment it lapsed. */
  nextDueAt: string;
  /** What has to be paid now to get back in. 0 while access is open. */
  outstandingMinor: number;
  amountPaidMinor: number;
  lastPaidAt: string;
  /** A payment is with the coach waiting to be checked. */
  pending: boolean;
  /** Where the latest dashboard renewal stands, so the payment screen can
   *  pick up where it left off. */
  renewal: EnquiryPaymentStatus;
  /** Newest first. */
  payments: MembershipPayment[];
};

export const NO_MEMBERSHIP: Membership = {
  status: "none",
  hasAccess: false,
  programId: "",
  programName: "",
  priceLabel: "",
  feeMinor: 0,
  trialStartedAt: "",
  trialEndsAt: "",
  paidThrough: "",
  nextDueAt: "",
  outstandingMinor: 0,
  amountPaidMinor: 0,
  lastPaidAt: "",
  pending: false,
  renewal: "none",
  payments: [],
};

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

function toMs(iso: string) {
  const ms = Date.parse(iso);

  return Number.isFinite(ms) ? ms : NaN;
}

/**
 * The same moment one calendar month later. A day the next month doesn't
 * have (31 January) lands on its last day (28 or 29 February) rather than
 * spilling into March.
 */
export function addOneMonth(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return iso;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(month);
  date.setUTCDate(Math.min(new Date(iso).getUTCDate(), lastDay));

  return date.toISOString();
}

export function trialEnd(startedAt: string) {
  const start = toMs(startedAt);

  return Number.isFinite(start) ? new Date(start + TRIAL_MS).toISOString() : "";
}

/* ------------------------------------------------------------------ */
/* Working out the status                                              */
/* ------------------------------------------------------------------ */

export type MembershipInput = {
  programId: string;
  programName: string;
  priceLabel: string;
  feeMinor: number;
  trialStartedAt: string;
  /** Every payment, any status, any order. */
  payments: Omit<MembershipPayment, "coversFrom" | "coversTo">[];
};

/**
 * Lays each verified payment end to end, oldest first. A month paid during
 * the trial starts when the trial ends, so paying early never costs trial
 * days; a month paid after access lapsed starts the moment it was paid; a
 * month paid ahead starts where the last one finishes.
 */
export function computeMembership(
  input: MembershipInput,
  now = Date.now(),
): Membership {
  const trialEndsAt = trialEnd(input.trialStartedAt);

  const verified = input.payments
    .filter((payment) => payment.status === "verified")
    .map((payment) => ({
      payment,
      at: payment.submittedAt || payment.reviewedAt,
    }))
    .sort((a, b) => a.at.localeCompare(b.at));

  const covers = new Map<string, { from: string; to: string }>();
  let cursor = trialEndsAt;

  for (const { payment, at } of verified) {
    const from = toMs(at) > toMs(cursor) ? at : cursor;
    const to = addOneMonth(from);

    covers.set(payment.id, { from, to });
    cursor = to;
  }

  const paidThrough = verified.length > 0 ? cursor : "";
  const paidOpen = paidThrough !== "" && toMs(paidThrough) > now;
  const trialOpen = trialEndsAt !== "" && toMs(trialEndsAt) > now;

  const status: MembershipStatus = !input.trialStartedAt
    ? "none"
    : paidOpen
      ? "paid"
      : trialOpen
        ? "trial"
        : verified.length > 0
          ? "due"
          : "expired";

  const hasAccess = status === "paid" || status === "trial";

  const nextDueAt =
    status === "paid"
      ? paidThrough
      : status === "trial"
        ? trialEndsAt
        : status === "due"
          ? paidThrough
          : status === "expired"
            ? trialEndsAt
            : "";

  const payments: MembershipPayment[] = input.payments
    .map((payment) => ({
      ...payment,
      coversFrom: covers.get(payment.id)?.from ?? "",
      coversTo: covers.get(payment.id)?.to ?? "",
    }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const renewal =
    payments.find((payment) => payment.source === "renewal")?.status ?? "none";

  const last = verified[verified.length - 1];

  return {
    status,
    hasAccess,
    programId: input.programId,
    programName: input.programName,
    priceLabel: input.priceLabel,
    feeMinor: input.feeMinor,
    trialStartedAt: input.trialStartedAt,
    trialEndsAt,
    paidThrough,
    nextDueAt,
    outstandingMinor:
      status === "due" || status === "expired" ? input.feeMinor : 0,
    amountPaidMinor: verified.reduce(
      (sum, { payment }) => sum + payment.amountMinor,
      0,
    ),
    lastPaidAt: last?.at ?? "",
    pending: input.payments.some((payment) => payment.status === "submitted"),
    renewal,
    payments,
  };
}

/* ------------------------------------------------------------------ */
/* Reading it back in the browser                                      */
/* ------------------------------------------------------------------ */

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? (body[key] as string) : "";
}

function minor(body: Record<string, unknown>, key: string) {
  const value = body[key];

  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

const STATUSES: MembershipStatus[] = ["none", ...MEMBERSHIP_STATUSES];
const PAYMENT_STATUSES: MembershipPaymentStatus[] = [
  "submitted",
  "verified",
  "rejected",
];

function normalizePayment(raw: unknown): MembershipPayment | null {
  const body = asObject(raw);

  if (typeof body.id !== "string") return null;

  return {
    id: body.id,
    source: body.source === "renewal" ? "renewal" : "booking",
    enquiryId: text(body, "enquiryId"),
    amountMinor: minor(body, "amountMinor"),
    status: PAYMENT_STATUSES.includes(body.status as MembershipPaymentStatus)
      ? (body.status as MembershipPaymentStatus)
      : "submitted",
    method: text(body, "method"),
    reference: text(body, "reference"),
    submittedAt: text(body, "submittedAt"),
    reviewedAt: text(body, "reviewedAt"),
    coversFrom: text(body, "coversFrom"),
    coversTo: text(body, "coversTo"),
  };
}

export function normalizeMembership(raw: unknown): Membership {
  const body = asObject(raw);
  const status = STATUSES.includes(body.status as MembershipStatus)
    ? (body.status as MembershipStatus)
    : "none";

  return {
    status,
    // Re-derived rather than read, so a garbled reply can only ever close
    // the dashboard, never open it. The server enforces it either way.
    hasAccess: status === "trial" || status === "paid",
    programId: text(body, "programId"),
    programName: text(body, "programName"),
    priceLabel: text(body, "priceLabel"),
    feeMinor: minor(body, "feeMinor"),
    trialStartedAt: text(body, "trialStartedAt"),
    trialEndsAt: text(body, "trialEndsAt"),
    paidThrough: text(body, "paidThrough"),
    nextDueAt: text(body, "nextDueAt"),
    outstandingMinor: minor(body, "outstandingMinor"),
    amountPaidMinor: minor(body, "amountPaidMinor"),
    lastPaidAt: text(body, "lastPaidAt"),
    pending: body.pending === true,
    renewal:
      body.renewal === "submitted" ||
      body.renewal === "verified" ||
      body.renewal === "rejected"
        ? body.renewal
        : "none",
    payments: (Array.isArray(body.payments) ? body.payments : [])
      .map(normalizePayment)
      .filter((payment): payment is MembershipPayment => payment !== null),
  };
}

/** "4 Oct 2026, 6:30 pm" in the viewer's own timezone. */
export function formatMoment(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "4 Oct 2026" in the viewer's own timezone. */
export function formatDay(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
