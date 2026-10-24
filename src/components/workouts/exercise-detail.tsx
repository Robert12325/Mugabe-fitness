"use client";

import Link from "next/link";
import {
  MUSCLE_NAMES,
  equipmentNames,
  formatPrescription,
  formatRest,
  isPendingReview,
  type Exercise,
} from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { CATEGORY_TEXT, DIFFICULTY_TEXT, MODE_TEXT, formatWords } from "@/components/workouts/labels";
import { useLang, useT, type StringKey } from "@/lib/i18n";

/**
 * /workouts/<mode>/exercises/<slug>: how to do one published exercise.
 * Labels follow the visitor's language; the instructions themselves are
 * English for now, and marked as such for screen readers.
 */
export default function ExerciseDetail({
  exercise,
  alternatives,
}: {
  exercise: Exercise;
  alternatives: readonly Pick<Exercise, "slug" | "name">[];
}) {
  const t = useT();
  const lang = useLang();
  const words = formatWords(t);
  const equipment = equipmentNames(exercise);
  const home = exercise.categories[0];

  const facts: [label: StringKey, value: string, english: boolean][] = [
    ["wk.fact.difficulty", t(DIFFICULTY_TEXT[exercise.difficulty]), false],
    [
      exercise.prescription.kind === "time" ? "wk.fact.duration" : "wk.fact.setsReps",
      formatPrescription(exercise.prescription, words),
      false,
    ],
    ["wk.fact.rest", formatRest(exercise.restSeconds, words), false],
    ["wk.fact.equipment", equipment.length ? equipment.join(", ") : t("wk.noneNeeded"), equipment.length > 0],
  ];

  return (
    <article className="mx-auto max-w-4xl px-5 pb-20 pt-6 sm:px-6">
      <Link
        href={`/workouts/${exercise.mode}/${home}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
      >
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("wk.backTo").replace("{name}", t(CATEGORY_TEXT[home]))}
      </Link>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">
        {t(MODE_TEXT[exercise.mode].name)} · {exercise.categories.map((slug) => t(CATEGORY_TEXT[slug])).join(", ")}
      </p>
      <h1 lang="en" className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
        {exercise.name}
      </h1>

      {isPendingReview(exercise) && (
        <p
          data-testid="pending-review"
          className="mt-5 max-w-2xl rounded-xl border border-[#e0b54a]/40 bg-[#e0b54a]/10 px-4 py-3 text-sm text-[#f3c969]"
        >
          {t("wk.pendingReview")}
        </p>
      )}

      {lang !== "en" && <p className="mt-4 text-sm text-white/50">{t("wk.englishOnly")}</p>}

      <div
        data-testid="exercise-demo"
        className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-[#e0b54a]/30 bg-[#100d05] px-6 py-10 text-center"
      >
        <Icon name="video" className="h-7 w-7 text-[#f3c969]" />
        <p className="font-bold">{t("wk.demoSoon")}</p>
        <p className="text-sm text-white/60">
          {exercise.demo.kind === "diagram" ? <span lang="en">{exercise.demo.alt}</span> : t("wk.demoNote")}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map(([label, value, english]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
            <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{t(label)}</dt>
            <dd lang={english ? "en" : undefined} className="mt-1 font-bold">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <Section title={t("wk.sec.muscles")}>
        <p lang="en" className="text-white/75">
          {exercise.primaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
        </p>
        {exercise.secondaryMuscles.length > 0 && (
          <p className="mt-1 text-sm text-white/50">
            {t("wk.alsoWorks")}:{" "}
            <span lang="en">{exercise.secondaryMuscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}</span>
          </p>
        )}
      </Section>

      <Section title={t("wk.sec.steps")}>
        {/* A real ordered list, so screen readers announce "1 of 5". */}
        <ol lang="en" className="list-decimal space-y-3 pl-6 text-white/75 marker:font-bold marker:text-[#f3c969]">
          {exercise.steps.map((step, index) => (
            <li key={index} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t("wk.sec.breathing")}>
        <Bullets lines={exercise.breathing} />
      </Section>

      {exercise.tips.length > 0 && (
        <Section title={t("wk.sec.tips")}>
          <Bullets lines={exercise.tips} />
        </Section>
      )}

      <Section title={t("wk.sec.mistakes")}>
        <Bullets lines={exercise.mistakes} />
      </Section>

      {alternatives.length > 0 && (
        <Section title={t("wk.sec.alternatives")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {alternatives.map((alternative) => (
              <li key={alternative.slug}>
                <Link
                  href={`/workouts/${exercise.mode}/exercises/${alternative.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 font-bold transition hover:border-[#e0b54a]/60"
                >
                  <span lang="en">{alternative.name}</span>
                  <Icon
                    name="arrowRight"
                    className="h-4 w-4 text-[#f3c969] transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#e0b54a]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ lines }: { lines: readonly string[] }) {
  return (
    <ul lang="en" className="space-y-2">
      {lines.map((line, index) => (
        <li key={index} className="flex gap-3 text-white/75">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3c969]" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
