"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseMoney } from "@/lib/billing";
import {
  patchEnquiry,
  removeAllEnquiries,
  removeEnquiry,
  type ServerState,
} from "@/lib/enquiries-client";
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
import { STATUS_PALETTE } from "./status-palette";
import { Btn, Card, EmptyState, SectionTitle, inputClass } from "./ui";

/** Notes save locally on every keystroke and reach the server once typing
 *  pauses this long. */
const NOTES_DEBOUNCE_MS = 700;

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
  const [status, setStatus] = useState<LeadStatus | "all">("all");
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return db.leads
      .filter((lead) => status === "all" || lead.status === status)
      .filter((lead) => {
        if (!needle) return true;

        return [lead.name, lead.email, lead.phone, lead.goal, lead.message]
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
    <Card>
      <SectionTitle
        title="Enquiries"
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
          placeholder="Search name, email, phone, goal…"
          className={`${inputClass} sm:max-w-xs`}
        />

        <div className="flex flex-wrap gap-2">
          {(["all", ...LEAD_STATUSES] as const).map((option) => (
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
                  {db.leads.filter((l) => l.status === option).length}
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
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
            <Detail label="Email" value={lead.email}>
              <EmailText email={lead.email} />
            </Detail>
            <Detail label="Phone" value={lead.phone} />
            <Detail label="Program" value={programName} />
            <Detail label="Preferred time" value={lead.slot} />
            <Detail label="Goal" value={lead.goal} />
          </dl>

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
