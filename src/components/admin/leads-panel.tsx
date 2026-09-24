"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseMoney } from "@/lib/billing";
import {
  patchEnquiry,
  removeAllEnquiries,
  removeEnquiry,
  type ServerState,
} from "@/lib/enquiries-client";
import type { PaymentReview } from "@/lib/payment";
import {
  chartPoints,
  formatDeltaKg,
  formatKg,
  progressStats,
  type Progress,
} from "@/lib/progress";
import { loadClientProgress } from "@/lib/progress-client";
import { loadPaymentScreenshot } from "@/lib/payment-client";
import {
  clearLeads,
  clientFromLead,
  deleteLead,
  leadsToCSV,
  updateLead,
} from "@/lib/store";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types";
import { useDB } from "@/lib/use-store";
import EmailText from "./email-text";
import { PAYMENT_PALETTE, STATUS_PALETTE } from "./status-palette";
import { Btn, Card, EmptyState, SectionTitle, inputClass } from "./ui";

/** Notes save locally on every keystroke and reach the server once typing
 *  pauses this long. */
const NOTES_DEBOUNCE_MS = 700;

type Filter = LeadStatus | "all" | "to verify";

const FILTERS: Filter[] = ["all", ...LEAD_STATUSES, "to verify"];

function matchesFilter(lead: Lead, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "to verify") return lead.payment.status === "submitted";

  return lead.status === filter;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function LeadsPanel({
  server,
  refreshing,
  onRefresh,
}: {
  server: ServerState;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const db = useDB();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState("");

  const online = server === "online";

  const pendingNotes = useRef(
    new Map<string, { timer: ReturnType<typeof setTimeout>; notes: string }>(),
  );

  useEffect(() => {
    const pending = pendingNotes.current;

    return () => {
      // Leaving the tab mid-sentence shouldn't lose the last edit.
      for (const [id, entry] of pending) {
        clearTimeout(entry.timer);
        void patchEnquiry(id, { notes: entry.notes });
      }

      pending.clear();
    };
  }, []);

  const programName = useMemo(() => {
    const map = new Map(db.programs.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? (id ? id : "Undecided");
  }, [db.programs]);

  // Which enquiries already have a client record, so the action is offered
  // exactly once.
  const convertedLeadIds = useMemo(
    () => new Set(db.clients.map((client) => client.leadId).filter(Boolean)),
    [db.clients],
  );

  // A transaction ID sent with more than one enquiry is worth a second look
  // before verifying.
  const txnUses = useMemo(() => {
    const counts = new Map<string, number>();

    for (const lead of db.leads) {
      const txn = lead.payment.txnId.toUpperCase();
      if (txn) counts.set(txn, (counts.get(txn) ?? 0) + 1);
    }

    return counts;
  }, [db.leads]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return db.leads
      .filter((lead) => matchesFilter(lead, status))
      .filter((lead) => {
        if (!needle) return true;

        return [
          lead.name,
          lead.email,
          lead.phone,
          lead.goal,
          lead.message,
          lead.payment.txnId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.leads, query, status]);

  /** A change applied here but refused by the server: say so, and pull the
   *  server's copy back so the screen stops showing something untrue. */
  function reportSaved(saved: boolean) {
    if (saved) return;

    setSyncError("A change didn't reach the server, so the latest copy was reloaded.");
    onRefresh();
  }

  function changeStatus(lead: Lead, next: LeadStatus) {
    updateLead(lead.id, { status: next });

    if (online) void patchEnquiry(lead.id, { status: next }).then(reportSaved);
  }

  function changeNotes(lead: Lead, notes: string) {
    updateLead(lead.id, { notes });

    if (!online) return;

    const pending = pendingNotes.current;
    const existing = pending.get(lead.id);

    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      pending.delete(lead.id);
      void patchEnquiry(lead.id, { notes }).then(reportSaved);
    }, NOTES_DEBOUNCE_MS);

    pending.set(lead.id, { timer, notes });
  }

  /** Only meaningful against the server — that is where the visitor checks
   *  their status — so the buttons are disabled while offline. */
  function reviewPayment(lead: Lead, next: PaymentReview) {
    if (!online) return;

    updateLead(lead.id, {
      payment: {
        ...lead.payment,
        status: next,
        reviewedAt: next === "submitted" ? "" : new Date().toISOString(),
      },
    });

    void patchEnquiry(lead.id, { paymentStatus: next }).then(reportSaved);
  }

  function removeLead(lead: Lead) {
    deleteLead(lead.id);

    if (online) void removeEnquiry(lead.id).then(reportSaved);
  }

  function convertLead(lead: Lead) {
    const program = db.programs.find((p) => p.id === lead.programId);

    clientFromLead(lead, parseMoney(program?.price ?? "0"));

    if (online) {
      void patchEnquiry(lead.id, { status: "enrolled" }).then(reportSaved);
    }
  }

  async function handleClearAll() {
    if (db.leads.length === 0) return;

    const ok = window.confirm(
      `Delete all ${db.leads.length} enquiries? This cannot be undone.`,
    );

    if (!ok) return;

    // Server first: if it refuses, nothing disappears from the screen.
    if (online && !(await removeAllEnquiries())) {
      setSyncError("Couldn't delete enquiries on the server. Nothing was removed.");
      return;
    }

    clearLeads();
  }

  return (
    <Card decorated>
      <SectionTitle
        icon="users"
        title="All enquiries"
        hint={`${db.leads.length} total · ${visible.length} shown`}
        action={
          <div className="flex flex-wrap gap-2">
            {online && (
              <Btn size="sm" onClick={onRefresh}>
                {refreshing ? "Refreshing…" : "Refresh"}
              </Btn>
            )}

            <Btn
              size="sm"
              onClick={() =>
                download(
                  `mugabe-leads-${new Date().toISOString().slice(0, 10)}.csv`,
                  leadsToCSV(visible),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Export CSV
            </Btn>

            <Btn size="sm" variant="danger" onClick={() => void handleClearAll()}>
              Clear all
            </Btn>
          </div>
        }
      />

      <ConnectionNotice server={server} onRetry={onRefresh} />

      {syncError && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs leading-6 text-red-300"
        >
          <span>{syncError}</span>

          <button
            type="button"
            onClick={() => setSyncError("")}
            className="shrink-0 font-black uppercase tracking-[0.1em] text-red-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, phone, txn ID…"
          className={`${inputClass} sm:max-w-xs`}
        />

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                status === option
                  ? "border-[#d4af37] bg-[#d4af37] text-black"
                  : "border-white/15 text-white/45 hover:text-white"
              }`}
            >
              {option}
              {option !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {db.leads.filter((l) => matchesFilter(l, option)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          {server === "loading"
            ? "Loading enquiries…"
            : db.leads.length === 0
              ? online
                ? "No enquiries yet. They appear here as soon as anyone submits the form, from any device."
                : "No enquiries in this browser."
              : "No enquiries match this filter."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              programName={programName(lead.programId)}
              open={openId === lead.id}
              onToggle={() =>
                setOpenId((current) => (current === lead.id ? null : lead.id))
              }
              isClient={convertedLeadIds.has(lead.id)}
              online={online}
              duplicateTxn={
                (txnUses.get(lead.payment.txnId.toUpperCase()) ?? 0) > 1
              }
              onReviewPayment={(next) => reviewPayment(lead, next)}
              onConvert={() => convertLead(lead)}
              onStatus={(next) => changeStatus(lead, next)}
              onNotes={(notes) => changeNotes(lead, notes)}
              onDelete={() => removeLead(lead)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ConnectionNotice({
  server,
  onRetry,
}: {
  server: ServerState;
  onRetry: () => void;
}) {
  if (server === "online") {
    return (
      <p className="mb-6 flex items-center gap-2 text-xs text-white/45">
        <span aria-hidden className="h-2 w-2 rounded-full bg-[#5cc98a]" />
        Live — showing enquiries from every device.
      </p>
    );
  }

  if (server === "offline") {
    return (
      <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/85">
        <p className="font-bold text-amber-100">
          Not connected to the enquiry database.
        </p>
        <p className="mt-1">
          Visitors&apos; requests can&apos;t reach you yet — only enquiries
          made in this browser show here. In Vercel, connect Upstash Redis to
          this project and set <code>ADMIN_PASSWORD</code>, then redeploy.
        </p>
      </div>
    );
  }

  if (server === "error") {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs leading-6 text-red-300">
        <span>Couldn&apos;t load enquiries from the server.</span>

        <Btn size="sm" onClick={onRetry}>
          Retry
        </Btn>
      </div>
    );
  }

  return null;
}

function LeadRow({
  lead,
  programName,
  open,
  onToggle,
  isClient,
  online,
  duplicateTxn,
  onReviewPayment,
  onConvert,
  onStatus,
  onNotes,
  onDelete,
}: {
  lead: Lead;
  programName: string;
  open: boolean;
  onToggle: () => void;
  isClient: boolean;
  online: boolean;
  duplicateTxn: boolean;
  onReviewPayment: (next: PaymentReview) => void;
  onConvert: () => void;
  onStatus: (status: LeadStatus) => void;
  onNotes: (notes: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <span
          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${STATUS_PALETTE[lead.status].badge}`}
        >
          {lead.status}
        </span>

        {lead.payment.status !== "none" && (
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${PAYMENT_PALETTE[lead.payment.status].badge}`}
          >
            {PAYMENT_PALETTE[lead.payment.status].label}
          </span>
        )}

        {lead.userId && (
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
            Account
          </span>
        )}

        <span className="min-w-[8rem] flex-1 text-sm font-bold text-white">
          {lead.name}
        </span>

        <span className="hidden text-xs text-white/45 sm:block">
          {lead.email}
        </span>

        <span className="hidden text-xs text-white/45 md:block">
          {programName}
        </span>

        {lead.slot && (
          <span className="hidden text-xs text-white/35 lg:block">
            {lead.slot}
          </span>
        )}

        <span className="text-xs text-white/25">
          {formatDate(lead.createdAt)}
        </span>

        <span className="text-white/30">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
            <Detail label="Email" value={lead.email}>
              <EmailText email={lead.email} />
            </Detail>
            <Detail label="Phone" value={lead.phone} />
            <Detail label="Program" value={programName} />
            <Detail label="Preferred time" value={lead.slot} />
            <Detail label="Goal" value={lead.goal} />
          </dl>

          <PaymentBox
            lead={lead}
            online={online}
            duplicateTxn={duplicateTxn}
            onReview={onReviewPayment}
          />

          <ProgressBox lead={lead} online={online} />

          {lead.message && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Message
              </p>

              <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-7 text-white/60">
                {lead.message}
              </p>
            </div>
          )}

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Coach notes
            </p>

            <textarea
              rows={2}
              maxLength={4000}
              value={lead.notes}
              placeholder="Called on Tuesday, following up next week…"
              onChange={(event) => onNotes(event.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Status
            </span>

            {LEAD_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onStatus(option)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  lead.status === option
                    ? STATUS_PALETTE[option].badge
                    : "border-white/12 text-white/35 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}

            <span className="ml-auto flex gap-2">
              {isClient ? (
                <span className="inline-flex items-center rounded-full border border-[#5cc98a]/35 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5cc98a]">
                  Client
                </span>
              ) : (
                <Btn size="sm" variant="gold" onClick={onConvert}>
                  Make client
                </Btn>
              )}

              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/80 transition hover:border-white/40"
              >
                Email
              </a>

              <Btn
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete the enquiry from ${lead.name}?`)) {
                    onDelete();
                  }
                }}
              >
                Delete
              </Btn>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type Screenshot =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "failed" }
  | { state: "shown"; src: string };

/** Opens the screenshot in its own tab. Browsers refuse to navigate to a
 *  data URL, so it goes through a blob URL instead. */
async function openFullSize(src: string) {
  const blob = await (await fetch(src)).blob();
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

type ProgressLoad =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "failed" }
  | { state: "shown"; progress: Progress };

/**
 * The client's weight log, as the coach sees it: read-only, and fetched
 * only when asked for — a list of thirty enquiries should not pull thirty
 * logs nobody opened.
 */
function ProgressBox({ lead, online }: { lead: Lead; online: boolean }) {
  const [load, setLoad] = useState<ProgressLoad>({ state: "idle" });

  // A guest enquiry has no account, so there is no log to read.
  if (!lead.userId) {
    return (
      <p className="mt-5 text-xs text-white/35">
        Sent without an account, so there is no progress log.
      </p>
    );
  }

  function show() {
    setLoad({ state: "loading" });

    void loadClientProgress(lead.userId).then((progress) =>
      setLoad(progress ? { state: "shown", progress } : { state: "failed" }),
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        Progress
      </p>

      {load.state === "shown" ? (
        <>
          <ProgressSummary progress={load.progress} />

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn size="sm" onClick={show}>
              Refresh
            </Btn>

            <Btn size="sm" onClick={() => setLoad({ state: "idle" })}>
              Hide
            </Btn>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Btn
            size="sm"
            disabled={!online || load.state === "loading"}
            onClick={show}
          >
            {load.state === "loading" ? "Loading\u2026" : "View progress"}
          </Btn>

          {load.state === "failed" && (
            <span className="text-xs text-red-300">
              That client&apos;s progress couldn&apos;t be loaded.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressSummary({ progress }: { progress: Progress }) {
  const stats = progressStats(progress);

  if (stats.entryCount === 0) {
    return (
      <p className="mt-3 text-xs text-white/35">
        No weigh-ins logged yet.
      </p>
    );
  }

  const cells = [
    { label: "Start", value: formatKg(stats.startGrams) },
    { label: "Now", value: formatKg(stats.currentGrams) },
    {
      label: "Target",
      value: stats.targetGrams ? formatKg(stats.targetGrams) : "\u2014",
    },
    { label: "Change", value: formatDeltaKg(stats.changeGrams) },
  ];

  return (
    <>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label}>
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {cell.label}
            </dt>

            <dd className="mt-1 font-black text-white">
              {cell.value}
              {cell.value !== "\u2014" && (
                <span className="ml-1 text-[10px] font-bold text-white/40">
                  kg
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {stats.targetGrams > 0 && (
        <p className="mt-3 text-xs text-white/50">
          {stats.reached
            ? "Target reached."
            : `${stats.percent}% of the way there, ${formatKg(stats.remainingGrams)} kg to go.`}
        </p>
      )}

      {progress.entries.length >= 2 && <MiniChart progress={progress} />}

      <ul className="mt-4 space-y-1.5">
        {progress.entries.slice(0, 8).map((entry, index) => {
          const previous = progress.entries[index + 1];
          const delta = previous ? entry.grams - previous.grams : 0;

          return (
            <li
              key={entry.on}
              className="flex flex-wrap items-baseline gap-x-3 text-xs"
            >
              <span className="w-24 shrink-0 text-white/35">
                {formatDate(entry.on)}
              </span>

              <span className="font-bold text-white/80">
                {formatKg(entry.grams)} kg
              </span>

              {delta !== 0 && (
                <span className="text-[#e8c05a]">{formatDeltaKg(delta)}</span>
              )}

              {entry.note && (
                <span className="min-w-0 flex-1 break-words text-white/40">
                  {entry.note}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {progress.entries.length > 8 && (
        <p className="mt-2 text-[11px] text-white/30">
          Showing the last 8 of {progress.entries.length}.
        </p>
      )}
    </>
  );
}

/** Same shape as the client sees, at a glance size. */
function MiniChart({ progress }: { progress: Progress }) {
  const points = chartPoints(progress.entries);
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Weight from ${formatKg(points[0].grams)} to ${formatKg(points[points.length - 1].grams)} kg`}
      className="mt-4 h-20 w-full"
    >
      <polygon points={`0,100 ${line} 100,100`} fill="rgba(212,175,55,0.16)" />

      <polyline
        points={line}
        fill="none"
        stroke="#e8c05a"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function PaymentBox({
  lead,
  online,
  duplicateTxn,
  onReview,
}: {
  lead: Lead;
  online: boolean;
  duplicateTxn: boolean;
  onReview: (next: PaymentReview) => void;
}) {
  const [shot, setShot] = useState<Screenshot>({ state: "idle" });
  const { payment } = lead;

  if (payment.status === "none") {
    return (
      <p className="mt-5 text-xs text-white/35">No payment submitted yet.</p>
    );
  }

  function showScreenshot() {
    setShot({ state: "loading" });

    void loadPaymentScreenshot(lead.id).then((src) =>
      setShot(src ? { state: "shown", src } : { state: "failed" }),
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Payment
        </p>

        <span
          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${PAYMENT_PALETTE[payment.status].badge}`}
        >
          {PAYMENT_PALETTE[payment.status].label}
        </span>
      </div>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <Detail label="Transaction ID" value={payment.txnId}>
          <span className="font-mono">{payment.txnId}</span>

          {duplicateTxn && (
            <span className="mt-1 block text-xs text-[#f0928c]">
              Also sent with another enquiry
            </span>
          )}
        </Detail>

        <Detail
          label="Submitted"
          value={payment.submittedAt ? formatDate(payment.submittedAt) : ""}
        />

        <Detail
          label="Reviewed"
          value={payment.reviewedAt ? formatDate(payment.reviewedAt) : ""}
        />
      </dl>

      {shot.state === "shown" ? (
        <div className="mt-4">
          <div className="relative h-96 w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-black">
            <Image
              src={shot.src}
              alt={`Payment screenshot from ${lead.name}`}
              fill
              sizes="20rem"
              unoptimized
              className="object-contain"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => void openFullSize(shot.src)}>
              Open full size
            </Btn>

            <Btn size="sm" onClick={() => setShot({ state: "idle" })}>
              Hide
            </Btn>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Btn
            size="sm"
            disabled={!online || shot.state === "loading"}
            onClick={showScreenshot}
          >
            {shot.state === "loading" ? "Loading…" : "View screenshot"}
          </Btn>

          {shot.state === "failed" && (
            <span className="text-xs text-red-300">
              The screenshot couldn&apos;t be loaded.
            </span>
          )}

          {!online && (
            <span className="text-xs text-white/35">
              Screenshots and reviews need the server connection.
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {payment.status !== "verified" && (
          <Btn
            size="sm"
            variant="gold"
            disabled={!online}
            onClick={() => {
              const ok = window.confirm(
                `Mark ${lead.name}'s payment as verified? They will see their booking as confirmed.`,
              );

              if (ok) onReview("verified");
            }}
          >
            Verify payment
          </Btn>
        )}

        {payment.status !== "rejected" && (
          <Btn
            size="sm"
            variant="danger"
            disabled={!online}
            onClick={() => onReview("rejected")}
          >
            Reject
          </Btn>
        )}

        {payment.status !== "submitted" && (
          <Btn size="sm" disabled={!online} onClick={() => onReview("submitted")}>
            Undo review
          </Btn>
        )}
      </div>

      <p className="mt-3 text-xs leading-6 text-white/35">
        Verify only once the amount shows in your bank or UPI app. The visitor
        sees &ldquo;confirmed&rdquo; as soon as you do; rejecting lets them
        send new proof.
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </dt>

      <dd className="mt-1.5 break-words text-white/70">
        {value ? (children ?? value) : "—"}
      </dd>
    </div>
  );
}
