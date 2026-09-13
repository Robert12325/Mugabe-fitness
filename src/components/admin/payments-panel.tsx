"use client";

import { useMemo, useState } from "react";
import {
  THIS_PERIOD,
  TODAY,
  daysUntil,
  dueDateFor,
  formatDate,
  formatMoney,
  formatPeriod,
  parseMoney,
  paymentStatus,
} from "@/lib/billing";
import {
  deleteClient,
  deletePayment,
  generateInvoices,
  newId,
  paymentsToCSV,
  saveClient,
  setPaymentState,
  updatePayment,
} from "@/lib/store";
import type { Client, Payment, PaymentStatus } from "@/lib/types";
import { useDB } from "@/lib/use-store";
import { Btn, Card, EmptyState, Field, SectionTitle, inputClass } from "./ui";

/* Status colours reuse the enquiry palette's reasoning: validated against the
   #0b0b0b admin surface, and every badge carries its word so status is never
   signalled by colour alone. */
const STATUS_BADGE: Record<PaymentStatus, string> = {
  paid: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  due: "border-[#8fb4f2]/35 bg-[#5b86d6]/15 text-[#8fb4f2]",
  overdue: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
  waived: "border-white/15 bg-white/5 text-[#a3a3a3]",
};

const FILTERS = ["all", "overdue", "due", "paid", "waived"] as const;
type Filter = (typeof FILTERS)[number];

