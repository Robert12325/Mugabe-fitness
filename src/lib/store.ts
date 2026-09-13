import type {
  Client,
  DB,
  Lead,
  LeadStatus,
  MethodStep,
  Payment,
  PaymentState,
  Program,
  Settings,
} from "@/lib/types";
import {
  THIS_PERIOD,
  TODAY,
  addMonths,
  clampBillingDay,
  dueDateFor,
  monthsBetween,
  periodOf,
} from "@/lib/billing";

export const STORAGE_KEY = "mugabe-fitness:v1";
const DB_VERSION = 3;

const EVENT = "mugabe-store-change";

/* ------------------------------------------------------------------ */
/* Defaults — the seed data the site falls back to before any edits.   */
/* ------------------------------------------------------------------ */

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "mugabe-live",
    number: "01",
    name: "Mugabe Live",
    subtitle: "Live Home Coaching",
    price: "₹3,000",
    period: "/month",
    description:
      "Live, guided coaching from home with real-time instruction, structured sessions, and consistent accountability.",
    features: [
      "Live 1-hour coaching",
      "Morning sessions",
      "Train from home",
      "Real-time guidance",
      "Structured progression",
    ],
    slots: ["7:30–8:30 AM", "8:30–9:30 AM"],
    featured: false,
    active: true,
  },
  {
    id: "mugabe-elite",
    number: "02",
    name: "Mugabe Elite",
    subtitle: "Premium Equipment Training",
    price: "₹15,000",
    period: "/month",
    description:
      "Premium personalized coaching designed around your goals, performance, training capacity, and long-term progression.",
    features: [
      "Personalized training",
      "Equipment-based workouts",
      "Individual progression",
      "Closer coach support",
      "Performance-focused programming",
    ],
    slots: ["7–8 PM", "8–9 PM", "9–10 PM", "10–11 PM"],
    featured: true,
    active: true,
  },
];

export const DEFAULT_METHOD: MethodStep[] = [
  {
    id: "assess",
    number: "01",
    title: "Assess",
    text: "Understand your starting point, goals, experience, and training needs.",
  },
  {
    id: "train",
    number: "02",
    title: "Train",
    text: "Follow structured coaching designed to challenge you without wasting your time.",
  },
  {
    id: "progress",
    number: "03",
    title: "Progress",
    text: "Track your performance and continuously improve your training.",
  },
  {
    id: "transform",
    number: "04",
    title: "Transform",
    text: "Build lasting strength, confidence, discipline, and physical results.",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  brandName: "MUGABE",
  brandSuffix: "FITNESS",
  tagline: "Rise. Grind. Shine.",
  coachEmail: "robertmkamarajr@gmail.com",
  coachPhone: "+917879715012",
  coachPhoto: "",
  adminPasscode: "mugabe",
};

/** Ships in /public, so every visitor on every device gets it. A photo
 *  uploaded in the admin only overrides it in the browser that uploaded it. */
export const DEFAULT_COACH_PHOTO = "/coach.jpg";

/** An empty setting means "no override", not "no photo" — so a browser that
 *  has saved `coachPhoto: ""` still shows the built-in photo. */
export function coachPhotoSrc(settings: Settings) {
  return settings.coachPhoto.trim() || DEFAULT_COACH_PHOTO;
}

export const DEFAULT_DB: DB = {
  version: DB_VERSION,
  leads: [],
  programs: DEFAULT_PROGRAMS,
  method: DEFAULT_METHOD,
  clients: [],
  payments: [],
  settings: DEFAULT_SETTINGS,
};

/* ------------------------------------------------------------------ */
/* Read / write                                                        */
/* ------------------------------------------------------------------ */

// useSyncExternalStore needs a referentially stable snapshot, so the parsed
// DB is cached and only re-parsed after a write or a cross-tab storage event.
let cache: DB | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

// Mirrors LEAD_STATUSES in types.ts. Kept local so this module stays free of
// runtime imports.
const VALID_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "enrolled",
  "archived",
];

/** Backfills a single lead, so an enquiry captured before a field existed
 *  (`slot`, say) still renders and exports cleanly. */
