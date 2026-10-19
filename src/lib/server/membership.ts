import { parseMoney } from "@/lib/billing";
import {
  NO_MEMBERSHIP,
  computeMembership,
  type Membership,
  type MembershipInput,
  type MembershipPaymentStatus,
} from "@/lib/membership";
import { NO_PAYMENT } from "@/lib/payment";
import { DEFAULT_PROGRAMS } from "@/lib/store";
import type { EnquiryPayment, Lead, Program } from "@/lib/types";
import { getAccountUsers } from "./account";
import { listEnquiries, listUserEnquiries, type PaymentProof } from "./enquiry";
import { pipeline, redis } from "./redis";
import { getSiteContent } from "./site-content";

/**
 * One record per account: when the trial started, which program it is for,
 * and the payments made from the dashboard to renew it.
 *
 * Payments made with a booking stay on the enquiry, where the coach already
 * reviews them; they are read in alongside the renewals. So whichever way a
 * client paid, and however the coach confirmed it, it counts exactly once.
 */

function key(userId: string) {
  return `mf:user:${userId}:membership`;
}

/** Every account that has a membership record, for the coach's list. */
const MEMBERS = "mf:members";

/** "<user id>:<payment id>" -> screenshot data URL. Apart from the record,
 *  so loading a membership never drags its images along. */
const SCREENSHOTS = "mf:membership-screenshots";

type RenewalRecord = {
  id: string;
  amountMinor: number;
  status: MembershipPaymentStatus;
  method: string;
  reference: string;
  submittedAt: string;
  reviewedAt: string;
};

type MembershipRecord = {
  programId: string;
  trialStartedAt: string;
  /** The booking that started the trial. */
  enquiryId: string;
  renewals: RenewalRecord[];
};

const REVIEW_STATES: MembershipPaymentStatus[] = [
  "submitted",
  "verified",
  "rejected",
];

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

function asObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function readRenewal(raw: unknown): RenewalRecord | null {
  const body = asObject(raw);
  const text = (field: string) =>
    typeof body[field] === "string" ? (body[field] as string) : "";

  if (!text("id") || !REVIEW_STATES.includes(body.status as MembershipPaymentStatus)) {
    return null;
  }

  return {
    id: text("id"),
    amountMinor:
      typeof body.amountMinor === "number" && Number.isFinite(body.amountMinor)
        ? Math.max(0, Math.round(body.amountMinor))
        : 0,
    status: body.status as MembershipPaymentStatus,
    method: text("method"),
    reference: text("reference"),
    submittedAt: text("submittedAt"),
    reviewedAt: text("reviewedAt"),
  };
}

function readRecord(raw: unknown): MembershipRecord | null {
  if (typeof raw !== "string") return null;

  let body: Record<string, unknown>;

  try {
    body = asObject(JSON.parse(raw));
  } catch {
    // Unreadable rather than absent: refuse, rather than let the next
    // write replace a record that might still be recoverable by hand.
    throw new Error("Stored membership is not valid JSON.");
  }

  if (typeof body.trialStartedAt !== "string" || !body.trialStartedAt) {
    return null;
  }

  return {
    programId: typeof body.programId === "string" ? body.programId : "",
    trialStartedAt: body.trialStartedAt,
    enquiryId: typeof body.enquiryId === "string" ? body.enquiryId : "",
    renewals: (Array.isArray(body.renewals) ? body.renewals : [])
      .map(readRenewal)
      .filter((renewal): renewal is RenewalRecord => renewal !== null),
  };
}

async function getRecord(userId: string) {
  return readRecord(await redis<unknown>("GET", key(userId)));
}

async function saveRecord(userId: string, record: MembershipRecord) {
  await pipeline([
    ["SET", key(userId), JSON.stringify(record)],
    ["SADD", MEMBERS, userId],
  ]);
}

/**
 * Accounts that booked before memberships existed have no record. Their
 * trial is read from their first program booking — the moment it would
 * have started — so nobody gets a fresh trial just for logging in again.
 */
