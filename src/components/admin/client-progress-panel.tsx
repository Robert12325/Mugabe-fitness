"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Meter, TrendChart, WorkoutStrip } from "@/components/progress/charts";
import { TODAY, formatDate } from "@/lib/billing";
import {
  MISSED_WORKOUTS_ALERT,
  STALE_AFTER_DAYS,
  TARGET_FIELDS,
  attention,
  fromUnits,
  formatCount,
  rangeDates,
  series,
  summarize,
  toUnits,
  workoutDays,
  type Attention,
  type Range,
  type TargetField,
  type Targets,
} from "@/lib/daily";
import {
  addNote,
  deleteNote,
  loadClientRecord,
  loadClients,
  saveTargets,
  type ClientRecord,
  type ClientSnapshot,
  type ClientsLoad,
} from "@/lib/daily-client";
import { formatMoment, type MembershipStatus } from "@/lib/membership";
import { formatDeltaKg, formatKg, parseKg } from "@/lib/progress";
import EmailText from "./email-text";
import { setUnlocked } from "./session";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  Notice,
  SectionTitle,
  TextField,
} from "./ui";

/**
 * The coach's view of every client's daily log: who has gone quiet, who is
 * missing workouts, and — opened up — their week or month, their targets,
 * and private notes.
 *
 * The log itself is the client's record and is read-only here. Targets are
 * the coach's alone: nothing is filled in or suggested for them.
 */

const STATUS: Record<MembershipStatus, { label: string; badge: string }> = {
  none: { label: "No plan", badge: "border-white/15 bg-white/5 text-white/55" },
  trial: { label: "Trial", badge: "border-[#d4af37]/45 bg-[#d4af37]/10 text-[#eac55a]" },
  paid: { label: "Paid", badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]" },
  due: { label: "Payment due", badge: "border-amber-300/40 bg-amber-400/10 text-amber-200" },
  expired: { label: "Expired", badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]" },
};

const badge =
  "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]";

const alertBadge = `${badge} border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]`;

type Filter = "all" | "attention";

function quietLabel(flags: Attention) {
  if (flags.daysSinceUpdate === null) return "Never logged";

  return `No update for ${flags.daysSinceUpdate} days`;
}

function lastUpdateLabel(flags: Attention) {
  if (flags.daysSinceUpdate === null) return "never logged";
  if (flags.daysSinceUpdate === 0) return "updated today";
  if (flags.daysSinceUpdate === 1) return "updated yesterday";

  return `updated ${flags.daysSinceUpdate}d ago`;
}

