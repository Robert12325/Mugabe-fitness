"use client";

import Link from "next/link";
import {
  EQUIPMENT,
  MUSCLE_NAMES,
  formatPrescription,
  isPendingReview,
  type Difficulty,
  type Exercise,
} from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { DIFFICULTY_TEXT, formatWords } from "@/components/workouts/labels";
import { useT } from "@/lib/i18n";

const LEVEL: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

/**
 * One exercise in a category's grid. The whole card is one link, so it is
 * one stop for keyboard users. Everything shown comes from the catalogue:
 * target muscles, difficulty, the amount, and the equipment it needs.
 */
export default function ExerciseCard({
  exercise,
  showPending,
}: {
  exercise: Exercise;
  /** Mark it as awaiting review; off when the page already says so for all. */
  showPending: boolean;
}) {
  const t = useT();
  const words = formatWords(t);
  const level = LEVEL[exercise.difficulty];
  const timed = exercise.prescription.kind === "time";
  const household = exercise.equipment.filter((id) => EQUIPMENT[id].kind === "household");

  return (
    <Link
      href={`/workouts/${exercise.mode}/exercises/${exercise.slug}`}
      data-testid={`exercise-${exercise.slug}`}
      className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#151412,#0b0b0a)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] transition-colors hover:border-[color:var(--accent)] focus-visible:border-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
          <span aria-hidden className="flex gap-0.5">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 w-1.5 rounded-full ${dot <= level ? "bg-[color:var(--accent)]" : "bg-white/20"}`}
              />
            ))}
          </span>
          {t(DIFFICULTY_TEXT[exercise.difficulty])}
        </span>

        {timed && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {t("wk.card.timed")}
          </span>
        )}

        {showPending && isPendingReview(exercise) && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/55 ring-1 ring-inset ring-white/12">
            {t("wk.card.pending")}
          </span>
        )}
      </span>

      <span lang="en" className="mt-4 block text-xl font-extrabold leading-tight">
        {exercise.name}
      </span>

      <span lang="en" className="mt-1.5 block text-sm text-white/60">
        {exercise.primaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(" · ")}
      </span>

      <dl className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-sm">
        <div>
          <dt className="sr-only">{t(timed ? "wk.fact.duration" : "wk.fact.setsReps")}</dt>
          <dd className="flex items-start gap-2.5 font-semibold text-white/90 [font-variant-numeric:tabular-nums]">
            <Icon name={timed ? "clock" : "chart"} className="mt-0.5 h-4 w-4 text-[color:var(--accent)]" />
            {formatPrescription(exercise.prescription, words)}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t("wk.fact.equipment")}</dt>
          <dd className={`flex items-start gap-2.5 ${household.length ? "text-white/85" : "text-white/60"}`}>
            <Icon name="dumbbell" className="mt-0.5 h-4 w-4 text-[color:var(--accent)]" />
            <span>
            {exercise.equipment.length ? (
              <>
                {household.length > 0 && <span className="font-semibold">{t("wk.needs")}: </span>}
                <span lang="en">{exercise.equipment.map((id) => EQUIPMENT[id].name).join(", ")}</span>
              </>
            ) : (
              t("wk.noEquipment")
            )}
            </span>
          </dd>
        </div>
      </dl>

      <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-[color:var(--accent)]">
        {t("wk.card.open")}
        <Icon name="arrowRight" className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