function fromBookings(enquiries: Lead[]): MembershipRecord | null {
  const booked = enquiries
    .filter((lead) => lead.programId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const first = booked[0];

  if (!first) return null;

  return {
    programId: booked[booked.length - 1].programId,
    trialStartedAt: first.createdAt,
    enquiryId: first.id,
    renewals: [],
  };
}

/* ------------------------------------------------------------------ */
/* Programs — the ones on the site, never a copy                       */
/* ------------------------------------------------------------------ */

export async function programsOnServer(): Promise<Program[]> {
  const content = await getSiteContent();

  return content?.programs ?? DEFAULT_PROGRAMS;
}

function feeOf(program: Program | undefined) {
  return program ? parseMoney(program.price) : 0;
}

/* ------------------------------------------------------------------ */
/* Working it out                                                      */
/* ------------------------------------------------------------------ */

function build(
  record: MembershipRecord | null,
  enquiries: Lead[],
  programs: Program[],
  now = Date.now(),
): Membership {
  const base = record ?? fromBookings(enquiries);

  if (!base) return NO_MEMBERSHIP;

  const byId = new Map(programs.map((program) => [program.id, program]));
  const program = byId.get(base.programId);

  const payments: MembershipInput["payments"] = [
    ...enquiries
      .filter((lead) => lead.payment.status !== "none")
      .map((lead) => ({
        id: `booking:${lead.id}`,
        source: "booking" as const,
        enquiryId: lead.id,
        amountMinor: feeOf(byId.get(lead.programId)),
        status: lead.payment.status as MembershipPaymentStatus,
        method: "UPI",
        reference: lead.payment.txnId,
        submittedAt: lead.payment.submittedAt,
        reviewedAt: lead.payment.reviewedAt,
      })),
    ...base.renewals.map((renewal) => ({
      ...renewal,
      source: "renewal" as const,
      enquiryId: "",
    })),
  ];

  return computeMembership(
    {
      programId: base.programId,
      programName: program?.name ?? "",
      priceLabel: program ? `${program.price}${program.period}` : "",
      feeMinor: feeOf(program),
      trialStartedAt: base.trialStartedAt,
      payments,
    },
    now,
  );
}

export async function getMembership(userId: string): Promise<Membership> {
  const [record, enquiries, programs] = await Promise.all([
    getRecord(userId),
    listUserEnquiries(userId),
    programsOnServer(),
  ]);

  return build(record, enquiries, programs);
}

/* ------------------------------------------------------------------ */
/* Starting a trial                                                    */
/* ------------------------------------------------------------------ */

/**
 * Called once a signed-in visitor's booking is saved. The first program
 * booking starts the trial; one trial per account.
 *
 * A later booking for a different program moves the membership onto it —
 * unless a paid month is running, which stays on what was paid for.
 *
 * Returns when the trial ends if this booking started it, else "".
 */
export async function startMembership(
  userId: string,
  enquiryId: string,
): Promise<string> {
  const [record, enquiries, programs] = await Promise.all([
    getRecord(userId),
    listUserEnquiries(userId),
    programsOnServer(),
  ]);

  const booking = enquiries.find((lead) => lead.id === enquiryId);

  if (!booking?.programId) return "";

  if (!record) {
    // Includes this booking, so an account that booked before memberships
    // existed keeps the trial it already had instead of a new one.
    const created = fromBookings(enquiries);

    if (!created) return "";

    created.programId = booking.programId;

    // NX: two bookings racing can't both write a first record.
    const [written] = await pipeline([
      ["SET", key(userId), JSON.stringify(created), "NX"],
      ["SADD", MEMBERS, userId],
    ]);

    if (written !== "OK" || created.enquiryId !== enquiryId) return "";

    return build(created, enquiries, programs).trialEndsAt;
  }

  if (record.programId !== booking.programId) {
    const current = build(record, enquiries, programs);

    if (current.status !== "paid") {
      await saveRecord(userId, { ...record, programId: booking.programId });
    }
  }

  return "";
}

/* ------------------------------------------------------------------ */
/* Renewing from the dashboard                                         */
/* ------------------------------------------------------------------ */

/** The renewal the payment screen is following, as the booking payment
 *  screen expects it. */
export async function latestRenewal(userId: string): Promise<EnquiryPayment> {
  const record = await getRecord(userId);
  const renewal = record?.renewals[record.renewals.length - 1];

  if (!renewal) return NO_PAYMENT;

  return {
    status: renewal.status,
    txnId: renewal.reference,
    submittedAt: renewal.submittedAt,
    reviewedAt: renewal.reviewedAt,
  };
}

export type RenewalResult =
  | { ok: true; payment: EnquiryPayment }
  | { ok: false; reason: "missing" | "locked" };

/**
 * Records a payment against the membership.
 *
 * This is also where a payment provider plugs in: its server-side callback,
 * once it has checked the provider's signature, calls this with its own
 * `method` and payment id and `status: "verified"`. Nothing in the browser
 * can reach that path — the public route below only ever records
 * "submitted", which grants nothing until it is verified.
 */
export async function addRenewal(
  userId: string,
  payment: Omit<RenewalRecord, "id" | "submittedAt" | "reviewedAt">,
  screenshot = "",
): Promise<RenewalResult> {
  const [stored, enquiries, programs] = await Promise.all([
    getRecord(userId),
    listUserEnquiries(userId),
    programsOnServer(),
  ]);

  const membership = build(stored, enquiries, programs);

  if (membership.status === "none") return { ok: false, reason: "missing" };

  // One payment in front of the coach at a time, so nobody pays twice
  // while waiting on the first.
  if (membership.pending) return { ok: false, reason: "locked" };

  const record = stored ?? fromBookings(enquiries);

  if (!record) return { ok: false, reason: "missing" };

  const now = new Date().toISOString();
  const renewal: RenewalRecord = {
    ...payment,
    id: crypto.randomUUID(),
    submittedAt: now,
    reviewedAt: payment.status === "submitted" ? "" : now,
  };

  const next = { ...record, renewals: [...record.renewals, renewal] };

  const commands: (string | number)[][] = [
    ["SET", key(userId), JSON.stringify(next)],
    ["SADD", MEMBERS, userId],
  ];

  if (screenshot) {
    commands.push(["HSET", SCREENSHOTS, `${userId}:${renewal.id}`, screenshot]);
  }

  await pipeline(commands);

  return {
    ok: true,
    payment: {
      status: renewal.status,
      txnId: renewal.reference,
      submittedAt: renewal.submittedAt,
      reviewedAt: renewal.reviewedAt,
    },
  };
}

/** A client sending UPI proof from their dashboard. Never verified here. */
export async function submitRenewal(
  userId: string,
  proof: PaymentProof,
): Promise<RenewalResult> {
  const membership = await getMembership(userId);

  return addRenewal(
    userId,
    {
      amountMinor: membership.feeMinor,
      status: "submitted",
      method: "UPI",
      reference: proof.txnId,
    },
    proof.screenshot,
  );
}

/* ------------------------------------------------------------------ */
/* The coach                                                           */
/* ------------------------------------------------------------------ */

export type ReviewResult =
  | { ok: true; membership: Membership }
  | { ok: false; reason: "missing" };

/** Read-modify-write, like enquiries: fine for one coach. */
export async function reviewRenewal(
  userId: string,
  paymentId: string,
  status: MembershipPaymentStatus,
): Promise<ReviewResult> {
  const record = await getRecord(userId);
  const renewal = record?.renewals.find((item) => item.id === paymentId);

  if (!record || !renewal) return { ok: false, reason: "missing" };

  const next: MembershipRecord = {
    ...record,
    renewals: record.renewals.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            status,
            reviewedAt: status === "submitted" ? "" : new Date().toISOString(),
          }
        : item,
    ),
  };

  await saveRecord(userId, next);

  return { ok: true, membership: await getMembership(userId) };
}

