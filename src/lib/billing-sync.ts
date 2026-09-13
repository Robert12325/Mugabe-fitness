import { loadDB, replaceBilling, subscribe } from "@/lib/store";
import type { Client, Payment } from "@/lib/types";

/**
 * Keeps this browser's clients and invoices in step with the server.
 *
 * The Payments tab keeps calling the same store functions it always has.
 * This module watches the store, works out which records differ from what
 * the server is known to hold, and sends only those — a moment after the
 * last edit, so typing in a field doesn't fire a request per keystroke.
 */

export type BillingSyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "offline" }
  | { status: "synced" }
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "migrate"; clients: number; payments: number };

const IDLE: BillingSyncState = { status: "idle" };

let state: BillingSyncState = IDLE;
const listeners = new Set<() => void>();

function setState(next: BillingSyncState) {
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeBillingSync(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBillingSyncState() {
  return state;
}

export function getBillingSyncServerState() {
  return IDLE;
}

/* ------------------------------------------------------------------ */
/* Network                                                             */
/* ------------------------------------------------------------------ */

type Batch = {
  upsertClients: Client[];
  upsertPayments: Payment[];
  deletePayments: string[];
  deleteClients: string[];
};

type LoadResult =
  | { kind: "ok"; clients: Client[]; payments: Payment[] }
  | { kind: "offline" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string };

async function fetchBilling(): Promise<LoadResult> {
  try {
    const response = await fetch("/api/billing", { cache: "no-store" });

    if (response.status === 503) return { kind: "offline" };
    if (response.status === 401) return { kind: "unauthorized" };

    if (!response.ok) {
      return {
        kind: "error",
        message: `Could not load clients and payments (${response.status}).`,
      };
    }

    const body = (await response.json()) as {
      clients?: unknown;
      payments?: unknown;
    };

    return {
      kind: "ok",
      clients: Array.isArray(body.clients) ? (body.clients as Client[]) : [],
      payments: Array.isArray(body.payments)
        ? (body.payments as Payment[])
        : [],
    };
  } catch {
    return { kind: "error", message: "Could not reach the server." };
  }
}

type SendResult =
  | { kind: "ok"; skipped: string[] }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string };

async function sendBatch(batch: Batch): Promise<SendResult> {
  try {
    const response = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });

    if (response.status === 401) return { kind: "unauthorized" };

    if (!response.ok) {
      let message = `Changes could not be saved (${response.status}).`;

      try {
        const body: unknown = await response.json();

        if (
          body &&
          typeof body === "object" &&
          typeof (body as { error?: unknown }).error === "string"
        ) {
          message = (body as { error: string }).error;
        }
      } catch {
        // Keep the generic message.
      }

      return { kind: "error", message };
    }

    const body = (await response.json()) as { skipped?: unknown };

    return {
      kind: "ok",
      skipped: Array.isArray(body.skipped)
        ? body.skipped.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return { kind: "error", message: "Could not reach the server." };
  }
}

/* ------------------------------------------------------------------ */
/* Diffing                                                             */
/* ------------------------------------------------------------------ */

