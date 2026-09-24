"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/icons";
import { TODAY, daysUntil, formatDate } from "@/lib/billing";
import { useT } from "@/lib/i18n";
import {
  EMPTY_PROGRESS,
  chartPoints,
  formatDeltaKg,
  formatKg,
  isValidDate,
  isValidWeight,
  parseKg,
  progressStats,
  type Progress,
} from "@/lib/progress";
import {
  deleteEntry,
  fetchProgress,
  saveEntry,
  saveGoal,
} from "@/lib/progress-client";

/**
 * The client's own dashboard: what they weighed, what they are aiming for,
 * and how far along they are.
 *
 * It only appears for a paying client — see `unlocked` — but the weight log
 * itself belongs to the account, so it survives a lapsed month and is
 * waiting when they come back.
 */

const card = "rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6";

const fieldClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-white/35 focus:border-[#d4af37]/70 focus:bg-white/[0.06]";

const labelClass =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/55";

const goldButton =
  "rounded-full bg-[#d4af37] px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60";

const ghostButton =
  "rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-white/40 hover:text-white";

type Load = "loading" | "error" | "ready";

export default function ProgressPanel({
  token,
  unlocked,
}: {
  token: string;
  unlocked: boolean;
}) {
  const t = useT();
  const [load, setLoad] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

  useEffect(() => {
    if (!unlocked) return;

    let active = true;

    fetchProgress(token).then((result) => {
      if (!active) return;

      if (result.state === "ok") {
        setProgress(result.progress);
        setLoad("ready");
      } else {
        setLoad("error");
      }
    });

    return () => {
      active = false;
    };
  }, [token, unlocked, attempt]);

  if (!unlocked) return <LockedPanel />;

  if (load === "loading") {
    return (
      <section className={card}>
        <p role="status" className="text-sm text-white/55">
          {t("prog.loading")}
        </p>
      </section>
    );
  }

  if (load === "error") {
    return (
      <section
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300"
      >
        <span>{t("prog.error")}</span>

        <button
          type="button"
          onClick={() => {
            setLoad("loading");
            setAttempt((n) => n + 1);
          }}
          className={ghostButton}
        >
          {t("prog.retry")}
        </button>
      </section>
    );
  }

  const stats = progressStats(progress);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-black uppercase tracking-wide text-white">
          {t("prog.title")}
        </h2>

        {stats.entryCount > 0 && (
          <p className="text-xs text-white/50">
            {t("prog.entryCount").replace("{count}", String(stats.entryCount))}
          </p>
        )}
      </div>

      {stats.entryCount === 0 ? (
        <section className={card}>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]">
            <Icon name="chart" className="h-5 w-5" />
          </span>

          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
            {t("prog.empty")}
          </p>
        </section>
      ) : (
        <>
          <StatRow stats={stats} />

          {stats.targetGrams > 0 && (
            <GoalBar
              percent={stats.percent}
              reached={stats.reached}
              targetOn={progress.goal.targetOn}
            />
          )}

          {progress.entries.length >= 2 && <Chart progress={progress} />}
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <LogForm
          token={token}
          progress={progress}
          onSaved={setProgress}
        />

        <GoalForm token={token} progress={progress} onSaved={setProgress} />
      </div>

      {progress.entries.length > 0 && (
        <History token={token} progress={progress} onSaved={setProgress} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Before the first payment                                            */
/* ------------------------------------------------------------------ */

function LockedPanel() {
  const t = useT();

  return (
    <section className="rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#0b0b0b] p-6 sm:p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]">
        <Icon name="lock" className="h-5 w-5" />
      </span>

      <h2 className="mt-5 text-lg font-black uppercase tracking-wide text-white">
        {t("prog.lockedTitle")}
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
        {t("prog.lockedText")}
      </p>

      <Link href="/#programs" className={`mt-6 inline-block ${goldButton}`}>
        {t("prog.lockedCta")}
      </Link>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The numbers                                                         */
/* ------------------------------------------------------------------ */

function StatRow({ stats }: { stats: ReturnType<typeof progressStats> }) {
  const t = useT();

  const cells = [
    { label: t("prog.start"), value: formatKg(stats.startGrams), tone: "plain" },
    { label: t("prog.current"), value: formatKg(stats.currentGrams), tone: "gold" },
    {
      label: t("prog.target"),
      value: stats.targetGrams ? formatKg(stats.targetGrams) : "—",
      tone: "plain",
    },
    {
      label: t("prog.change"),
      value: formatDeltaKg(stats.changeGrams),
      tone: "plain",
      foot:
        stats.lastChangeGrams !== 0
          ? `${formatDeltaKg(stats.lastChangeGrams)} ${t("prog.sinceLast")}`
          : "",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            {cell.label}
          </dt>

          <dd
            className={`mt-2 text-2xl font-black tracking-tight ${
              cell.tone === "gold" ? "text-[#d4af37]" : "text-white"
            }`}
          >
            {cell.value}
            {cell.value !== "—" && (
              <span className="ml-1 text-xs font-bold text-white/40">
                {t("prog.kg")}
              </span>
            )}
          </dd>

          {cell.foot && (
            <p className="mt-1 text-[11px] text-white/40">{cell.foot}</p>
          )}
        </div>
      ))}
    </dl>
  );
}

function GoalBar({
  percent,
  reached,
  targetOn,
}: {
  percent: number;
  reached: boolean;
  targetOn: string;
}) {
  const t = useT();
  const left = targetOn ? daysUntil(targetOn, TODAY) : null;

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-white/70">
          {reached
            ? t("prog.reached")
            : t("prog.percentDone").replace("{percent}", String(percent))}
        </p>

        {left !== null && (
          <p className="text-[11px] text-white/45">
            {left >= 0
              ? t("prog.daysLeft").replace("{days}", String(left))
              : t("prog.datePassed")}
          </p>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#b88420,#f6d27a)] transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}

/**
 * The line of weigh-ins.
 *
 * `preserveAspectRatio="none"` lets one 0-100 box stretch to any width;
 * `vector-effect` keeps the stroke an even thickness while it does, which
 * a plain stretched path would not.
 */
function Chart({ progress }: { progress: Progress }) {
  const t = useT();
  const points = chartPoints(progress.entries);

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <section className={card}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
        {t("prog.chartTitle")}
      </h3>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${formatKg(first.grams)}–${formatKg(last.grams)} ${t("prog.kg")}`}
        className="mt-4 h-40 w-full sm:h-48"
      >
        <defs>
          <linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4af37" stopOpacity="0.28" />
            <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={area} fill="url(#progress-fill)" />

        <polyline
          points={line}
          fill="none"
          stroke="#f6d27a"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-3 flex justify-between text-[11px] text-white/40">
        <span>{formatDate(first.on)}</span>
        <span>{formatDate(last.on)}</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

function LogForm({
  token,
  progress,
  onSaved,
}: {
  token: string;
  progress: Progress;
  onSaved: (next: Progress) => void;
}) {
  const t = useT();
  const [weight, setWeight] = useState("");
  const [on, setOn] = useState(TODAY);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const replacing = progress.entries.some((entry) => entry.on === on);

  function edit(apply: () => void) {
    apply();
    setSaved(false);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const grams = parseKg(weight);

    if (!isValidWeight(grams)) return setError(t("prog.err.weight"));
    if (!isValidDate(on)) return setError(t("prog.err.date"));

    setSaving(true);
    setError("");

    const result = await saveEntry(token, { on, grams, note: note.trim() });

    setSaving(false);

    if (!result.ok) return setError(result.message);

    onSaved(result.progress);
    setWeight("");
    setNote("");
    setSaved(true);
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className={card}>
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
        <Icon name="plus" className="h-4 w-4 text-[#d4af37]" />
        {t("prog.logTitle")}
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="progress-weight" className={labelClass}>
            {t("prog.weightLabel")}
          </label>

          <input
            id="progress-weight"
            inputMode="decimal"
            autoComplete="off"
            maxLength={8}
            value={weight}
            onChange={(event) => edit(() => setWeight(event.target.value))}
            placeholder={t("prog.weightPh")}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="progress-date" className={labelClass}>
            {t("prog.dateLabel")}
          </label>

          <input
            id="progress-date"
            type="date"
            max={TODAY}
            value={on}
            onChange={(event) => edit(() => setOn(event.target.value))}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="progress-note" className={labelClass}>
          {t("prog.noteLabel")}
        </label>

        <input
          id="progress-note"
          maxLength={200}
          value={note}
          onChange={(event) => edit(() => setNote(event.target.value))}
          placeholder={t("prog.notePh")}
          className={fieldClass}
        />
      </div>

      {replacing && !error && (
        <p className="mt-3 text-[11px] leading-5 text-[#e8c05a]">
          {t("prog.replaceNote")}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={saving} className={goldButton}>
          {saving ? t("prog.saving") : t("prog.save")}
        </button>

        {saved && (
          <span role="status" className="text-xs font-bold text-[#7ddba0]">
            {t("prog.saved")}
          </span>
        )}
      </div>
    </form>
  );
}

function GoalForm({
  token,
  progress,
  onSaved,
}: {
  token: string;
  progress: Progress;
  onSaved: (next: Progress) => void;
}) {
  const t = useT();
  const { goal } = progress;

  const [target, setTarget] = useState(
    goal.targetGrams ? formatKg(goal.targetGrams) : "",
  );
  const [by, setBy] = useState(goal.targetOn);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function send(targetGrams: number, targetOn: string) {
    setSaving(true);
    setError("");

    const result = await saveGoal(token, { targetGrams, targetOn });

    setSaving(false);

    if (!result.ok) return setError(result.message);

    onSaved(result.progress);
    setSaved(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const grams = parseKg(target);

    if (!isValidWeight(grams)) return setError(t("prog.err.weight"));

    await send(grams, by);
  }

  function clear() {
    setTarget("");
    setBy("");
    void send(0, "");
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className={card}>
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
        <Icon name="target" className="h-4 w-4 text-[#d4af37]" />
        {t("prog.goalTitle")}
      </h3>

      {goal.targetGrams === 0 && (
        <p className="mt-3 text-xs leading-6 text-white/50">
          {t("prog.goalNone")}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="goal-weight" className={labelClass}>
            {t("prog.goalWeight")}
          </label>

          <input
            id="goal-weight"
            inputMode="decimal"
            autoComplete="off"
            maxLength={8}
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              setSaved(false);
              setError("");
            }}
            placeholder={t("prog.weightPh")}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="goal-date" className={labelClass}>
            {t("prog.goalDate")}
          </label>

          <input
            id="goal-date"
            type="date"
            value={by}
            onChange={(event) => {
              setBy(event.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={goldButton}>
          {saving ? t("prog.saving") : t("prog.goalSave")}
        </button>

        {goal.targetGrams > 0 && (
          <button
            type="button"
            onClick={clear}
            disabled={saving}
            className={ghostButton}
          >
            {t("prog.goalClear")}
          </button>
        )}

        {saved && (
          <span role="status" className="text-xs font-bold text-[#7ddba0]">
            {t("prog.saved")}
          </span>
        )}
      </div>
    </form>
  );
}

function History({
  token,
  progress,
  onSaved,
}: {
  token: string;
  progress: Progress;
  onSaved: (next: Progress) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState("");

  async function remove(on: string) {
    if (!window.confirm(t("prog.deleteConfirm").replace("{date}", formatDate(on)))) {
      return;
    }

    setBusy(on);

    const result = await deleteEntry(token, on);

    setBusy("");

    if (result.ok) onSaved(result.progress);
  }

  return (
    <section className={card}>
      <h3 className="text-sm font-black uppercase tracking-wide text-white">
        {t("prog.history")}
      </h3>

      <ul className="mt-4 divide-y divide-white/8">
        {progress.entries.slice(0, 12).map((entry, index) => {
          const previous = progress.entries[index + 1];
          const delta = previous ? entry.grams - previous.grams : 0;

          return (
            <li
              key={entry.on}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
            >
              <span className="w-28 shrink-0 text-xs text-white/50">
                {formatDate(entry.on)}
              </span>

              <span className="text-sm font-black text-white">
                {formatKg(entry.grams)}
                <span className="ml-1 text-[11px] font-bold text-white/40">
                  {t("prog.kg")}
                </span>
              </span>

              {delta !== 0 && (
                <span className="text-[11px] font-bold text-[#e8c05a]">
                  {formatDeltaKg(delta)}
                </span>
              )}

              {entry.note && (
                <span className="min-w-0 flex-1 break-words text-xs text-white/45">
                  {entry.note}
                </span>
              )}

              <button
                type="button"
                onClick={() => void remove(entry.on)}
                disabled={busy === entry.on}
                className="ml-auto text-[10px] font-black uppercase tracking-[0.12em] text-white/40 transition hover:text-red-300 disabled:opacity-50"
              >
                {t("prog.delete")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