export async function getRenewalScreenshot(userId: string, paymentId: string) {
  const value = await redis<unknown>("HGET", SCREENSHOTS, `${userId}:${paymentId}`);

  return typeof value === "string" ? value : null;
}

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  membership: Membership;
};

/** Every account with a membership — including ones that booked before
 *  memberships existed and so have no record yet. */
export async function listMembers(): Promise<MemberRow[]> {
  const [stored, enquiries, programs] = await Promise.all([
    redis<unknown>("SMEMBERS", MEMBERS),
    listEnquiries(),
    programsOnServer(),
  ]);

  const byUser = new Map<string, Lead[]>();

  for (const lead of enquiries) {
    if (!lead.userId) continue;

    const list = byUser.get(lead.userId);
    if (list) list.push(lead);
    else byUser.set(lead.userId, [lead]);
  }

  const ids = [
    ...new Set([
      ...(Array.isArray(stored) ? stored.map(String) : []),
      ...[...byUser.entries()]
        .filter(([, leads]) => leads.some((lead) => lead.programId))
        .map(([id]) => id),
    ]),
  ];

  if (ids.length === 0) return [];

  const [rawRecords, users] = await Promise.all([
    pipeline(ids.map((id) => ["GET", key(id)])),
    getAccountUsers(ids),
  ]);

  const now = Date.now();
  const rows: MemberRow[] = [];

  ids.forEach((id, index) => {
    let record: MembershipRecord | null = null;

    try {
      record = readRecord(rawRecords[index]);
    } catch {
      // One unreadable record should cost its row, not the whole list.
      console.error("[members] unreadable membership", id);
    }

    const membership = build(record, byUser.get(id) ?? [], programs, now);

    if (membership.status === "none") return;

    const user = users.get(id);

    rows.push({
      userId: id,
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      membership,
    });
  });

  return rows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