function normalizeLead(raw: Partial<Lead>): Lead {
  return {
    id: raw.id ?? newId(),
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    programId: raw.programId ?? "",
    slot: raw.slot ?? "",
    goal: raw.goal ?? "",
    message: raw.message ?? "",
    status: VALID_STATUSES.includes(raw.status as LeadStatus)
      ? (raw.status as LeadStatus)
      : "new",
    createdAt: raw.createdAt ?? new Date(0).toISOString(),
    notes: raw.notes ?? "",
  };
}

function normalizeClient(raw: Partial<Client>): Client {
  return {
    id: raw.id ?? newId(),
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    programId: raw.programId ?? "",
    slot: raw.slot ?? "",
    amountMinor: Math.max(0, Math.round(Number(raw.amountMinor) || 0)),
    billingDay: clampBillingDay(Number(raw.billingDay)),
    startDate: raw.startDate ?? TODAY,
    active: raw.active !== false,
    leadId: raw.leadId ?? "",
    notes: raw.notes ?? "",
  };
}

const PAYMENT_STATES: PaymentState[] = ["pending", "paid", "waived"];

function normalizePayment(raw: Partial<Payment>): Payment {
  const state = PAYMENT_STATES.includes(raw.state as PaymentState)
    ? (raw.state as PaymentState)
    : "pending";

  return {
    id: raw.id ?? newId(),
    clientId: raw.clientId ?? "",
    period: raw.period ?? THIS_PERIOD,
    dueDate: raw.dueDate ?? TODAY,
    amountMinor: Math.max(0, Math.round(Number(raw.amountMinor) || 0)),
    state,
    // A record can't be "paid" with no date, or carry a stale one after
    // being reopened.
    paidDate: state === "paid" ? (raw.paidDate ?? TODAY) : "",
    method: raw.method ?? "",
    note: raw.note ?? "",
  };
}

/** Backfills a single program, so a record stored before a field existed
 *  (`slots`, say) still renders instead of throwing on `.map`. */
function normalizeProgram(raw: Partial<Program>, storedVersion: number): Program {
  const seed = DEFAULT_PROGRAMS.find((program) => program.id === raw.id);
  const seeded = seed?.slots ?? [];
  const stored = Array.isArray(raw.slots) ? raw.slots : null;

  // v1 predates `slots`. A payload from then either has no key at all or was
  // backfilled to [] before this migration existed, so seed known programs
  // once. From v2 onward an empty list is a deliberate choice and is kept.
  const slots =
    storedVersion < 2 && (stored === null || stored.length === 0)
      ? seeded
      : (stored ?? seeded);

  return {
    id: raw.id ?? newId(),
    number: raw.number ?? "",
    name: raw.name ?? "Untitled",
    subtitle: raw.subtitle ?? "",
    price: raw.price ?? "",
    period: raw.period ?? "",
    description: raw.description ?? "",
    features: Array.isArray(raw.features) ? raw.features : [],
    slots,
    featured: Boolean(raw.featured),
    active: raw.active !== false,
  };
}

/** Fills in whatever a stored payload is missing, so an older or hand-edited
 *  blob can never crash the UI. */
function normalize(raw: unknown): DB {
  const input = (raw ?? {}) as Partial<DB>;
  const storedVersion =
    typeof input.version === "number" ? input.version : 1;

  return {
    version: DB_VERSION,
    leads: Array.isArray(input.leads) ? input.leads.map(normalizeLead) : [],
    programs:
      Array.isArray(input.programs) && input.programs.length > 0
        ? input.programs.map((program) =>
            normalizeProgram(program, storedVersion),
          )
        : DEFAULT_PROGRAMS,
    method:
      Array.isArray(input.method) && input.method.length > 0
        ? input.method
        : DEFAULT_METHOD,
    clients: Array.isArray(input.clients)
      ? input.clients.map(normalizeClient)
      : [],
    payments: Array.isArray(input.payments)
      ? input.payments.map(normalizePayment)
      : [],
    settings: { ...DEFAULT_SETTINGS, ...(input.settings ?? {}) },
  };
}

