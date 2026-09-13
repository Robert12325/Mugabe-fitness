"use client";

import { useMemo, useState } from "react";
import { parseMoney } from "@/lib/billing";
import {
  clearLeads,
  clientFromLead,
  deleteLead,
  leadsToCSV,
  updateLead,
} from "@/lib/store";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/types";
import { useDB } from "@/lib/use-store";
import { STATUS_PALETTE } from "./status-palette";
import { Btn, Card, EmptyState, SectionTitle, inputClass } from "./ui";

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

export default function LeadsPanel() {
  const db = useDB();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

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

  function handleClearAll() {
    if (db.leads.length === 0) return;

    const ok = window.confirm(
      `Delete all ${db.leads.length} enquiries? This cannot be undone.`,
    );

    if (ok) clearLeads();
  }

  return (
    <Card>
      <SectionTitle
        title="Enquiries"
        hint={`${db.leads.length} total · ${visible.length} shown`}
        action={
          <div className="flex gap-2">
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

            <Btn size="sm" variant="danger" onClick={handleClearAll}>
              Clear all
            </Btn>
          </div>
        }
      />

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
          {db.leads.length === 0
            ? "No enquiries yet. Submit the form on the home page and it will appear here."
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
              onConvert={() => {
                const program = db.programs.find((p) => p.id === lead.programId);
                clientFromLead(lead, parseMoney(program?.price ?? "0"));
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function LeadRow({
  lead,
  programName,
  open,
  onToggle,
  isClient,
  onConvert,
}: {
  lead: Lead;
  programName: string;
  open: boolean;
  onToggle: () => void;
  isClient: boolean;
  onConvert: () => void;
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
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Detail label="Email" value={lead.email} />
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
              value={lead.notes}
              placeholder="Called on Tuesday, following up next week…"
              onChange={(event) =>
                updateLead(lead.id, { notes: event.target.value })
              }
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
                onClick={() => updateLead(lead.id, { status: option })}
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
                    deleteLead(lead.id);
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </dt>

      <dd className="mt-1.5 break-words text-white/70">{value || "—"}</dd>
    </div>
  );
}
