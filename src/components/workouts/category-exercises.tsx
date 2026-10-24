"use client";

import Link from "next/link";
import {
  equipmentNames,
  formatPrescription,
  getCategory,
  type CategorySlug,
  type Exercise,
  type WorkoutModeId,
} from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { CATEGORY_TEXT, DIFFICULTY_TEXT, MODE_TEXT, formatWords } from "@/components/workouts/labels";
import { useLang, useT } from "@/lib/i18n";

/**
 * /workouts/<mode>/<category>: the published exercises of one body part.
 * The page passes in only what the catalogue publishes.
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
  const words = formatWords(t);

  if (!category) return null;

  const modeName = t(MODE_TEXT[modeId].name);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-6">
      <Link
        href={`/workouts/${modeId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
      >
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("wk.backTo").replace("{name}", modeName)}
      </Link>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">{modeName}</p>
      <h1 className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
        {t(CATEGORY_TEXT[category.slug])}
      </h1>

      {exercises.length === 0 ? (
        <div
          data-testid="exercises-empty"
          className="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f0f] p-6"
        >
          <h2 className="text-lg font-extrabold">{t("wk.empty.title")}</h2>
          <p className="mt-2 text-white/60">{t("wk.empty.text")}</p>
        </div>
      ) : (
        <>
          {lang !== "en" && <p className="mt-4 text-sm text-white/50">{t("wk.englishOnly")}</p>}

          <ul className="mt-8 grid gap-4 md:grid-cols-2" data-testid="exercise-list">
            {exercises.map((exercise) => {
              const equipment = equipmentNames(exercise);

              return (
                <li key={exercise.slug}>
                  <Link
                    href={`/workouts/${modeId}/exercises/${exercise.slug}`}
                    data-testid={`exercise-${exercise.slug}`}
                    className="group flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 transition hover:border-[#e0b54a]/60"
                  >
                    <span className="flex-1">
                      <span lang="en" className="block text-lg font-extrabold">
                        {exercise.name}
                      </span>
                      <span className="mt-1 block text-sm text-white/65">
                        {formatPrescription(exercise.prescription, words)} · {t(DIFFICULTY_TEXT[exercise.difficulty])}
                      </span>
                      <span className="mt-1 block text-sm text-white/45">
                        {equipment.length ? (
                          <>
                            {t("wk.needs")}: <span lang="en">{equipment.join(", ")}</span>
                          </>
                        ) : (
                          t("wk.noEquipment")
                        )}
                      </span>
                    </span>
                    <Icon
                      name="arrowRight"
                      className="h-5 w-5 text-[#f3c969] transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