export function loadDB(): DB {
  if (!isBrowser()) return DEFAULT_DB;
  if (cache) return cache;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? normalize(JSON.parse(raw)) : DEFAULT_DB;
  } catch {
    // Private mode, blocked storage, or corrupt JSON — fall back to defaults
    // rather than taking the page down.
    cache = DEFAULT_DB;
  }

  return cache;
}

/** Returns false when the write did not reach localStorage (quota, private
 *  mode). The in-memory copy is still updated so the current session works,
 *  but callers that store something big should tell the user. */
export function saveDB(next: DB): boolean {
  cache = next;

  if (!isBrowser()) return false;

  let persisted = true;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    persisted = false;
  }

  window.dispatchEvent(new Event(EVENT));

  return persisted;
}

function update(fn: (db: DB) => DB) {
  return saveDB(fn(loadDB()));
}

/* ------------------------------------------------------------------ */
/* Subscription (drives useSyncExternalStore)                          */
/* ------------------------------------------------------------------ */

export function subscribe(onChange: () => void) {
  if (!isBrowser()) return () => {};

  const local = () => onChange();

  // Another tab wrote to localStorage — drop the cache so the next read
  // re-parses from disk.
  const cross = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    onChange();
  };

  window.addEventListener(EVENT, local);
  window.addEventListener("storage", cross);

  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", cross);
  };
}

export function getSnapshot(): DB {
  return loadDB();
}

export function getServerSnapshot(): DB {
  return DEFAULT_DB;
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function newId() {
  if (isBrowser() && typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addLead(
  input: Omit<Lead, "id" | "status" | "createdAt" | "notes">,
) {
  const lead: Lead = {
    ...input,
    id: newId(),
    status: "new",
    createdAt: new Date().toISOString(),
    notes: "",
  };

  update((db) => ({ ...db, leads: [lead, ...db.leads] }));

  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>) {
  update((db) => ({
    ...db,
    leads: db.leads.map((lead) =>
      lead.id === id ? { ...lead, ...patch } : lead,
    ),
  }));
}

export function deleteLead(id: string) {
  update((db) => ({ ...db, leads: db.leads.filter((l) => l.id !== id) }));
}

export function clearLeads() {
  update((db) => ({ ...db, leads: [] }));
}

export function saveProgram(program: Program) {
  update((db) => {
    const exists = db.programs.some((p) => p.id === program.id);

    return {
      ...db,
      programs: exists
        ? db.programs.map((p) => (p.id === program.id ? program : p))
        : [...db.programs, program],
    };
  });
}

export function deleteProgram(id: string) {
  update((db) => ({ ...db, programs: db.programs.filter((p) => p.id !== id) }));
}

export function saveStep(step: MethodStep) {
  update((db) => {
    const exists = db.method.some((s) => s.id === step.id);

    return {
      ...db,
      method: exists
        ? db.method.map((s) => (s.id === step.id ? step : s))
        : [...db.method, step],
    };
  });
}

export function deleteStep(id: string) {
  update((db) => ({ ...db, method: db.method.filter((s) => s.id !== id) }));
}

export function saveSettings(patch: Partial<Settings>) {
  return update((db) => ({ ...db, settings: { ...db.settings, ...patch } }));
}

export function resetAll() {
  saveDB(DEFAULT_DB);
}

/* ------------------------------------------------------------------ */
/* Import / export                                                     */
/* ------------------------------------------------------------------ */

export function exportJSON() {
  return JSON.stringify(loadDB(), null, 2);
}

export function importJSON(text: string) {
  saveDB(normalize(JSON.parse(text) as unknown));
}

export function leadsToCSV(leads: Lead[]) {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Program",
    "Slot",
    "Goal",
    "Status",
    "Created",
    "Message",
    "Notes",
  ];

  const escape = (value: string) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.email,
      lead.phone,
      lead.programId,
      lead.slot,
      lead.goal,
      lead.status,
      lead.createdAt,
      lead.message,
      lead.notes,
    ]
      .map(escape)
      .join(","),
  );

  return [header.map(escape).join(","), ...rows].join("\n");
}

/* ------------------------------------------------------------------ */
/* Clients & payments                                                  */
/* ------------------------------------------------------------------ */

