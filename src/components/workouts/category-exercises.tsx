"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EQUIPMENT,
  MUSCLE_NAMES,
  getCategory,
  isPendingReview,
  type CategorySlug,
  type Difficulty,
  type EquipmentId,
  type Exercise,
  type Muscle,
  type WorkoutModeId,
} from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { CategoryArt, accentVars } from "@/components/workouts/category-style";
import ExerciseCard from "@/components/workouts/exercise-card";
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_TEXT,
  DIFFICULTY_TEXT,
  MODE_SHORT,
  MODE_TEXT,
} from "@/components/workouts/labels";
import { useLang, useT, type StringKey } from "@/lib/i18n";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
type Kit = "none" | "household";

/**
 * /workouts/<mode>/<category>: one body part's published exercises, with a
 * hero, filters drawn only from what these exercises actually record, and
 * a card grid. The page passes in only what the catalogue publishes.
 */
export default function CategoryExercises({
  modeId,
  categorySlug,
  exercises,
}: {
  modeId: WorkoutModeId;
  categorySlug: CategorySlug;
  exercises: readonly Exercise[];
}) {
  const t = useT();
  const lang = useLang();
  const category = getCategory(modeId, categorySlug);

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [target, setTarget] = useState<Muscle | null>(null);
  const [equipment, setEquipment] = useState<EquipmentId | Kit | null>(null);

  const facets = useMemo(() => buildFacets(modeId, exercises), [modeId, exercises]);

  if (!category) return null;

  const modeName = t(MODE_TEXT[modeId].name);
  const allPending = exercises.length > 0 && exercises.every(isPendingReview);

  const shown = exercises.filter(
    (exercise) =>
      (!difficulty || exercise.difficulty === difficulty) &&
      (!target || exercise.primaryMuscles.includes(target)) &&
      (!equipment || matchesEquipment(exercise, equipment)),
  );
  const filtering = Boolean(difficulty || target || equipment);
  const groups = groupFor(categorySlug, exercises, shown);
  const count = exercises.length;

  return (
    <div style={accentVars(category.slug)} className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-6">
      <Link
        href={`/workouts/${modeId}`}
        className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
      >
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("wk.backTo").replace("{name}", modeName)}
      </Link>

      {/* Hero */}
      <section
        aria-labelledby="category-title"
        className="relative mt-6 grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(150deg,#141311_0%,#0a0a09_60%)] md:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <p
            data-testid="mode-label"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]"
          >
            <Icon name={MODE_TEXT[modeId].icon} className="h-4 w-4" />
            {t(MODE_SHORT[modeId])}
          </p>

          <h1
            id="category-title"
            className="mt-5 text-4xl font-black uppercase italic leading-[0.92] tracking-tight [text-wrap:balance] sm:text-5xl lg:text-6xl"
          >
            {t(CATEGORY_TEXT[category.slug])}
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">{t(CATEGORY_DESCRIPTION[category.slug])}</p>

          {count > 0 && (
            <p className="mt-6 text-sm font-semibold text-white/80 [font-variant-numeric:tabular-nums]">
              <span className="text-2xl font-black text-[color:var(--accent)]">{count}</span>{" "}
              {count === 1 ? t("wk.count.one").replace("1", "").trim() : t("wk.count.many").replace("{count}", "").trim()}
            </p>
          )}

          {allPending && <p className="mt-2 text-sm text-white/55">{t("wk.allPending")}</p>}
          {lang !== "en" && count > 0 && <p className="mt-2 text-sm text-white/45">{t("wk.englishOnly")}</p>}
        </div>

        {/* The glow lives on the panel, not in the artwork, so it fills the panel at any width. */}
        <div className="relative order-first h-36 border-b border-white/10 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)] md:order-none md:h-auto md:border-b-0 md:border-l">
          <CategoryArt slug={category.slug} className="absolute inset-0 h-full w-full" />
        </div>
      </section>

      {count === 0 ? (
        <div data-testid="exercises-empty" className="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
          <h2 className="text-lg font-extrabold">{t("wk.empty.title")}</h2>
          <p className="mt-2 text-white/60">{t("wk.empty.text")}</p>
        </div>
      ) : (
        <>
          {facets.some((facet) => facet.options.length > 1) && (
            <section aria-label={t("wk.filter.label")} data-testid="filters" className="mt-8 grid gap-4">
              {facets.map((facet) =>
                facet.options.length > 1 ? (
                  <FilterRow
                    key={facet.id}
                    id={facet.id}
                    label={t(facet.label)}
                    allLabel={t("wk.filter.all")}
                    options={facet.options.map((option) => ({
                      value: option.value,
                      label: option.labelKey ? t(option.labelKey) : option.label ?? "",
                      english: !option.labelKey,
                    }))}
                    selected={facet.id === "difficulty" ? difficulty : facet.id === "target" ? target : equipment}
                    onSelect={(value) => {
                      if (facet.id === "difficulty") setDifficulty(value as Difficulty | null);
                      else if (facet.id === "target") setTarget(value as Muscle | null);
                      else setEquipment(value as EquipmentId | Kit | null);
                    }}
                  />
                ) : null,
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                <p aria-live="polite" data-testid="filter-status" className="[font-variant-numeric:tabular-nums]">
                  {t("wk.filter.showing").replace("{shown}", String(shown.length)).replace("{total}", String(count))}
                </p>
                {filtering && (
                  <button
                    type="button"
                    data-testid="filter-clear"
                    onClick={() => {
                      setDifficulty(null);
                      setTarget(null);
                      setEquipment(null);
                    }}
                    className="rounded-md font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
                  >
                    {t("wk.filter.clear")}
                  </button>
                )}
              </div>
            </section>
          )}

          <div data-testid="exercise-list" className="mt-6 grid gap-10">
            {shown.length === 0 && (
              <p data-testid="filter-empty" className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 text-white/70">
                {t("wk.filter.empty")}
              </p>
            )}

            {groups.map((group) =>
              group.items.length ? (
                <section key={group.key} aria-labelledby={group.titleKey ? `group-${group.key}` : undefined}>
                  {group.titleKey && (
                    <h2
                      id={`group-${group.key}`}
                      className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--accent)]"
                    >
                      {t(group.titleKey)}
                      <span aria-hidden className="h-px flex-1 bg-white/10" />
                    </h2>
                  )}
                  <ul className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((exercise) => (
                      <li key={exercise.slug}>
                        <ExerciseCard exercise={exercise} showPending={!allPending} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

type Option = { value: string; labelKey?: StringKey; label?: string };
type Facet = { id: "difficulty" | "target" | "equipment"; label: StringKey; options: Option[] };

/** Only the values these exercises actually have, most common first. */
function buildFacets(modeId: WorkoutModeId, exercises: readonly Exercise[]): Facet[] {
  const difficulty = DIFFICULTIES.filter((level) => exercises.some((exercise) => exercise.difficulty === level));

  const targetCounts = new Map<Muscle, number>();
  for (const exercise of exercises) {
    for (const muscle of exercise.primaryMuscles) targetCounts.set(muscle, (targetCounts.get(muscle) ?? 0) + 1);
  }
  const targets = [...targetCounts.entries()].sort((a, b) => b[1] - a[1]).map(([muscle]) => muscle);

  let equipment: Option[];
  if (modeId === "equipment") {
    const counts = new Map<EquipmentId, number>();
    for (const exercise of exercises) for (const id of exercise.equipment) counts.set(id, (counts.get(id) ?? 0) + 1);
    equipment = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ value: id, label: EQUIPMENT[id].name }));
  } else {
    const kits: Kit[] = ["none", "household"];
    equipment = kits
      .filter((kit) => exercises.some((exercise) => matchesEquipment(exercise, kit)))
      .map((kit) => ({ value: kit, labelKey: kit === "none" ? "wk.filter.nothingNeeded" : "wk.filter.household" }));
  }

  return [
    { id: "difficulty", label: "wk.fact.difficulty", options: difficulty.map((level) => ({ value: level, labelKey: DIFFICULTY_TEXT[level] })) },
    { id: "target", label: "wk.filter.target", options: targets.map((muscle) => ({ value: muscle, label: MUSCLE_NAMES[muscle] })) },
    { id: "equipment", label: "wk.fact.equipment", options: equipment },
  ];
}

function matchesEquipment(exercise: Exercise, value: EquipmentId | Kit) {
  if (value === "none") return exercise.equipment.length === 0;
  if (value === "household") return exercise.equipment.some((id) => EQUIPMENT[id].kind === "household");
  return exercise.equipment.includes(value);
}

function FilterRow({
  id,
  label,
  allLabel,
  options,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string; english: boolean }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
      active
        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
        : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/35 hover:text-white"
    }`;

  return (
    <div role="group" aria-labelledby={`filter-${id}`} data-testid={`filter-${id}`} className="flex flex-wrap items-center gap-2">
      <span id={`filter-${id}`} className="mr-1 w-full text-[11px] font-bold uppercase tracking-[0.22em] text-white/45 sm:w-24">
        {label}
      </span>
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)} className={chip(selected === null)}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.english ? "en" : undefined}
          aria-pressed={selected === option.value}
          data-value={option.value}
          onClick={() => onSelect(selected === option.value ? null : option.value)}
          className={chip(selected === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

type Group = { key: string; titleKey?: StringKey; items: Exercise[] };

/**
 * Arms are shown in Biceps and Triceps sections when this category has
 * both; every other category is one grid. Based on each exercise's
 * recorded target muscles only.
 */
function groupFor(slug: CategorySlug, all: readonly Exercise[], shown: Exercise[]): Group[] {
  if (slug === "biceps-triceps" || slug === "arms") {
    const isBiceps = (exercise: Exercise) => exercise.primaryMuscles.includes("biceps");
    const isTriceps = (exercise: Exercise) => !isBiceps(exercise) && exercise.primaryMuscles.includes("triceps");
    if (all.some(isBiceps) && all.some(isTriceps)) {
      const rest = shown.filter((exercise) => !isBiceps(exercise) && !isTriceps(exercise));
      return [
        { key: "biceps", titleKey: "wk.group.biceps", items: shown.filter(isBiceps) },
        { key: "triceps", titleKey: "wk.group.triceps", items: shown.filter(isTriceps) },
        { key: "other", items: rest },
      ];
    }
  }
  return [{ key: "all", items: shown }];
}