/** Key-order-independent text form, so "unchanged" is a string compare. */
export function canonical(record: Client | Payment) {
  return JSON.stringify(
    Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

function snapshot(records: (Client | Payment)[]) {
  return new Map(records.map((record) => [record.id, canonical(record)]));
}

export function diffRecords<T extends Client | Payment>(
  local: T[],
  known: Map<string, string>,
) {
  const upserts = local.filter(
    (record) => known.get(record.id) !== canonical(record),
  );
  const present = new Set(local.map((record) => record.id));
  const deletes = [...known.keys()].filter((id) => !present.has(id));

  return { upserts, deletes };
}

const BATCH_SIZE = 100;

/**
 * Splits pending work into requests while keeping dependency order: clients
 * before the invoices that reference them, invoice deletions before client
 * deletions.
 */
export function planBatches(work: Batch, size = BATCH_SIZE): Batch[] {
  const ops: [keyof Batch, Client | Payment | string][] = [
    ...work.upsertClients.map((v) => ["upsertClients", v] as [keyof Batch, Client]),
    ...work.upsertPayments.map((v) => ["upsertPayments", v] as [keyof Batch, Payment]),
    ...work.deletePayments.map((v) => ["deletePayments", v] as [keyof Batch, string]),
    ...work.deleteClients.map((v) => ["deleteClients", v] as [keyof Batch, string]),
  ];

  const batches: Batch[] = [];

  for (let start = 0; start < ops.length; start += size) {
    const batch: Batch = {
      upsertClients: [],
      upsertPayments: [],
      deletePayments: [],
      deleteClients: [],
    };

    for (const [key, value] of ops.slice(start, start + size)) {
      (batch[key] as unknown[]).push(value);
    }

    batches.push(batch);
  }

  return batches;
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

const DEBOUNCE_MS = 600;

let knownClients = new Map<string, string>();
let knownPayments = new Map<string, string>();
let generation = 0;
let unwatch: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;
let again = false;
let onUnauthorized: () => void = () => {};

function watch() {
  unwatch?.();
  unwatch = subscribe(schedule);
}

function stopWatching() {
  unwatch?.();
  unwatch = null;

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);

  timer = setTimeout(() => {
    timer = null;
    void push();
  }, DEBOUNCE_MS);
}

function pendingWork(): Batch {
  const db = loadDB();
  const clients = diffRecords(db.clients, knownClients);
  const payments = diffRecords(db.payments, knownPayments);

  return {
    upsertClients: clients.upserts,
    upsertPayments: payments.upserts,
    deletePayments: payments.deletes,
    deleteClients: clients.deletes,
  };
}

function isEmpty(work: Batch) {
  return (
    work.upsertClients.length === 0 &&
    work.upsertPayments.length === 0 &&
    work.deletePayments.length === 0 &&
    work.deleteClients.length === 0
  );
}

/** Takes the server copy without echoing that change back up as an edit. */
function adopt(clients: Client[], payments: Payment[]) {
  stopWatching();
  replaceBilling(clients, payments);

  const db = loadDB();
  knownClients = snapshot(db.clients);
  knownPayments = snapshot(db.payments);

  watch();
}

async function push() {
  if (inflight) {
    again = true;
    return;
  }

  const work = pendingWork();

  if (isEmpty(work)) return;

  const gen = generation;
  inflight = true;
  setState({ status: "saving" });

  try {
    let skippedAny = false;

    for (const batch of planBatches(work)) {
      const result = await sendBatch(batch);

      if (gen !== generation) return;

      if (result.kind === "unauthorized") {
        stopBillingSync();
        onUnauthorized();
        return;
      }

      if (result.kind === "error") {
        // Unsent changes stay pending and go out with the next edit or retry.
        setState({ status: "error", message: result.message });
        return;
      }

      const skipped = new Set(result.skipped);
      if (skipped.size > 0) skippedAny = true;

      for (const client of batch.upsertClients) {
        knownClients.set(client.id, canonical(client));
      }
      for (const payment of batch.upsertPayments) {
        if (!skipped.has(payment.id)) {
          knownPayments.set(payment.id, canonical(payment));
        }
      }
      for (const id of batch.deletePayments) knownPayments.delete(id);
      for (const id of batch.deleteClients) knownClients.delete(id);
    }

    if (skippedAny) {
      // Another device had already made some of these invoices. Take the
      // server copy so each client keeps one invoice per month.
      const fresh = await fetchBilling();

      if (gen !== generation) return;
      if (fresh.kind === "ok") adopt(fresh.clients, fresh.payments);
    }

    setState({ status: "synced" });
  } finally {
    inflight = false;

    if (gen === generation && again) {
      again = false;
      schedule();
    }
  }
}

export async function startBillingSync(handleUnauthorized: () => void) {
  onUnauthorized = handleUnauthorized;

  const gen = ++generation;

  stopWatching();
  inflight = false;
  again = false;
  setState({ status: "loading" });

  const result = await fetchBilling();

  if (gen !== generation) return;

  if (result.kind === "offline") {
    setState({ status: "offline" });
    return;
  }

  if (result.kind === "unauthorized") {
    setState(IDLE);
    handleUnauthorized();
    return;
  }

  if (result.kind === "error") {
    setState({ status: "error", message: result.message });
    return;
  }

  const local = loadDB();
  const serverEmpty = result.clients.length === 0 && result.payments.length === 0;
  const localCount = local.clients.length + local.payments.length;

  if (serverEmpty && localCount > 0) {
    // Never silently wipe records that exist only in this browser.
    setState({
      status: "migrate",
      clients: local.clients.length,
      payments: local.payments.length,
    });
    return;
  }

  adopt(result.clients, result.payments);
  setState({ status: "synced" });
}

/**
 * On returning to the tab: send anything still pending, otherwise pull in
 * changes made on other devices.
 */
export function refreshBilling() {
  if (
    state.status === "idle" ||
    state.status === "offline" ||
    state.status === "loading" ||
    state.status === "migrate"
  ) {
    return;
  }

  // Never got a first copy from the server — start over.
  if (unwatch === null) {
    void startBillingSync(onUnauthorized);
    return;
  }

  if (inflight || timer) return;

  if (!isEmpty(pendingWork())) {
    void push();
    return;
  }

  const gen = generation;

  void fetchBilling().then((result) => {
    if (gen !== generation || inflight || timer) return;

    if (result.kind === "ok") {
      // Only adopt if nothing was edited while the request was out.
      if (isEmpty(pendingWork())) adopt(result.clients, result.payments);
      setState({ status: "synced" });
    } else if (result.kind === "unauthorized") {
      stopBillingSync();
      onUnauthorized();
    }
  });
}

/** Sends every client and invoice in this browser up to an empty server. */
export function uploadLocalBilling() {
  if (state.status !== "migrate") return;

  knownClients = new Map();
  knownPayments = new Map();
  watch();
  void push();
}

/** Drops this browser's clients and invoices in favour of the empty server. */
export function discardLocalBilling() {
  if (state.status !== "migrate") return;

  adopt([], []);
  setState({ status: "synced" });
}

export function stopBillingSync() {
  generation++;
  stopWatching();
  inflight = false;
  again = false;
  knownClients = new Map();
  knownPayments = new Map();
  setState(IDLE);
}
