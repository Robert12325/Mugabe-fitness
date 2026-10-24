"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import BrandMark from "@/components/brand-mark";
import LanguageSwitch from "@/components/language-switch";
import { getSession, getSessionOnServer, subscribeSession } from "@/lib/account-client";
import { useT } from "@/lib/i18n";
import { useDB } from "@/lib/use-store";

/**
 * Header for the workout pages: the brand back to the home page, the
 * language switch and the account link. The home page's navbar uses
 * in-page anchors, which would go nowhere from here.
 *
 * The account link reads the same session as the home page's navbar: "Log
 * in" until someone is signed in on this browser, then "My account". The
 * server renders "Log in", as the navbar does.
 */
export default function WorkoutsHeader() {
  const t = useT();
  const { settings } = useDB();
  const tagline = settings.tagline.trim() || "Rise. Grind. Shine.";
  const session = useSyncExternalStore(subscribeSession, getSession, getSessionOnServer);

  return (
    <header className="relative z-20 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-5 sm:flex-nowrap sm:px-6 lg:py-7">
      <Link href="/" aria-label={t("auth.home")} className="flex shrink-0 items-center gap-3">
        <BrandMark className="h-10 w-10 sm:h-12 sm:w-12" />

        <span className="leading-none">
          <span className="block text-xl font-extrabold tracking-[0.08em] text-white sm:text-2xl">
            MUGABE
          </span>

          <span className="mt-1.5 block text-[10px] font-semibold tracking-[0.55em] text-[#e0b54a] sm:text-xs">
            FITNESS
          </span>
        </span>
      </Link>

      <p className="hidden items-center gap-4 text-xs font-semibold uppercase italic tracking-[0.3em] text-[#e0b54a] lg:flex">
        <span aria-hidden className="h-px w-16 bg-[#e0b54a]/70" />
        {tagline}
      </p>

      {/* On phones the brand and account link share the first row and the
          language switch takes a row of its own; from 640px it's one row. */}
      <div className="contents sm:flex sm:items-center sm:gap-4">
        <div className="order-last basis-full sm:order-none sm:basis-auto">
          <LanguageSwitch />
        </div>

        <Link
          href="/account"
          data-testid="workouts-account-link"
          className="shrink-0 whitespace-nowrap text-sm font-semibold text-white/75 transition hover:text-white"
        >
          {session ? t("nav.account") : t("nav.login")}
        </Link>
      </div>
    </header>
  );
}
