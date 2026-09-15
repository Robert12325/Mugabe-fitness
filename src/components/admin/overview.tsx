"use client";

import { useMemo } from "react";
import { LEAD_STATUSES } from "@/lib/types";
import { useDB } from "@/lib/use-store";
import { SESSION_START } from "./session";
import type { IconName } from "@/components/icons";
import { STATUS_PALETTE } from "./status-palette";
import { Card, EmptyState, IconTile, SectionTitle } from "./ui";

const DAY = 24 * 60 * 60 * 1000;

export default function Overview() {
  const db = useDB();

  const stats = useMemo(() => {
    const now = SESSION_START;

    const week = db.leads.filter(
      (lead) => now - new Date(lead.createdAt).getTime() < 7 * DAY,
    ).length;

    const byStatus = LEAD_STATUSES.map((status) => ({
      status,
      count: db.leads.filter((lead) => lead.status === status).length,
    }));

    const enrolled = byStatus.find((s) => s.status === "enrolled")?.count ?? 0;

    const byProgram = db.programs
      .map((program) => ({
        id: program.id,
        name: program.name,
        count: db.leads.filter((lead) => lead.programId === program.id).length,
      }))
      .concat({
        id: "__undecided",
        name: "Undecided",
        count: db.leads.filter(
          (lead) => !db.programs.some((p) => p.id === lead.programId),
        ).length,
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      total: db.leads.length,
      week,
      byStatus,
      enrolled,
      byProgram,
      conversion: db.leads.length
        ? Math.round((enrolled / db.leads.length) * 100)
        : 0,
    };
  }, [db.leads, db.programs]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="users" label="Total enquiries" value={stats.total} />
        <Stat icon="clock" label="Last 7 days" value={stats.week} />
        <Stat icon="check" label="Enrolled" value={stats.enrolled} />
        <Stat icon="trend" label="Conversion" value={`${stats.conversion}%`} />
      </div>

      <Card decorated>
        <SectionTitle
          icon="chart"
          title="Lead pipeline"
          hint="Where every enquiry currently sits."
          flourish
        />

        {stats.total === 0 ? (
          <EmptyState>
            No enquiries yet — the pipeline fills up as the form is used.
          </EmptyState>
        ) : (
          <>
            <div className="flex h-4 w-full gap-[2px] overflow-hidden">
              {stats.byStatus
                .filter((row) => row.count > 0)
                .map((row) => (
                  <div
                    key={row.status}
                    title={`${row.status}: ${row.count}`}
                    style={{
                      width: `${(row.count / stats.total) * 100}%`,
                      backgroundColor: STATUS_PALETTE[row.status].fill,
                    }}
                    className="rounded-[4px]"
                  />
                ))}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.byStatus.map((row) => (
                <div key={row.status} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    style={{ backgroundColor: STATUS_PALETTE[row.status].fill }}
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  />

                  <dt className="text-xs capitalize text-white/45">
                    {row.status}
                  </dt>

                  <dd className="ml-auto text-sm font-bold text-white">
                    {row.count}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle
          icon="calendar"
          title="Program interest"
          hint="Which program each enquiry asked about."
        />

        {stats.byProgram.length === 0 ? (
          <EmptyState>Nothing to compare yet.</EmptyState>
        ) : (
          <div className="space-y-4">
            {stats.byProgram.map((row) => {
              const max = stats.byProgram[0].count;

              return (
                <div key={row.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="text-sm text-white/70">{row.name}</span>

                    <span className="text-sm font-bold text-white">
                      {row.count}
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-[4px] bg-white/[0.05]">
                    <div
                      style={{ width: `${(row.count / max) * 100}%` }}
                      className="h-full rounded-[4px] bg-[#ad8b2b]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: IconName;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#121212,#0a0a0a)] p-5">
      <IconTile icon={icon} />

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
          {label}
        </p>

        <p className="mt-1 text-3xl font-black tracking-tight text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
