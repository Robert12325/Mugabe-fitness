"use client";

import { useId } from "react";
import { daysBetween } from "@/lib/daily";

/**
 * Small, dependency-free charts shared by the client dashboard and the
 * coach's view. They take their words as props, so the client's side can
 * be translated and the admin's stays in English.
 *
 * Numbers are only shown against what the coach set. Going over or under a
 * target is drawn the same way: these are records, not verdicts.
 */

/* ------------------------------------------------------------------ */
/* One amount against its target                                       */
/* ------------------------------------------------------------------ */

export function Meter({
  label,
  value,
  target,
  percent,
  noTarget,
}: {
  label: string;
  /** e.g. "1,850" — or "" when nothing is logged. */
  value: string;
  /** e.g. "2,000 kcal" — or "" when the coach set none. */
  target: string;
  /** 0-100+, or null when either side is missing. */
  percent: number | null;
  /** Shown in place of the target when the coach hasn't set one. */
  noTarget: string;
}) {
  const width = percent === null ? 0 : Math.min(100, Math.max(0, percent));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>

      <p className="mt-2 text-xl font-black tracking-tight text-white">
        {value || "—"}
      </p>

      {/* Its own line, so it never wraps halfway on a narrow phone. */}
      <p className="text-xs font-bold text-white/40">/ {target || noTarget}</p>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent === null ? undefined : Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#b88420,#f6d27a)] transition-[width] duration-700"
          style={{ width: `${width}%` }}
        />
      </div>

      {percent !== null && (
        <p className="mt-1.5 text-[11px] text-white/40">{Math.round(percent)}%</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A value over a range of days                                        */
/* ------------------------------------------------------------------ */

/**
 * Days sit at their real position in the range, so a gap in logging shows
 * as a gap rather than being squeezed out. The y scale is padded by at
 * least `minSpan`, so a steady week reads as a gentle line, not noise.
 */
export function TrendChart({
  title,
  points,
  from,
  to,
  format,
  unit,
  minSpan,
  empty,
  target,
}: {
  title: string;
  points: { on: string; value: number }[];
  from: string;
  to: string;
  format: (value: number) => string;
  unit: string;
  minSpan: number;
  empty: string;
  /** Drawn as a dashed line when the coach set one. */
  target?: number | null;
}) {
  const gradient = useId();
  const total = Math.max(1, daysBetween(from, to));

  if (points.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
          {title}
        </h3>

        <p className="mt-6 pb-4 text-center text-xs text-white/40">{empty}</p>
      </section>
    );
  }

  const values = points.map((point) => point.value);
  const withTarget = target ? [...values, target] : values;
  const low = Math.min(...withTarget);
  const high = Math.max(...withTarget);
  const span = Math.max(high - low, minSpan);
  const floor = (low + high) / 2 - span / 2;

  // Kept off the very edges, so a stroke at the top or bottom isn't cut.
  const y = (value: number) => 92 - ((value - floor) / span) * 84;
  const x = (on: string) => (daysBetween(from, on) / total) * 100;

  const line = points.map((point) => `${x(point.on)},${y(point.value)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
          {title}
        </h3>

        <p className="text-sm font-black text-white">
          {format(first.value)}
          {points.length > 1 && <> → {format(last.value)}</>}
          <span className="ml-1 text-[11px] font-bold text-white/40">{unit}</span>
        </p>
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}: ${format(first.value)} → ${format(last.value)} ${unit}`}
        className="mt-4 h-32 w-full sm:h-40"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4af37" stopOpacity="0.24" />
            <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>

        {target ? (
          <line
            x1="0"
            x2="100"
            y1={y(target)}
            y2={y(target)}
            stroke="rgba(255,255,255,0.3)"
            strokeDasharray="2 2"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {points.length > 1 && (
          <>
            <polygon
              points={`${x(first.on)},100 ${line} ${x(last.on)},100`}
              fill={`url(#${gradient})`}
            />

            <polyline
              points={line}
              fill="none"
              stroke="#f6d27a"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {points.map((point) => (
          // A zero-length round-capped line draws a dot that stays round
          // when the box stretches; a circle would turn into an ellipse.
          <line
            key={point.on}
            x1={x(point.on)}
            x2={x(point.on)}
            y1={y(point.value)}
            y2={y(point.value)}
            stroke="#f6d27a"
            strokeWidth={6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-white/35">
        <span>{shortDay(from)}</span>
        <span>{shortDay(to)}</span>
      </div>
    </section>
  );
}

function shortDay(on: string) {
  const [year, month, day] = on.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/* Which days they trained                                             */
/* ------------------------------------------------------------------ */

export function WorkoutStrip({
  title,
  days,
  labels,
}: {
  title: string;
  days: { on: string; workout: boolean | null }[];
  labels: { yes: string; no: string; none: string; summary: string };
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
          {title}
        </h3>

        <p className="text-sm font-black text-white">{labels.summary}</p>
      </div>

      {/* Capped, so a wide screen gets a tidy row of days rather than
          seven slabs. */}
      <ol
        className={`mt-4 grid max-w-md gap-1.5 ${
          days.length > 7 ? "grid-cols-10" : "grid-cols-7"
        }`}
      >
        {days.map((day) => (
          <li
            key={day.on}
            title={`${shortDay(day.on)}: ${
              day.workout === true
                ? labels.yes
                : day.workout === false
                  ? labels.no
                  : labels.none
            }`}
            className={`flex aspect-square items-center justify-center rounded-md text-[10px] font-black ${
              day.workout === true
                ? "bg-[linear-gradient(145deg,#f6d27a,#c98f28)] text-black"
                : day.workout === false
                  ? "border border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]"
                  : "border border-white/10 bg-white/[0.03] text-white/25"
            }`}
          >
            <span aria-hidden>
              {day.workout === true ? "✓" : day.workout === false ? "×" : ""}
            </span>
            <span className="sr-only">
              {shortDay(day.on)}:{" "}
              {day.workout === true
                ? labels.yes
                : day.workout === false
                  ? labels.no
                  : labels.none}
            </span>
          </li>
        ))}
      </ol>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/45">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[#d4af37]" />
          {labels.yes}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm border border-[#f0928c]/60" />
          {labels.no}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm border border-white/20" />
          {labels.none}
        </li>
      </ul>
    </section>
  );
}
