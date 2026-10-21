"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/icons";
import { Meter, TrendChart, WorkoutStrip } from "@/components/progress/charts";
import { TODAY, formatDate } from "@/lib/billing";
import {
  LIMITS,
  RANGE_DAYS,
  fromUnits,
  formatCount,
  rangeDates,
  series,
  summarize,
  toUnits,
  workoutDays,
  type DailyEntry,
  type NumericField,
  type Range,
  type Targets,
} from "@/lib/daily";
import {
  deleteDay,
  fetchTracking,
  saveDay,
  type Tracking,
} from "@/lib/daily-client";
import { useT, type StringKey } from "@/lib/i18n";
import {
  formatDeltaKg,
  formatKg,
  isValidDate,
  isValidWeight,
  parseKg,
  type Progress,
} from "@/lib/progress";

/**
 * Nutrition & Daily Progress on the client's dashboard: today against the
 * coach's targets, one form for the whole day, and the week or month at a
 * glance.
 *
 * Built for a phone: everything is on this one screen, the form opens on
 * today, and every field is optional — log what you have.
 *
 * Only numbers the coach set are ever shown as targets. Nothing here
 * suggests an intake.
 */

const card = "rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6";

const fieldClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-base text-white outline-none transition [color-scheme:dark] placeholder:text-white/30 focus:border-[#d4af37]/70 focus:bg-white/[0.06] sm:text-sm";

const labelClass =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/55";

const goldButton =
  "rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60";

type Load = "loading" | "error" | "ready";

export default function NutritionPanel({
  token,
  onWeightChanged,
}: {
  token: string;
  /** A weight was saved or removed here, so the weight panel should
   *  read its log again. */
  onWeightChanged: () => void;
}) {
  const t = useT();
  const [load, setLoad] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<Tracking | null>(null);
  const [range, setRange] = useState<Range>("week");
  const [editOn, setEditOn] = useState(TODAY);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetchTracking(token).then((result) => {
      if (!active) return;

      if (result.state === "ok") {
        setData({ log: result.log, progress: result.progress, targets: result.targets });
        setLoad("ready");
      } else {
        setLoad("error");
      }
    });

    return () => {
      active = false;
    };
  }, [token, attempt]);

  if (load === "loading") {
    return (
      <section className={card}>
        <p role="status" className="text-sm text-white/55">
          {t("nut.loading")}
        </p>
      </section>
    );
  }

  if (load === "error" || !data) {
    return (
      <section
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300"
      >
        <span>{t("nut.error")}</span>

        <button
          type="button"
          onClick={() => {
            setLoad("loading");
            setAttempt((n) => n + 1);
          }}
          className="rounded-full border border-white/15 px-4 py-2 uppercase tracking-[0.12em] text-white/80 transition hover:border-white/40"
        >
          <span className="text-[10px] font-black">{t("nut.retry")}</span>
        </button>
      </section>
    );
  }

  const { log, progress, targets } = data;

  function saved(next: { log: DailyEntry[]; progress: Progress }) {
    const weightMoved =
      JSON.stringify(next.progress.entries) !==
      JSON.stringify(progress.entries);

    setData({ log: next.log, progress: next.progress, targets });

    if (weightMoved) onWeightChanged();
  }

  function edit(on: string) {
    setEditOn(on);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section aria-labelledby="nutrition-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="nutrition-title"
          className="text-lg font-black uppercase tracking-wide text-white"
        >
          {t("nut.title")}
        </h2>

        <p className="text-xs text-white/45">{formatDate(TODAY)}</p>
      </div>

      <TodayCard
        today={log.find((entry) => entry.on === TODAY) ?? null}
        weightToday={progress.entries.find((entry) => entry.on === TODAY)?.grams ?? null}
        targets={targets}
      />

      <div ref={formRef} className="scroll-mt-6">
        <DayForm
          key={editOn}
          token={token}
          on={editOn}
          onDate={setEditOn}
          entry={log.find((entry) => entry.on === editOn) ?? null}
          weighIn={progress.entries.find((entry) => entry.on === editOn)?.grams ?? null}
          onSaved={saved}
        />
      </div>

      <RangeView
        range={range}
        onRange={setRange}
        log={log}
        progress={progress}
        targets={targets}
      />

      {log.length > 0 && (
        <RecentDays
          token={token}
          log={log}
          progress={progress}
          onEdit={edit}
          onSaved={saved}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

function percentOf(value: number | null, target: number | null) {
  return value === null || !target ? null : (value / target) * 100;
}

function TodayCard({
  today,
  weightToday,
  targets,
}: {
  today: DailyEntry | null;
  weightToday: number | null;
  targets: Targets;
}) {
  const t = useT();
  const noTarget = t("nut.noTarget");

  const amount = (value: number | null | undefined, unit: string, scale = 1) =>
    value === null || value === undefined
      ? ""
      : `${scale === 1 ? formatCount(value) : fromUnits(value, scale)} ${unit}`.trim();

  return (
    <div className={card}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">
        {t("nut.today")}
      </h3>

      {!today && weightToday === null && (
        <p className="mt-3 text-sm leading-6 text-white/55">{t("nut.todayEmpty")}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Meter
          label={t("nut.calories")}
          value={today?.caloriesKcal != null ? formatCount(today.caloriesKcal) : ""}
          target={amount(targets.caloriesKcal, t("nut.kcal"))}
          percent={percentOf(today?.caloriesKcal ?? null, targets.caloriesKcal)}
          noTarget={noTarget}
        />
        <Meter
          label={t("nut.protein")}
          value={today?.proteinG != null ? formatCount(today.proteinG) : ""}
          target={amount(targets.proteinG, t("nut.g"))}
          percent={percentOf(today?.proteinG ?? null, targets.proteinG)}
          noTarget={noTarget}
        />
        <Meter
          label={t("nut.water")}
          value={today?.waterMl != null ? fromUnits(today.waterMl, 1000) : ""}
          target={amount(targets.waterMl, t("nut.l"), 1000)}
          percent={percentOf(today?.waterMl ?? null, targets.waterMl)}
          noTarget={noTarget}
        />
        <Meter
          label={t("nut.steps")}
          value={today?.steps != null ? formatCount(today.steps) : ""}
          target={amount(targets.steps, "")}
          percent={percentOf(today?.steps ?? null, targets.steps)}
          noTarget={noTarget}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t("nut.workout"),
            value:
              today?.workout === true
                ? t("nut.workoutYes")
                : today?.workout === false
                  ? t("nut.workoutNo")
                  : "",
            gold: today?.workout === true,
          },
          {
            label: t("nut.sleep"),
            value:
              today?.sleepMin != null
                ? `${fromUnits(today.sleepMin, 60)} ${t("nut.h")}`
                : "",
          },
          {
            label: t("nut.energy"),
            value: today?.energy != null ? `${today.energy}/10` : "",
          },
          {
            label: t("nut.weight"),
            value: weightToday !== null ? `${formatKg(weightToday)} ${t("nut.kg")}` : "",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4"
          >
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
              {item.label}
            </dt>
            <dd
              className={`mt-2 text-lg font-black ${
                item.gold ? "text-[#d4af37]" : item.value ? "text-white" : "text-white/30"
              }`}
            >
              {item.value || t("nut.notLogged")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The form                                                            */
/* ------------------------------------------------------------------ */

type Fields = Record<
  "caloriesKcal" | "proteinG" | "water" | "steps" | "weight" | "waist" | "sleep",
  string
>;

/** How each box maps onto what is stored. */
const BOXES: {
  key: keyof Fields;
  field: NumericField | "weight";
  label: StringKey;
  scale: number;
  decimal: boolean;
}[] = [
  { key: "caloriesKcal", field: "caloriesKcal", label: "nut.caloriesLabel", scale: 1, decimal: false },
  { key: "proteinG", field: "proteinG", label: "nut.proteinLabel", scale: 1, decimal: false },
  { key: "water", field: "waterMl", label: "nut.waterLabel", scale: 1000, decimal: true },
  { key: "steps", field: "steps", label: "nut.stepsLabel", scale: 1, decimal: false },
  { key: "weight", field: "weight", label: "nut.weightLabel", scale: 1000, decimal: true },
  { key: "waist", field: "waistMm", label: "nut.waistLabel", scale: 10, decimal: true },
  { key: "sleep", field: "sleepMin", label: "nut.sleepLabel", scale: 60, decimal: true },
];

function DayForm({
  token,
  on,
  onDate,
  entry,
  weighIn,
  onSaved,
}: {
  token: string;
  on: string;
  onDate: (on: string) => void;
  entry: DailyEntry | null;
  weighIn: number | null;
  onSaved: (next: { log: DailyEntry[]; progress: Progress }) => void;
}) {
  const t = useT();

  // Opens filled in with what is already logged for that day, so saving
  // updates the day rather than wiping what isn't on screen.
  const [fields, setFields] = useState<Fields>(() => ({
    caloriesKcal: entry?.caloriesKcal != null ? String(entry.caloriesKcal) : "",
    proteinG: entry?.proteinG != null ? String(entry.proteinG) : "",
    water: fromUnits(entry?.waterMl ?? null, 1000),
    steps: entry?.steps != null ? String(entry.steps) : "",
    weight: weighIn !== null ? formatKg(weighIn) : "",
    waist: fromUnits(entry?.waistMm ?? null, 10),
    sleep: fromUnits(entry?.sleepMin ?? null, 60),
  }));
  const [workout, setWorkout] = useState<boolean | null>(entry?.workout ?? null);
  const [energy, setEnergy] = useState<number | null>(entry?.energy ?? null);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function touch() {
    setSaved(false);
    setSubmitError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!isValidDate(on)) return setSubmitError(t("prog.err.date"));

    const found: Partial<Record<keyof Fields, string>> = {};
    const values: Partial<Record<NumericField, number | null>> = {};
    let weightGrams: number | null = null;

    for (const box of BOXES) {
      const text = fields[box.key];
      const label = t(box.label);

      if (box.field === "weight") {
        if (!text.trim()) continue;

        weightGrams = parseKg(text);

        if (!isValidWeight(weightGrams)) found.weight = t("prog.err.weight");
        continue;
      }

      // "2,5" litres is a decimal comma; "1,850" kcal is a thousands
      // separator — whole-number boxes drop it.
      const value = box.decimal
        ? toUnits(text, box.scale)
        : toUnits(text.replace(/[,\s]/g, ""), box.scale);

      if (value !== null && Number.isNaN(value)) {
        found[box.key] = t("nut.err.number").replace("{field}", label);
        continue;
      }

      const { min, max } = LIMITS[box.field];

      if (value !== null && (value < min || value > max)) {
        found[box.key] = t("nut.err.range").replace("{field}", label);
        continue;
      }

      values[box.field] = value;
    }

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setSubmitError("");

    const result = await saveDay(token, {
      on,
      caloriesKcal: values.caloriesKcal ?? null,
      proteinG: values.proteinG ?? null,
      waterMl: values.waterMl ?? null,
      steps: values.steps ?? null,
      waistMm: values.waistMm ?? null,
      sleepMin: values.sleepMin ?? null,
      workout,
      energy,
      notes: notes.trim(),
      weightGrams,
    });

    setSaving(false);

    if (!result.ok) return setSubmitError(result.message);

    onSaved(result);
    setSaved(true);
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className={card}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
          <Icon name="plus" className="h-4 w-4 text-[#d4af37]" />
          {t("nut.logTitle")}
        </h3>

        <div className="w-full sm:w-48">
          <label htmlFor="day-date" className={labelClass}>
            {t("nut.date")}
          </label>

          <input
            id="day-date"
            type="date"
            max={TODAY}
            value={on}
            onChange={(event) => {
              if (event.target.value) onDate(event.target.value);
            }}
            className={fieldClass}
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/45">
        {on !== TODAY
          ? t("nut.editing").replace("{date}", formatDate(on))
          : t("nut.optional")}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4">
        {BOXES.map((box) => (
          <div key={box.key} className="min-w-0">
            <label htmlFor={`day-${box.key}`} className={labelClass}>
              {t(box.label)}
            </label>

            <input
              id={`day-${box.key}`}
              inputMode={box.decimal ? "decimal" : "numeric"}
              autoComplete="off"
              maxLength={8}
              value={fields[box.key]}
              aria-invalid={Boolean(errors[box.key])}
              aria-describedby={errors[box.key] ? `day-${box.key}-error` : undefined}
              onChange={(event) => {
                const value = event.target.value;
                setFields((prev) => ({ ...prev, [box.key]: value }));
                setErrors((prev) => ({ ...prev, [box.key]: undefined }));
                touch();
              }}
              className={fieldClass}
            />

            {errors[box.key] && (
              <p
                id={`day-${box.key}-error`}
                className="mt-1.5 text-[11px] font-semibold text-red-300"
              >
                {errors[box.key]}
              </p>
            )}
          </div>
        ))}

        <fieldset className="min-w-0">
          <legend className={labelClass}>{t("nut.workoutLabel")}</legend>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: t("nut.yes") },
              { value: false, label: t("nut.no") },
            ].map((option) => {
              const active = workout === option.value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setWorkout(active ? null : option.value);
                    touch();
                  }}
                  className={`rounded-xl border py-3 uppercase tracking-[0.12em] transition ${
                    active
                      ? "border-[#d4af37] bg-[#d4af37] text-black"
                      : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/30"
                  }`}
                >
                  <span className="text-xs font-black">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <fieldset className="mt-5">
        <legend className={labelClass}>{t("nut.energyLabel")}</legend>

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => {
            const active = energy === level;

            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                aria-label={`${t("nut.energy")} ${level}`}
                onClick={() => {
                  setEnergy(active ? null : level);
                  touch();
                }}
                className={`rounded-xl border py-2.5 transition ${
                  active
                    ? "border-[#d4af37] bg-[#d4af37] text-black"
                    : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/30"
                }`}
              >
                <span className="text-sm font-black">{level}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="day-notes" className={labelClass}>
          {t("nut.notesLabel")}
        </label>

        <textarea
          id="day-notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            touch();
          }}
          placeholder={t("nut.notesPh")}
          className={`${fieldClass} resize-y`}
        />
      </div>

      {submitError && (
        <p role="alert" className="mt-4 text-xs font-semibold text-red-300">
          {submitError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={`${goldButton} w-full sm:w-auto`}>
          <span className="text-xs font-black">
            {saving ? t("nut.saving") : t("nut.save")}
          </span>
        </button>

        {saved && (
          <span role="status" className="text-xs font-bold text-[#7ddba0]">
            {t("nut.saved")}
          </span>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* The week or the month                                               */
/* ------------------------------------------------------------------ */

function RangeView({
  range,
  onRange,
  log,
  progress,
  targets,
}: {
  range: Range;
  onRange: (range: Range) => void;
  log: DailyEntry[];
  progress: Progress;
  targets: Targets;
}) {
  const t = useT();
  const dates = useMemo(() => rangeDates(range, TODAY), [range]);
  const from = dates[0];
  const to = dates[dates.length - 1];

  const summary = summarize(log, progress.entries, from, to);
  const strip = workoutDays(log, dates);

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label={t("nut.rangeLabel")}
        className="inline-flex rounded-full border border-white/12 bg-white/[0.03] p-1"
      >
        {(["week", "month"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={range === option}
            onClick={() => onRange(option)}
            className={`rounded-full px-5 py-2 uppercase tracking-[0.12em] transition ${
              range === option ? "bg-[#d4af37] text-black" : "text-white/60 hover:text-white"
            }`}
          >
            <span className="text-[11px] font-black">
              {t(option === "week" ? "nut.week" : "nut.month")}
            </span>
          </button>
        ))}
      </div>

      <SummaryCard
        title={t(range === "week" ? "nut.summary.week" : "nut.summary.month")}
        summary={summary}
        days={RANGE_DAYS[range]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title={t("nut.chartWeight")}
          points={series(
            progress.entries.map((entry) => ({ on: entry.on, value: entry.grams })),
            from,
            to,
          )}
          from={from}
          to={to}
          format={formatKg}
          unit={t("nut.kg")}
          minSpan={2_000}
          empty={t("nut.noData")}
          target={targets.weightGrams}
        />

        <TrendChart
          title={t("nut.chartWaist")}
          points={series(
            log.map((entry) => ({ on: entry.on, value: entry.waistMm })),
            from,
            to,
          )}
          from={from}
          to={to}
          format={(mm) => fromUnits(mm, 10)}
          unit={t("nut.cm")}
          minSpan={20}
          empty={t("nut.noData")}
          target={targets.waistMm}
        />
      </div>

      <WorkoutStrip
        title={t("nut.chartWorkouts")}
        days={strip}
        labels={{
          yes: t("nut.workoutYes"),
          no: t("nut.workoutNo"),
          none: t("nut.notLogged"),
          summary: t("nut.workoutsOf")
            .replace("{done}", String(summary.workoutsDone))
            .replace("{total}", String(summary.workoutsAnswered)),
        }}
      />
    </div>
  );
}

function SummaryCard({
  title,
  summary,
  days,
}: {
  title: string;
  summary: ReturnType<typeof summarize>;
  days: number;
}) {
  const t = useT();

  const avg = (value: number | null, unit: string, scale = 1) =>
    value === null
      ? "—"
      : `${scale === 1 ? formatCount(value) : fromUnits(Math.round(value), scale)} ${unit}`;

  const move = (
    change: { from: number; to: number } | null,
    format: (value: number) => string,
    unit: string,
  ) =>
    change === null
      ? "—"
      : change.from === change.to
        ? `${format(change.to)} ${unit}`
        : `${format(change.from)} → ${format(change.to)} ${unit}`;

  const rows = [
    { label: t("nut.avgCalories"), value: avg(summary.caloriesKcal, t("nut.kcal")) },
    { label: t("nut.avgProtein"), value: avg(summary.proteinG, t("nut.g")) },
    { label: t("nut.avgWater"), value: avg(summary.waterMl, t("nut.l"), 1000) },
    {
      label: t("nut.avgSteps"),
      value:
        summary.steps === null
          ? "—"
          : `${formatCount(summary.steps)}${t("nut.perDay")}`,
    },
    { label: t("nut.avgSleep"), value: avg(summary.sleepMin, t("nut.h"), 60) },
    {
      label: t("nut.workouts"),
      value: `${summary.workoutsDone}/${summary.workoutsAnswered}`,
    },
    {
      label: t("nut.weightChange"),
      value: move(summary.weight, formatKg, t("nut.kg")),
      foot:
        summary.weight && summary.weight.from !== summary.weight.to
          ? `${formatDeltaKg(summary.weight.to - summary.weight.from)} ${t("nut.kg")}`
          : "",
    },
    {
      label: t("nut.waistChange"),
      value: move(summary.waist, (mm) => fromUnits(mm, 10), t("nut.cm")),
    },
  ];

  return (
    <div className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-white">
          {title}
        </h3>

        <p className="text-xs text-white/45">
          {t("nut.daysLogged")
            .replace("{count}", String(summary.daysLogged))
            .replace("{days}", String(days))}
        </p>
      </div>

      {summary.daysLogged === 0 && !summary.weight ? (
        <p className="mt-4 text-sm text-white/45">{t("nut.noData")}</p>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {row.label}
              </dt>
              <dd className="mt-1.5 break-words text-sm font-black text-white">
                {row.value}
              </dd>
              {row.foot && (
                <p className="mt-0.5 text-[11px] font-bold text-[#e8c05a]">
                  {row.foot}
                </p>
              )}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent days                                                         */
/* ------------------------------------------------------------------ */

function RecentDays({
  token,
  log,
  progress,
  onEdit,
  onSaved,
}: {
  token: string;
  log: DailyEntry[];
  progress: Progress;
  onEdit: (on: string) => void;
  onSaved: (next: { log: DailyEntry[]; progress: Progress }) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const weights = new Map(progress.entries.map((entry) => [entry.on, entry.grams]));

  async function remove(on: string) {
    if (!window.confirm(t("nut.deleteConfirm").replace("{date}", formatDate(on)))) {
      return;
    }

    setBusy(on);
    setError("");

    const result = await deleteDay(token, on);

    setBusy("");

    if (result.ok) onSaved(result);
    else setError(result.message);
  }

  return (
    <section className={card}>
      <h3 className="text-sm font-black uppercase tracking-wide text-white">
        {t("nut.recent")}
      </h3>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-3 divide-y divide-white/[0.06]">
        {log.slice(0, 10).map((day) => {
          const weight = weights.get(day.on);
          const bits = [
            day.caloriesKcal !== null ? `${formatCount(day.caloriesKcal)} ${t("nut.kcal")}` : "",
            day.proteinG !== null ? `${day.proteinG} ${t("nut.g")} ${t("nut.protein").toLowerCase()}` : "",
            day.waterMl !== null ? `${fromUnits(day.waterMl, 1000)} ${t("nut.l")}` : "",
            day.steps !== null ? `${formatCount(day.steps)} ${t("nut.stepsUnit")}` : "",
            weight !== undefined ? `${formatKg(weight)} ${t("nut.kg")}` : "",
            day.workout === true ? t("nut.workoutYes") : day.workout === false ? t("nut.workoutNo") : "",
          ].filter(Boolean);

          return (
            <li key={day.on} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
              <span className="w-28 shrink-0 text-xs font-bold text-white/60">
                {formatDate(day.on)}
              </span>

              <span className="order-last w-full min-w-0 text-xs leading-5 text-white/55 sm:order-none sm:w-auto sm:flex-1">
                {bits.join(" · ") || "—"}
                {day.notes && (
                  <span className="block break-words text-white/35">{day.notes}</span>
                )}
              </span>

              <span className="ml-auto flex gap-4">
                <button
                  type="button"
                  onClick={() => onEdit(day.on)}
                  className="uppercase tracking-[0.12em] text-[#e8c05a] transition hover:text-white"
                >
                  <span className="text-[10px] font-black">{t("nut.edit")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void remove(day.on)}
                  disabled={busy === day.on}
                  className="uppercase tracking-[0.12em] text-white/40 transition hover:text-red-300 disabled:opacity-50"
                >
                  <span className="text-[10px] font-black">{t("nut.delete")}</span>
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