export function saveClient(client: Client) {
  const clean = normalizeClient(client);

  return update((db) => {
    const exists = db.clients.some((c) => c.id === clean.id);

    return {
      ...db,
      clients: exists
        ? db.clients.map((c) => (c.id === clean.id ? clean : c))
        : [...db.clients, clean],
    };
  });
}

/** Removes the client and their whole ledger — nothing is left orphaned. */
export function deleteClient(id: string) {
  return update((db) => ({
    ...db,
    clients: db.clients.filter((c) => c.id !== id),
    payments: db.payments.filter((p) => p.clientId !== id),
  }));
}

/** Promotes an enquiry into a paying client and marks the lead enrolled. */
export function clientFromLead(lead: Lead, amountMinor: number) {
  const client: Client = normalizeClient({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    programId: lead.programId,
    slot: lead.slot,
    amountMinor,
    billingDay: Number(TODAY.slice(8, 10)),
    startDate: TODAY,
    leadId: lead.id,
  });

  update((db) => ({
    ...db,
    clients: [...db.clients, client],
    leads: db.leads.map((l) =>
      l.id === lead.id ? { ...l, status: "enrolled" as LeadStatus } : l,
    ),
  }));

  return client;
}

export function setPaymentState(
  id: string,
  state: PaymentState,
  extra: { method?: string; paidDate?: string } = {},
) {
  return update((db) => ({
    ...db,
    payments: db.payments.map((payment) =>
      payment.id === id
        ? normalizePayment({
            ...payment,
            state,
            paidDate: state === "paid" ? (extra.paidDate ?? TODAY) : "",
            method: state === "paid" ? (extra.method ?? payment.method) : "",
          })
        : payment,
    ),
  }));
}

export function updatePayment(id: string, patch: Partial<Payment>) {
  return update((db) => ({
    ...db,
    payments: db.payments.map((payment) =>
      payment.id === id ? normalizePayment({ ...payment, ...patch }) : payment,
    ),
  }));
}

export function deletePayment(id: string) {
  return update((db) => ({
    ...db,
    payments: db.payments.filter((p) => p.id !== id),
  }));
}

/** Guards against a mistyped start date generating thousands of rows. */
const MAX_BACKFILL_MONTHS = 36;

/**
 * Creates any missing invoices for active clients up to `upto`.
 *
 * Idempotent: one invoice per (clientId, period), so running it twice — or
 * on every dashboard visit — never duplicates a row. Existing invoices are
 * left completely alone, including ones whose amount was edited by hand.
 */
export function generateInvoices(upto = THIS_PERIOD) {
  const db = loadDB();

  const taken = new Set(db.payments.map((p) => `${p.clientId}:${p.period}`));
  const created: Payment[] = [];

  for (const client of db.clients) {
    if (!client.active) continue;

    const first = periodOf(client.startDate);
    const span = monthsBetween(first, upto);

    if (span < 0) continue;

    const start = Math.max(0, span - MAX_BACKFILL_MONTHS);

    for (let i = start; i <= span; i++) {
      const period = addMonths(first, i);
      const key = `${client.id}:${period}`;

      if (taken.has(key)) continue;

      taken.add(key);

      created.push(
        normalizePayment({
          clientId: client.id,
          period,
          dueDate: dueDateFor(period, client.billingDay),
          amountMinor: client.amountMinor,
          state: "pending",
        }),
      );
    }
  }

  if (created.length > 0) {
    saveDB({ ...db, payments: [...db.payments, ...created] });
  }

  return created.length;
}

export function paymentsToCSV(
  payments: Payment[],
  nameOf: (clientId: string) => string,
  statusOf: (payment: Payment) => string,
) {
  const header = [
    "Client",
    "Period",
    "Due date",
    "Amount",
    "Status",
    "Paid date",
    "Method",
    "Note",
  ];

  const escape = (value: string) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const rows = payments.map((payment) =>
    [
      nameOf(payment.clientId),
      payment.period,
      payment.dueDate,
      (payment.amountMinor / 100).toFixed(2),
      statusOf(payment),
      payment.paidDate,
      payment.method,
      payment.note,
    ]
      .map(escape)
      .join(","),
  );

  return [header.map(escape).join(","), ...rows].join("\n");
}
