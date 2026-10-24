"use client";

import Link from "next/link";
import { MODES } from "@mugabe/fitness-content";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon from "@/components/icons";
import { CATEGORY_TEXT, MODE_TEXT } from "@/components/workouts/labels";
import { useT } from "@/lib/i18n";

/** /workouts: the two workout modes, side by side from tablet width up. */
export default function ModeChooser() {
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">
        {t("wk.eyebrow")}
      </p>

      <h1 className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
        {t("wk.title")}
      </h1>

      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">{t("wk.lede")}</p>

      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {MODES.map((mode) => {
          const text = MODE_TEXT[mode.id];

          return (
            <li key={mode.id}>
              <Link
                href={`/workouts/${mode.id}`}
                data-testid={`mode-${mode.id}`}
                className={`${goldCardClass} group flex h-full flex-col p-6 transition hover:border-[#e0b54a]/70 sm:p-8`}
              >
                <GoldCardGlow />

                <span className="relative flex h-full flex-col">
                  <span className="flex items-center justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e0b54a]/40 bg-[#e0b54a]/10 text-[#f3c969]">
                      <Icon name={text.icon} className="h-6 w-6" />
                    </span>

                    <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                      {t("wk.free")}
                    </span>
                  </span>

                  <span className="mt-6 block text-2xl font-black uppercase italic leading-tight sm:text-3xl">
                    {t(text.name)}
                  </span>

                  <span className="mt-3 block text-white/70">{t(text.summary)}</span>

                  <span className="mt-5 block text-xs font-bold uppercase tracking-[0.25em] text-[#e0b54a]">
                    {t("wk.youNeed")}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-white/60">{t(text.kit)}</span>

                  <span className="mt-6 flex flex-wrap gap-2">
                    {mode.categories.map((category) => (
                      <span
                        key={category.slug}
                        className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/75"
                      >
                        {t(CATEGORY_TEXT[category.slug])}
                      </span>
                    ))}
                  </span>

                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[#f3c969]">
                    {t("wk.open")}
                    <Icon
                      name="arrowRight"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