export default function ClientProgressPanel() {
  const [load, setLoad] = useState<ClientsLoad | "loading">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const apply = useCallback((result: ClientsLoad) => {
    if (result.state === "unauthorized") setUnlocked(false);
    else setLoad(result);
  }, []);

  useEffect(() => {
    let active = true;

    loadClients().then((result) => {
      if (active) apply(result);
    });

    return () => {
      active = false;
    };
  }, [apply]);

  function refresh() {
    setRefreshing(true);
    void loadClients()
      .then(apply)
      .finally(() => setRefreshing(false));
  }

  const rows = useMemo(() => {
    const clients =
      load !== "loading" && load.state === "online" ? load.clients : [];

    return clients
      .map((client) => ({
        client,
        flags: attention(client.recent, client.lastWeighOn, TODAY),
      }))
      // Those who need a word first, then by name.
      .sort((a, b) => {
        const needA = a.flags.stale || a.flags.missing ? 0 : 1;
        const needB = b.flags.stale || b.flags.missing ? 0 : 1;

        return (
          needA - needB ||
          a.client.name.localeCompare(b.client.name, undefined, {
            sensitivity: "base",
          })
        );
      });
  }, [load]);

  const needing = rows.filter((row) => row.flags.stale || row.flags.missing);
  const shown = filter === "all" ? rows : needing;

  return (
    <div className="space-y-8">
      <Card decorated>
        <SectionTitle
          icon="chart"
          title="Client progress"
          hint="Daily logs, targets and notes for each client account. Logs are the client's own record and read-only here."
          action={
            <Btn size="sm" icon="cycle" disabled={refreshing} onClick={refresh}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </Btn>
          }
        />

        {load === "loading" ? (
          <p className="text-sm text-white/50">Loading clients…</p>
        ) : load.state === "offline" ? (
          <Notice icon="database">
            Client progress needs the server database, which isn&apos;t
            configured here.
          </Notice>
        ) : load.state === "error" ? (
          <Notice icon="alert" tone="red">
            Clients couldn&apos;t be loaded. Try Refresh.
          </Notice>
        ) : (
          <>
            {needing.length > 0 && (
              <div className="mb-6">
                <Notice icon="alert">
                  <strong>
                    {needing.length} client{needing.length === 1 ? "" : "s"}
                  </strong>{" "}
                  {needing.length === 1 ? "has" : "have"} not updated in{" "}
                  {STALE_AFTER_DAYS}+ days or skipped {MISSED_WORKOUTS_ALERT}+
                  workouts this week.
                </Notice>
              </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All clients", count: rows.length },
                  { id: "attention", label: "Needs attention", count: needing.length },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    filter === option.id
                      ? "border-[#d4af37] bg-[#d4af37] text-black"
                      : "border-white/15 text-white/55 hover:text-white"
                  }`}
                >
                  {option.label}
                  <span className="ml-1.5 opacity-60">{option.count}</span>
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <EmptyState>
                {rows.length === 0
                  ? "No client accounts yet. Clients appear here once they book a program while logged in."
                  : "Nobody needs attention right now."}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {shown.map(({ client, flags }) => (
                  <ClientRow
                    key={client.userId}
                    client={client}
                    flags={flags}
                    open={open === client.userId}
                    onToggle={() =>
                      setOpen((id) => (id === client.userId ? null : client.userId))
                    }
                    onTargetsSaved={refresh}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function ClientRow({
  client,
  flags,
  open,
  onToggle,
  onTargetsSaved,
}: {
  client: ClientSnapshot;
  flags: Attention;
  open: boolean;
  onToggle: () => void;
  onTargetsSaved: () => void;
}) {
  const status = STATUS[client.status];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <span className={`${badge} ${status.badge}`}>{status.label}</span>

        <span className="min-w-[8rem] flex-1">
          <span className="block text-sm font-bold text-white">
            {client.name || "Unnamed client"}
          </span>
          <span className="block text-xs text-white/45">
            {client.programName || "No program"} · {lastUpdateLabel(flags)}
          </span>
        </span>

        {flags.stale && <span className={alertBadge}>{quietLabel(flags)}</span>}

        {flags.missing && (
          <span className={alertBadge}>
            {flags.missedWorkouts} missed workouts
          </span>
        )}

        <span className="text-white/45">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ClientDetail client={client} onTargetsSaved={onTargetsSaved} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One client, opened                                                  */
/* ------------------------------------------------------------------ */

function ClientDetail({
  client,
  onTargetsSaved,
}: {
  client: ClientSnapshot;
  onTargetsSaved: () => void;
}) {
  const [record, setRecord] = useState<ClientRecord | null | "loading">("loading");
  const [attempt, setAttempt] = useState(0);
  const [range, setRange] = useState<Range>("week");

  useEffect(() => {
    let active = true;

    loadClientRecord(client.userId).then((result) => {
      if (active) setRecord(result);
    });

    return () => {
      active = false;
    };
  }, [client.userId, attempt]);

  if (record === "loading") {
    return (
      <p className="border-t border-white/10 px-5 py-5 text-sm text-white/50">
        Loading {client.name || "client"}&apos;s progress…
      </p>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-5 py-5 text-sm text-red-300">
        This client&apos;s progress couldn&apos;t be loaded.
        <Btn size="sm" onClick={() => {
          setRecord("loading");
          setAttempt((n) => n + 1);
        }}>
          Try again
        </Btn>
      </div>
    );
  }

  const dates = rangeDates(range, TODAY);
  const from = dates[0];
  const to = dates[dates.length - 1];
  const summary = summarize(record.log, record.progress.entries, from, to);
  const latest = record.log[0] ?? null;

  return (
    <div className="space-y-6 border-t border-white/10 px-5 py-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/55">
        {client.email && (
          <span className="min-w-0 break-words">
            <EmailText email={client.email} />
          </span>
        )}
        {client.phone && <span>{client.phone}</span>}
      </div>

      {latest && (
        <div>
          <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Latest day · {formatDate(latest.on)}
          </h3>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Meter
              label="Calories"
              value={latest.caloriesKcal !== null ? formatCount(latest.caloriesKcal) : ""}
              target={record.targets.caloriesKcal ? `${formatCount(record.targets.caloriesKcal)} kcal` : ""}
              percent={pct(latest.caloriesKcal, record.targets.caloriesKcal)}
              noTarget="no target"
            />
            <Meter
              label="Protein"
              value={latest.proteinG !== null ? String(latest.proteinG) : ""}
              target={record.targets.proteinG ? `${record.targets.proteinG} g` : ""}
              percent={pct(latest.proteinG, record.targets.proteinG)}
              noTarget="no target"
            />
            <Meter
              label="Water"
              value={latest.waterMl !== null ? fromUnits(latest.waterMl, 1000) : ""}
              target={record.targets.waterMl ? `${fromUnits(record.targets.waterMl, 1000)} L` : ""}
              percent={pct(latest.waterMl, record.targets.waterMl)}
              noTarget="no target"
            />
            <Meter
              label="Steps"
              value={latest.steps !== null ? formatCount(latest.steps) : ""}
              target={record.targets.steps ? formatCount(record.targets.steps) : ""}
              percent={pct(latest.steps, record.targets.steps)}
              noTarget="no target"
            />
          </div>
        </div>
      )}

      <TargetsForm
        userId={client.userId}
        targets={record.targets}
        onSaved={(targets) => {
          setRecord({ ...record, targets });
          onTargetsSaved();
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {(["week", "month"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={range === option}
            onClick={() => setRange(option)}
            className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              range === option
                ? "border-[#d4af37] bg-[#d4af37] text-black"
                : "border-white/15 text-white/55 hover:text-white"
            }`}
          >
            {option === "week" ? "Last 7 days" : "Last 30 days"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-wide text-white">
            {range === "week" ? "Weekly progress" : "Monthly progress"}
          </h3>
          <p className="text-xs text-white/45">
            {summary.daysLogged} of {dates.length} days logged
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Fact label="Avg calories" value={avg(summary.caloriesKcal, "kcal")} />
          <Fact label="Avg protein" value={avg(summary.proteinG, "g")} />
          <Fact label="Avg water" value={avg(summary.waterMl, "L", 1000)} />
          <Fact
            label="Avg steps"
            value={summary.steps === null ? "—" : `${formatCount(summary.steps)}/day`}
          />
          <Fact label="Avg sleep" value={avg(summary.sleepMin, "h", 60)} />
          <Fact
            label="Avg energy"
            value={summary.energy === null ? "—" : `${(Math.round(summary.energy * 10) / 10).toString()}/10`}
          />
          <Fact
            label="Workouts"
            value={`${summary.workoutsDone}/${summary.workoutsAnswered}`}
          />
          <Fact
            label="Weight"
            value={
              summary.weight === null
                ? "—"
                : `${formatKg(summary.weight.from)} → ${formatKg(summary.weight.to)} kg (${formatDeltaKg(summary.weight.to - summary.weight.from)})`
            }
          />
          <Fact
            label="Waist"
            value={
              summary.waist === null
                ? "—"
                : `${fromUnits(summary.waist.from, 10)} → ${fromUnits(summary.waist.to, 10)} cm`
            }
          />
        </dl>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart
          title="Weight"
          points={series(
            record.progress.entries.map((entry) => ({ on: entry.on, value: entry.grams })),
            from,
            to,
          )}
          from={from}
          to={to}
          format={formatKg}
          unit="kg"
          minSpan={2_000}
          empty="No weigh-ins in this period."
          target={record.targets.weightGrams}
        />

        <TrendChart
          title="Waist"
          points={series(
            record.log.map((entry) => ({ on: entry.on, value: entry.waistMm })),
            from,
            to,
          )}
          from={from}
          to={to}
          format={(mm) => fromUnits(mm, 10)}
          unit="cm"
          minSpan={20}
          empty="No waist measurements in this period."
          target={record.targets.waistMm}
        />
      </div>

      <WorkoutStrip
        title="Workout consistency"
        days={workoutDays(record.log, dates)}
        labels={{
          yes: "Trained",
          no: "Skipped",
          none: "Not logged",
          summary: `${summary.workoutsDone} of ${summary.workoutsAnswered} days`,
        }}
      />

      <DailyTable record={record} from={from} to={to} />

      <NotesBox
        userId={client.userId}
        notes={record.notes}
        onChange={(notes) => setRecord({ ...record, notes })}
      />
    </div>
  );
}

function pct(value: number | null, target: number | null) {
  return value === null || !target ? null : (value / target) * 100;
}

function avg(value: number | null, unit: string, scale = 1) {
  if (value === null) return "—";

  return scale === 1
    ? `${formatCount(value)} ${unit}`
    : `${fromUnits(Math.round(value), scale)} ${unit}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-black text-white">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Targets                                                             */
/* ------------------------------------------------------------------ */

const TARGET_BOXES: Record<
  TargetField,
  { label: string; scale: number; placeholder: string; weight?: boolean }
> = {
  caloriesKcal: { label: "Daily calories (kcal)", scale: 1, placeholder: "e.g. 2000" },
  proteinG: { label: "Daily protein (g)", scale: 1, placeholder: "e.g. 140" },
  waterMl: { label: "Daily water (litres)", scale: 1000, placeholder: "e.g. 3" },
  steps: { label: "Daily steps", scale: 1, placeholder: "e.g. 8000" },
  weightGrams: { label: "Target weight (kg)", scale: 1000, placeholder: "e.g. 78", weight: true },
  waistMm: { label: "Target waist (cm)", scale: 10, placeholder: "e.g. 85" },
};

function targetText(targets: Targets, field: TargetField) {
  const value = targets[field];

  if (value === null) return "";

  return field === "weightGrams"
    ? formatKg(value)
    : fromUnits(value, TARGET_BOXES[field].scale);
}

function TargetsForm({
  userId,
  targets,
  onSaved,
}: {
  userId: string;
  targets: Targets;
  onSaved: (targets: Targets) => void;
}) {
  const [values, setValues] = useState<Record<TargetField, string>>(() =>
    Object.fromEntries(
      TARGET_FIELDS.map((field) => [field, targetText(targets, field)]),
    ) as Record<TargetField, string>,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const next = {} as Record<TargetField, number | null>;

    for (const field of TARGET_FIELDS) {
      const text = values[field].trim();
      const box = TARGET_BOXES[field];

      if (!text) {
        next[field] = null;
        continue;
      }

      const value = box.weight
        ? parseKg(text)
        : toUnits(box.scale === 1 ? text.replace(/[,\s]/g, "") : text, box.scale);

      if (value === null || Number.isNaN(value) || value <= 0) {
        setError(`${box.label}: enter a number, or leave it empty.`);
        return;
      }

      next[field] = value;
    }

    setSaving(true);
    setError("");

    const result = await saveTargets(userId, next);

    setSaving(false);

    if (!result.ok) return setError(result.message);

    setSaved(true);
    onSaved(result.value);
  }

  return (
    <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.03] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-white">
          Targets
        </h3>

        {targets.updatedAt && (
          <p className="text-xs text-white/40">
            Last set {formatMoment(targets.updatedAt)}
          </p>
        )}
      </div>

      <p className="mt-1.5 text-xs leading-5 text-white/50">
        Only what you set here is shown to the client. Leave a box empty for no
        target — nothing is filled in for you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TARGET_FIELDS.map((field) => (
          <Field
            key={field}
            label={TARGET_BOXES[field].label}
            value={values[field]}
            placeholder={TARGET_BOXES[field].placeholder}
            onChange={(value) => {
              setValues((prev) => ({ ...prev, [field]: value }));
              setSaved(false);
              setError("");
            }}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Btn size="sm" variant="gold" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save targets"}
        </Btn>

        {saved && (
          <span role="status" className="text-xs font-bold text-[#7ddba0]">
            Saved — the client sees these now.
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The log, day by day                                                 */
/* ------------------------------------------------------------------ */

function DailyTable({
  record,
  from,
  to,
}: {
  record: ClientRecord;
  from: string;
  to: string;
}) {
  const weights = new Map(record.progress.entries.map((entry) => [entry.on, entry.grams]));
  const days = record.log.filter((day) => day.on >= from && day.on <= to);

  // A day with only a weigh-in still belongs in the table.
  const weighOnly = record.progress.entries
    .filter((entry) => entry.on >= from && entry.on <= to)
    .filter((entry) => !days.some((day) => day.on === entry.on))
    .map((entry) => entry.on);

  const dates = [...new Set([...days.map((day) => day.on), ...weighOnly])].sort(
    (a, b) => b.localeCompare(a),
  );

  const byDate = new Map(days.map((day) => [day.on, day]));

  if (dates.length === 0) {
    return <EmptyState>Nothing logged in this period.</EmptyState>;
  }

  const head = ["Date", "Kcal", "Protein", "Water", "Steps", "Weight", "Waist", "Sleep", "Workout", "Energy", "Notes"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[56rem] text-left text-xs">
        <thead className="bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
          <tr>
            {head.map((label) => (
              <th key={label} scope="col" className="px-3 py-3 font-black">
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/[0.06] text-white/75">
          {dates.map((on) => {
            const day = byDate.get(on);
            const weight = weights.get(on);
            const cell = (value: number | null | undefined, render: (v: number) => string) =>
              value === null || value === undefined ? "—" : render(value);

            return (
              <tr key={on}>
                <th scope="row" className="whitespace-nowrap px-3 py-3 font-bold text-white">
                  {formatDate(on)}
                </th>
                <td className="px-3 py-3">{cell(day?.caloriesKcal, formatCount)}</td>
                <td className="px-3 py-3">{cell(day?.proteinG, (v) => `${v} g`)}</td>
                <td className="px-3 py-3">{cell(day?.waterMl, (v) => `${fromUnits(v, 1000)} L`)}</td>
                <td className="px-3 py-3">{cell(day?.steps, formatCount)}</td>
                <td className="px-3 py-3">{cell(weight, (v) => `${formatKg(v)} kg`)}</td>
                <td className="px-3 py-3">{cell(day?.waistMm, (v) => `${fromUnits(v, 10)} cm`)}</td>
                <td className="px-3 py-3">{cell(day?.sleepMin, (v) => `${fromUnits(v, 60)} h`)}</td>
                <td className="px-3 py-3">
                  {day?.workout === true ? (
                    <span className="font-bold text-[#d4af37]">Yes</span>
                  ) : day?.workout === false ? (
                    <span className="font-bold text-[#f0928c]">No</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3">{cell(day?.energy, (v) => `${v}/10`)}</td>
                <td className="max-w-[16rem] px-3 py-3 text-white/50">
                  {day?.notes || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Private notes                                                       */
/* ------------------------------------------------------------------ */

function NotesBox({
  userId,
  notes,
  onChange,
}: {
  userId: string;
  notes: ClientRecord["notes"];
  onChange: (notes: ClientRecord["notes"]) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    if (!text.trim() || busy) return;

    setBusy(true);
    setError("");

    const result = await addNote(userId, text);

    setBusy(false);

    if (!result.ok) return setError(result.message);

    onChange(result.value);
    setText("");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this note?")) return;

    setBusy(true);
    setError("");

    const result = await deleteNote(userId, id);

    setBusy(false);

    if (!result.ok) return setError(result.message);

    onChange(result.value);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <h3 className="text-sm font-black uppercase tracking-wide text-white">
        Trainer notes
      </h3>
      <p className="mt-1.5 text-xs text-white/45">
        Private — the client never sees these.
      </p>

      <div className="mt-4">
        <TextField
          label="New note"
          value={text}
          rows={3}
          placeholder="Check-in, adjustments, anything to remember"
          onChange={(value) => {
            setText(value.slice(0, 1000));
            setError("");
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="mt-3">
        <Btn size="sm" variant="gold" disabled={busy || !text.trim()} onClick={() => void add()}>
          Add note
        </Btn>
      </div>

      {notes.length > 0 && (
        <ul className="mt-5 space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-white/40">
                  {formatMoment(note.at)}
                </span>

                <button
                  type="button"
                  onClick={() => void remove(note.id)}
                  disabled={busy}
                  className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40 transition hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">
                {note.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
