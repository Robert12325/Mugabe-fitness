import type { Payment, PaymentStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/*                                                                     */
/* Due dates are calendar days, not instants. They are handled as plain */
/* YYYY-MM-DD strings throughout: building a Date and calling           */
/* toISOString() shifts the day backwards for anyone east of UTC, which */
/* is exactly the off-by-one that makes an invoice look overdue a day    */
/* early in India.                                                      */
/* ------------------------------------------------------------------ */

/** Local calendar date as YYYY-MM-DD (never via toISOString). */
export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Captured once when this module loads, so nothing calls an impure clock
 * during render. A dashboard left open overnight shows the day it was
 * opened; reloading refreshes it.
 */
export const TODAY = toISODate(new Date());

/** YYYY-MM for a YYYY-MM-DD. */
export function periodOf(isoDate: string) {
  return isoDate.slice(0, 7);
}

export const THIS_PERIOD = periodOf(TODAY);

/** Shifts a YYYY-MM period by n months. */
export function addMonths(period: string, n: number) {
  const [year, month] = period.split("-").map(Number);

  // Work in absolute months so negatives and year rollover both fall out.
  const total = year * 12 + (month - 1) + n;

  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Whole months from a to b (b - a). */
export function monthsBetween(a: string, b: string) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);

  return by * 12 + bm - (ay * 12 + am);
}

/**
 * The due date for a period. `billingDay` is clamped to 1-28 on the way in,
 * so February can never produce an invalid 30th.
 */
export function dueDateFor(period: string, billingDay: number) {
  const day = clampBillingDay(billingDay);

  return `${period}-${String(day).padStart(2, "0")}`;
}

export function clampBillingDay(day: number) {
  if (!Number.isFinite(day)) return 1;

  return Math.min(28, Math.max(1, Math.round(day)));
}

export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) return isoDate;

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);

  if (!year || !month) return period;

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/*                                                                     */
/* Stored as integer paise. 0.1 + 0.2 !== 0.3 in binary floating point, */
/* and that error compounds across a ledger.                            */
/* ------------------------------------------------------------------ */

/** Parses "₹3,000", "3000", "3,000.50" into paise. */
export function parseMoney(input: string): number {
  const cleaned = String(input).replace(/[^0-9.]/g, "");

  if (!cleaned) return 0;

  const value = Number.parseFloat(cleaned);

  if (!Number.isFinite(value) || value < 0) return 0;

  return Math.round(value * 100);
}

export function formatMoney(minor: number) {
  const safe = Number.isFinite(minor) ? minor : 0;
  const major = safe / 100;

  // Whole rupees are the common case; only show paise when there are any.
  return `₹${major.toLocaleString("en-IN", {
    minimumFractionDigits: safe % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

/**
 * Derives what to show for a payment.
 *
 * `overdue` is computed against `today` rather than stored, so a record can
 * never sit in the database claiming a status that stopped being true.
 */
export function paymentStatus(payment: Payment, today = TODAY): PaymentStatus {
  if (payment.state === "paid") return "paid";
  if (payment.state === "waived") return "waived";

  return payment.dueDate < today ? "overdue" : "due";
}

/** Negative when overdue, positive when still ahead, 0 on the due date. */
export function daysUntil(isoDate: string, today = TODAY) {
  const parse = (value: string) => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };

  return Math.round((parse(isoDate) - parse(today)) / 86_400_000);
}