function download(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function PaymentsPanel() {
  const db = useDB();
  const [filter, setFilter] = useState<Filter>("all");
  const [openClient, setOpenClient] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const [notice, setNotice] = useState("");

  const clientName = useMemo(() => {
    const map = new Map(db.clients.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "Unknown";
  }, [db.clients]);

  const byClient = useMemo(() => {
    const map = new Map<string, Payment[]>();

    for (const payment of db.payments) {
      const list = map.get(payment.clientId);
      if (list) list.push(payment);
      else map.set(payment.clientId, [payment]);
    }

    for (const list of map.values()) {
      list.sort((a, b) => b.period.localeCompare(a.period));
    }

    return map;
  }, [db.payments]);

  const totals = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let thisMonthDue = 0;

    for (const payment of db.payments) {
      const status = paymentStatus(payment);

      if (status === "paid") {
        collected += payment.amountMinor;
      } else if (status !== "waived") {
        outstanding += payment.amountMinor;

        if (status === "overdue") {
          overdueCount += 1;
          overdueAmount += payment.amountMinor;
        }
      }

      if (payment.period === THIS_PERIOD && status !== "waived") {
        thisMonthDue += payment.amountMinor;
      }
    }

    const collectedThisMonth = db.payments
      .filter((p) => p.period === THIS_PERIOD && p.state === "paid")
      .reduce((sum, p) => sum + p.amountMinor, 0);

    return {
      collected,
      outstanding,
      overdueCount,
      overdueAmount,
      thisMonthDue,
      collectedThisMonth,
      rate: thisMonthDue ? Math.round((collectedThisMonth / thisMonthDue) * 100) : 0,
    };
  }, [db.payments]);

  const visiblePayments = useMemo(() => {
    if (filter === "all") return db.payments;
    return db.payments.filter((p) => paymentStatus(p) === filter);
  }, [db.payments, filter]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected all time" value={formatMoney(totals.collected)} />
        <Stat label="Outstanding" value={formatMoney(totals.outstanding)} />
        <Stat
          label="Overdue"
          value={formatMoney(totals.overdueAmount)}
          sub={`${totals.overdueCount} invoice${totals.overdueCount === 1 ? "" : "s"}`}
          alert={totals.overdueCount > 0}
        />
        <Stat
          label={`${formatPeriod(THIS_PERIOD)} collected`}
          value={`${totals.rate}%`}
          sub={`${formatMoney(totals.collectedThisMonth)} of ${formatMoney(totals.thisMonthDue)}`}
        />
      </div>

      <Card>
        <SectionTitle
          title="Clients"
          hint={`${db.clients.filter((c) => c.active).length} active · ${db.payments.length} invoices`}
          action={
            <div className="flex flex-wrap gap-2">
              <Btn
                size="sm"
                variant="gold"
                onClick={() => {
                  const made = generateInvoices();
                  flash(
                    made
                      ? `${made} invoice${made === 1 ? "" : "s"} created.`
                      : "Already up to date — nothing to create.",
                  );
                }}
              >
                Generate invoices
              </Btn>

              <Btn size="sm" onClick={() => setEditing(blankClient())}>
                + Add client
              </Btn>

              <Btn
                size="sm"
                onClick={() =>
                  download(
                    `mugabe-payments-${TODAY}.csv`,
                    paymentsToCSV(visiblePayments, clientName, (p) => paymentStatus(p)),
                  )
                }
              >
                Export CSV
              </Btn>
            </div>
          }
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                filter === option
                  ? "border-[#d4af37] bg-[#d4af37] text-black"
                  : "border-white/15 text-white/55 hover:text-white"
              }`}
            >
              {option}
              {option !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {db.payments.filter((p) => paymentStatus(p) === option).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {db.clients.length === 0 ? (
          <EmptyState>
            No clients yet. Add one here, or mark an enquiry as enrolled and
            convert it from the Enquiries tab.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {db.clients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                payments={byClient.get(client.id) ?? []}
                filter={filter}
                open={openClient === client.id}
                onToggle={() =>
                  setOpenClient((id) => (id === client.id ? null : client.id))
                }
                onEdit={() => setEditing(client)}
              />
            ))}
          </div>
        )}

        {notice && (
          <p className="mt-4 text-xs font-semibold text-[#d4af37]">{notice}</p>
        )}
      </Card>

      {editing && (
        <ClientEditor
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            flash("Client saved. Run “Generate invoices” to build their ledger.");
          }}
        />
      )}
    </div>
  );
}

function blankClient(): Client {
  return {
    id: newId(),
    name: "",
    email: "",
    phone: "",
    programId: "",
    slot: "",
    amountMinor: 0,
    billingDay: Number(TODAY.slice(8, 10)),
    startDate: TODAY,
    active: true,
    leadId: "",
    notes: "",
  };
}

function Stat({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        alert ? "border-[#f0928c]/30 bg-[#c0453d]/[0.07]" : "border-white/10 bg-[#0b0b0b]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>

      {sub && <p className="mt-2 text-xs text-white/45">{sub}</p>}
    </div>
  );
}

function ClientRow({
  client,
  payments,
  filter,
  open,
  onToggle,
  onEdit,
}: {
  client: Client;
  payments: Payment[];
  filter: Filter;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const shown =
    filter === "all" ? payments : payments.filter((p) => paymentStatus(p) === filter);

  const next = payments.find((p) => p.state === "pending");
  const overdue = payments.filter((p) => paymentStatus(p) === "overdue").length;
  const owed = payments
    .filter((p) => p.state === "pending")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        {overdue > 0 ? (
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${STATUS_BADGE.overdue}`}>
            {overdue} overdue
          </span>
        ) : (
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${client.active ? STATUS_BADGE.paid : STATUS_BADGE.waived}`}>
            {client.active ? "current" : "inactive"}
          </span>
        )}

        <span className="min-w-[8rem] flex-1 text-sm font-bold text-white">
          {client.name || "Unnamed client"}
        </span>

        <span className="hidden text-xs text-white/55 sm:block">
          {formatMoney(client.amountMinor)}/mo
        </span>

        <span className="hidden text-xs text-white/55 md:block">
          {next ? <NextDue dueDate={next.dueDate} /> : "no open invoice"}
        </span>

        <span className="text-xs text-white/45">
          {owed > 0 ? `${formatMoney(owed)} owed` : "settled"}
        </span>

        <span className="text-white/45">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/55">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.slot && <span>{client.slot}</span>}
            <span>Bills on day {client.billingDay}</span>
            <span>Since {formatDate(client.startDate)}</span>

            <span className="ml-auto flex gap-2">
              <Btn size="sm" onClick={onEdit}>
                Edit
              </Btn>

              <Btn
                size="sm"
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete ${client.name || "this client"} and all ${payments.length} of their invoices?`,
                    )
                  ) {
                    deleteClient(client.id);
                  }
                }}
              >
                Delete
              </Btn>
            </span>
          </div>

          {shown.length === 0 ? (
            <EmptyState>
              {payments.length === 0
                ? "No invoices yet — use “Generate invoices”."
                : "No invoices match this filter."}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {shown.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NextDue({ dueDate }: { dueDate: string }) {
  const days = daysUntil(dueDate);

  if (days < 0) return <>{`${Math.abs(days)}d overdue`}</>;
  if (days === 0) return <>due today</>;
  if (days === 1) return <>due tomorrow</>;

  return <>{`due in ${days}d`}</>;
}

function PaymentRow({ payment }: { payment: Payment }) {
  const status = paymentStatus(payment);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${STATUS_BADGE[status]}`}
        >
          {status}
        </span>

        <span className="w-24 text-sm font-bold text-white">
          {formatPeriod(payment.period)}
        </span>

        <span className="text-sm text-[#d4af37]">
          {formatMoney(payment.amountMinor)}
        </span>

        <span className="text-xs text-white/45">
          due {formatDate(payment.dueDate)}
        </span>

        {payment.state === "paid" && payment.paidDate && (
          <span className="text-xs text-[#5cc98a]">
            paid {formatDate(payment.paidDate)}
            {payment.method ? ` · ${payment.method}` : ""}
          </span>
        )}

        <span className="ml-auto flex flex-wrap gap-2">
          {payment.state !== "paid" && (
            <Btn
              size="sm"
              variant="gold"
              onClick={() =>
                setPaymentState(payment.id, "paid", { method: payment.method || "Cash" })
              }
            >
              Mark paid
            </Btn>
          )}

          {payment.state === "paid" && (
            <Btn size="sm" onClick={() => setPaymentState(payment.id, "pending")}>
              Reopen
            </Btn>
          )}

          {payment.state !== "waived" && (
            <Btn size="sm" onClick={() => setPaymentState(payment.id, "waived")}>
              Waive
            </Btn>
          )}

          <Btn size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Close" : "Details"}
          </Btn>
        </span>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
          <Field
            label="Amount"
            value={(payment.amountMinor / 100).toString()}
            onChange={(v) => updatePayment(payment.id, { amountMinor: parseMoney(v) })}
          />

          <Field
            label="Method"
            value={payment.method}
            placeholder="UPI, cash, transfer…"
            onChange={(v) => updatePayment(payment.id, { method: v })}
          />

          <Field
            label="Note"
            value={payment.note}
            onChange={(v) => updatePayment(payment.id, { note: v })}
          />

          <div className="sm:col-span-3">
            <Btn
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm("Delete this invoice?")) deletePayment(payment.id);
              }}
            >
              Delete invoice
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientEditor({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
}) {
  const db = useDB();
  const [draft, setDraft] = useState(client);
  const [amount, setAmount] = useState(
    client.amountMinor ? (client.amountMinor / 100).toString() : "",
  );

  function set<K extends keyof Client>(key: K, value: Client[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const program = db.programs.find((p) => p.id === draft.programId);

  return (
    <Card>
      <SectionTitle
        title={client.name ? `Edit ${client.name}` : "New client"}
        hint="The monthly amount and billing day drive every invoice generated for them."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" value={draft.name} onChange={(v) => set("name", v)} />
        <Field label="Email" value={draft.email} onChange={(v) => set("email", v)} />
        <Field label="Phone" value={draft.phone} onChange={(v) => set("phone", v)} />

        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            Program
          </span>

          <select
            value={draft.programId}
            onChange={(event) => {
              const next = db.programs.find((p) => p.id === event.target.value);
              set("programId", event.target.value);

              // Prefill the fee from the program, but only when the coach
              // has not typed their own figure.
              if (next && !amount) setAmount((parseMoney(next.price) / 100).toString());
              if (next && !draft.slot && next.slots[0]) set("slot", next.slots[0]);
            }}
            className={inputClass}
          >
            <option value="">None</option>

            {db.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            Slot
          </span>

          <select
            value={draft.slot}
            onChange={(event) => set("slot", event.target.value)}
            className={inputClass}
          >
            <option value="">Not set</option>

            {(program?.slots ?? []).map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="Monthly amount (₹)"
          value={amount}
          placeholder="3000"
          onChange={setAmount}
        />

        <Field
          label="Billing day (1–28)"
          value={String(draft.billingDay)}
          onChange={(v) => set("billingDay", Number(v.replace(/\D/g, "")) || 1)}
        />

        <Field
          label="Start date"
          type="date"
          value={draft.startDate}
          onChange={(v) => set("startDate", v || TODAY)}
        />

        <Field label="Notes" value={draft.notes} onChange={(v) => set("notes", v)} />
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => set("active", event.target.checked)}
          className="h-4 w-4 accent-[#d4af37]"
        />
        Active — inactive clients stop generating new invoices
      </label>

      <p className="mt-4 text-xs text-white/45">
        First invoice will fall due{" "}
        <span className="text-white/70">
          {formatDate(
            dueDateFor(draft.startDate.slice(0, 7), draft.billingDay || 1),
          )}
        </span>
        .
      </p>

      <div className="mt-6 flex gap-2">
        <Btn
          variant="gold"
          onClick={() => {
            saveClient({ ...draft, amountMinor: parseMoney(amount) });
            onSaved();
          }}
        >
          Save client
        </Btn>

        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </Card>
  );
}
