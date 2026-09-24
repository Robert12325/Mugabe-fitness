"use client";

import { useEffect } from "react";
import {
  htmlLang,
  setLang,
  useLang,
  useT,
  type Lang,
  type StringKey,
} from "@/lib/i18n";

const OPTIONS: { id: Lang; label: StringKey }[] = [
  { id: "en", label: "lang.en" },
  { id: "hi", label: "lang.hi" },
  { id: "hinglish", label: "lang.hinglish" },
];

/**
 * EN / हिं / Hinglish. Hinglish is the same Hindi in Roman letters, for
 * the many people who speak Hindi but read it faster this way.
 *
 * Also keeps `<html lang>` honest, which decides the Devanagari font and
 * tells screen readers which language to speak.
 */
export default function LanguageSwitch({
  className = "",
}: {
  className?: string;
}) {
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
  }, [lang]);

  return (
    <div
      role="radiogroup"
      aria-label={t("lang.switch")}
      className={`inline-flex items-center rounded-full border border-white/20 p-0.5 ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = lang === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            lang={htmlLang(option.id)}
            onClick={() => setLang(option.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
              active
                ? "bg-[#f5c518] text-black"
                : "text-white/65 hover:text-white"
            }`}
          >
            {t(option.label)}
          </button>
        );
      })}
    </div>
  );
}
