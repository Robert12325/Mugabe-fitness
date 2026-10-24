"use client";

import Link from "next/link";
import { getMode, type CategorySlug, type WorkoutModeId } from "@mugabe/fitness-content";
import Icon from "@/components/icons";
import { CATEGORY_TEXT, MODE_TEXT } from "@/components/workouts/labels";
import { useT } from "@/lib/i18n";

/**
 * /workouts/<mode>: that mode's body-part categories, each with how many
 * published exercises it holds (counted on the server).
 */
export default function ModeCategories({
  modeId,
  counts,
}: {
  modeId: WorkoutModeId;
  counts: Partial<Record<CategorySlug, number>>;
}) {
  const t = useT();
  const mode = getMode(modeId);

  if (!mode) return null;

  const text = MODE_TEXT[mode.id];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-6">
      <Link
        href="/workouts"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
      >
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("wk.back")}
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e0b54a]/40 bg-[#e0b54a]/10 text-[#f3c969]">
          <Icon name={text.icon} className="h-6 w-6" />
        </span>

        <h1 className="text-3xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
          {t(text.name)}
        </h1>
      </div>

      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">{t(text.summary)}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
        <span className="font-bold text-[#e0b54a]">{t("wk.youNeed")}: </span>
        {t(text.kit)}
      </p>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">
        {t("wk.categories")}
      </h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="category-list">
        {mode.categories.map((category) => {
          const count = counts[category.slug] ?? 0;

          return (
            <li key={category.slug}>
              <Link
                href={`/workouts/${mode.id}/${category.slug}`}
                data-testid={`category-${category.slug}`}
                className="group flex h-full min-h-28 flex-col justify-between rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 transition hover:border-[#e0b54a]/60"
              >
                <span className="text-lg font-extrabold uppercase italic">
                  {t(CATEGORY_TEXT[category.slug])}
                </span>

                <span
                  className={`mt-4 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                    count ? "text-[#f3c969]" : "text-white/45"
                  }`}
                >
                  {count === 0
                    ? t("wk.comingSoon")
                    : count === 1
                      ? t("wk.count.one")
                      : t("wk.count.many").replace("{count}", String(count))}
                  <Icon
                    name="arrowRight"
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-white/50">{t("wk.reviewNote")}</p>
    </div>
  );
}
