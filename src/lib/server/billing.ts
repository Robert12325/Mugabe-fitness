import type { Client, Payment, PaymentState } from "@/lib/types";
import { pipeline, redis } from "./redis";

const CLIENTS = "mf:clients";
const PAYMENTS = "mf:payments";

/** Upper bound on changes in one request; the dashboard batches below it. */
export const MAX_SYNC_OPS = 200;

const ID = /^[A-Za-z0-9-]{8,64}$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
// ₹1 crore in paise: far above any monthly fee, far inside safe integers.
const MAX_MINOR = 1_000_000_000;
const STATES: readonly PaymentState[] = ["pending", "paid", "waived"];

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export type SyncBatch = {
  upsertClients: Client[];
  upsertPayments: Payment[];
  deletePayments: string[];
  deleteClients: string[];
};

function asObject(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

/**
 * Reads fields strictly. Records are stored exactly as the dashboard sent
 * them, so malformed input is rejected rather than quietly coerced: a coerced
 * copy would no longer match what the browser holds, and the two would drift.
 */
function strictReader(body: Record<string, unknown>) {
  let valid = true;

  return {
    text(key: string, max: number) {
      const value = body[key];
      if (typeof value === "string" && value.length <= max) return value;
      valid = false;
      return "";
    },
    integer(key: string, min: number, max: number) {
      const value = body[key];
      if (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= min &&
        value <= max
      ) {
        return value;
      }
      valid = false;
      return 0;
    },
    flag(key: string) {
      const value = body[key];
      if (typeof value === "boolean") return value;
      valid = false;
      return false;
    },
    require(condition: boolean) {
      if (!condition) valid = false;
    },
    get valid() {
      return valid;
    },
  };
}

export function parseClient(input: unknown): Client | null {
  const body = asObject(input);

  if (!body) return null;

  const read = strictReader(body);

  const client: Client = {
    id: read.text("id", 64),
    name: read.text("name", 200),
    email: read.text("email", 254),
    phone: read.text("phone", 40),
    programId: read.text("programId", 64),
    slot: read.text("slot", 64),
    amountMinor: read.integer("amountMinor", 0, MAX_MINOR),
    billingDay: read.integer("billingDay", 1, 28),
    startDate: read.text("startDate", 10),
    active: read.flag("active"),
    leadId: read.text("leadId", 64),
    notes: read.text("notes", 4000),
  };

  read.require(ID.test(client.id));
  read.require(DATE.test(client.startDate));
  read.require(client.leadId === "" || ID.test(client.leadId));

  return read.valid ? client : null;
}

export function parsePayment(input: unknown): Payment | null {
  const body = asObject(input);

  if (!body) return null;

  const read = strictReader(body);

  const payment: Payment = {
    id: read.text("id", 64),
    clientId: read.text("clientId", 64),
    period: read.text("period", 7),
    dueDate: read.text("dueDate", 10),
    amountMinor: read.integer("amountMinor", 0, MAX_MINOR),
    state: read.text("state", 10) as PaymentState,
    paidDate: read.text("paidDate", 10),
    method: read.text("method", 100),
    note: read.text("note", 2000),
  };

  read.require(ID.test(payment.id));
  read.require(ID.test(payment.clientId));
  read.require(PERIOD.test(payment.period));
  read.require(DATE.test(payment.dueDate));
  // An invoice falls due inside its own month.
  read.require(payment.dueDate.startsWith(`${payment.period}-`));
  read.require(STATES.includes(payment.state));
  // "Paid" needs the day it was paid; anything else must not carry one.
  read.require(
    payment.state === "paid"
      ? DATE.test(payment.paidDate)
      : payment.paidDate === "",
  );

  return read.valid ? payment : null;
}

function dedupeById<T extends { id: string }>(records: T[]) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

export function parseSyncBatch(input: unknown): Parsed<SyncBatch> {
  const body = asObject(input);

  if (!body) return { ok: false, error: "Invalid request." };

  const list = (key: string) => {
    const value = body[key];
    if (value === undefined) return [];
    return Array.isArray(value) ? value : null;
  };

  const rawClients = list("upsertClients");
  const rawPayments = list("upsertPayments");
  const rawPaymentDeletes = list("deletePayments");
  const rawClientDeletes = list("deleteClients");

  if (!rawClients || !rawPayments || !rawPaymentDeletes || !rawClientDeletes) {
    return { ok: false, error: "Invalid request." };
  }

  const total =
    rawClients.length +
    rawPayments.length +
    rawPaymentDeletes.length +
    rawClientDeletes.length;

  if (total > MAX_SYNC_OPS) {
    return { ok: false, error: `At most ${MAX_SYNC_OPS} changes per save.` };
  }

  const upsertClients: Client[] = [];

  for (const [index, raw] of rawClients.entries()) {
    const client = parseClient(raw);

    if (!client) {
      const name = asObject(raw)?.name;
      const label =
        typeof name === "string" && name.trim()
          ? `"${name.trim().slice(0, 40)}"`
          : `#${index + 1}`;

      return {
        ok: false,
        error: `Client ${label} has a value the server can't accept.`,
      };
    }

    upsertClients.push(client);
  }

  const upsertPayments: Payment[] = [];

  for (const raw of rawPayments) {
    const payment = parsePayment(raw);

    if (!payment) {
      const period = asObject(raw)?.period;

      return {
        ok: false,
        error: `An invoice${typeof period === "string" ? ` for ${period}` : ""} has a value the server can't accept.`,
      };
    }

    upsertPayments.push(payment);
  }

  const readIds = (raw: unknown[]) =>
    raw.every((id) => typeof id === "string" && ID.test(id))
      ? [...new Set(raw as string[])]
      : null;

  const deletePayments = readIds(rawPaymentDeletes);
  const deleteClients = readIds(rawClientDeletes);

  if (!deletePayments || !deleteClients) {
    return { ok: false, error: "Invalid id in delete list." };
  }

  const deleting = new Set(deleteClients);

  if (upsertClients.some((client) => deleting.has(client.id))) {
    return {
      ok: false,
      error: "A client can't be saved and deleted in the same save.",
    };
  }

  return {
    ok: true,
    value: {
      upsertClients: dedupeById(upsertClients),
      upsertPayments: dedupeById(upsertPayments),
      deletePayments,
      deleteClients,
    },
  };
}

function decode<T>(flat: unknown, parse: (value: unknown) => T | null): T[] {
  // The REST API returns HGETALL as a flat [field, value, field, value] list.
  const values: unknown[] = Array.isArray(flat)
    ? flat.filter((_, index) => index % 2 === 1)
    : flat && typeof flat === "object"
      ? Object.values(flat)
      : [];

  return values
    .map((value) => {
      if (typeof value !== "string") return parse(value);

      try {
        return parse(JSON.parse(value));
      } catch {
        return null;
      }
    })
    .filter((record): record is T => record !== null);
}

async function loadPayments() {
  return decode(await redis<unknown>("HGETALL", PAYMENTS), parsePayment);
}

export async function loadBilling() {
  const [clients, payments] = await pipeline([
    ["HGETALL", CLIENTS],
    ["HGETALL", PAYMENTS],
  ]);

  return {
    // Hash order isn't stable, so give the dashboard a predictable one.
    clients: decode(clients, parseClient).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
    payments: decode(payments, parsePayment),
  };
}

/**
 * Applies one batch. Returns ids of invoices refused because another invoice
 * already covers that client and month: two devices generating the same
 * month must not leave twin invoices behind.
 */
export async function applySync(batch: SyncBatch): Promise<{ skipped: string[] }> {
  const deletingPayments = new Set(batch.deletePayments);
  const deletingClients = new Set(batch.deleteClients);

  const needExisting =
    batch.upsertPayments.length > 0 || deletingClients.size > 0;

  const existing = needExisting ? await loadPayments() : [];

  const skipped: string[] = [];
  const owner = new Map<string, string>();

  for (const payment of existing) {
    if (!deletingPayments.has(payment.id)) {
      owner.set(`${payment.clientId}:${payment.period}`, payment.id);
    }
  }

  const acceptedPayments: Payment[] = [];

  for (const payment of batch.upsertPayments) {
    // Deleting a client wins over an invoice written for them in the same save.
    if (deletingClients.has(payment.clientId)) continue;

    const key = `${payment.clientId}:${payment.period}`;
    const current = owner.get(key);

    if (current && current !== payment.id) {
      skipped.push(payment.id);
      continue;
    }

    owner.set(key, payment.id);
    acceptedPayments.push(payment);
  }

  // A deleted client takes their ledger with them.
  const cascade = existing
    .filter((payment) => deletingClients.has(payment.clientId))
    .map((payment) => payment.id);

  const paymentDeletes = [...new Set([...batch.deletePayments, ...cascade])];

  const commands: (string | number)[][] = [];

  if (batch.upsertClients.length > 0) {
    commands.push([
      "HSET",
      CLIENTS,
      ...batch.upsertClients.flatMap((client) => [
        client.id,
        JSON.stringify(client),
      ]),
    ]);
  }

  if (acceptedPayments.length > 0) {
    commands.push([
      "HSET",
      PAYMENTS,
      ...acceptedPayments.flatMap((payment) => [
        payment.id,
        JSON.stringify(payment),
      ]),
    ]);
  }

  if (paymentDeletes.length > 0) {
    commands.push(["HDEL", PAYMENTS, ...paymentDeletes]);
  }

  if (batch.deleteClients.length > 0) {
    commands.push(["HDEL", CLIENTS, ...batch.deleteClients]);
  }

  if (commands.length > 0) await pipeline(commands);

  return { skipped };
}
