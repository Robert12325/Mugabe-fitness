"use client";

import { useEffect } from "react";
import { setLang, useLang, useT, type Lang } from "@/lib/i18n";

const OPTIONS: Lang[] = ["en", "hi"];

/**
 * EN / हिं toggle. Also keeps `<html lang>` honest, which decides the
 * Devanagari font and tells screen readers which language to speak.
 */
export default function LanguageSwitch({
  className = "",
}: {
  className?: string;
}) {
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div
      role="radiogroup"
      aria-label={t("lang.switch")}
      className={`inline-flex items-center rounded-full border border-white/20 p-0.5 ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = lang === option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            lang={option}
            onClick={() => setLang(option)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              active
                ? "bg-[#f5c518] text-black"
                : "text-white/65 hover:text-white"
            }`}
          >
            {option === "en" ? t("lang.en") : t("lang.hi")}
          </button>
        );
      })}
    </div>
  );
}
