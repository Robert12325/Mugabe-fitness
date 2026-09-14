"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import BrandMark from "@/components/brand-mark";
import {
  getSession,
  getSessionOnServer,
  subscribeSession,
} from "@/lib/account-client";

const links = [
  { label: "Home", id: "home" },
  { label: "Programs", id: "programs" },
  { label: "Method", id: "method" },
  { label: "Coach", id: "coach" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  const session = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSessionOnServer,
  );

  const accountLabel = session
    ? session.user.name.split(" ")[0] || "Account"
    : "Log in";

  // Underline the link for whichever section crosses the middle of the
  // screen. Sections without a link leave the last one underlined.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    for (const link of links) {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 font-[family-name:var(--font-display)] backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:h-[5.5rem] lg:px-8">
        <a
          href="#home"
          onClick={closeMenu}
          aria-label="Mugabe Fitness home"
          className="flex shrink-0 items-center gap-3"
        >
          <BrandMark tone="yellow" className="h-10 w-10 lg:h-12 lg:w-12" />

          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-[0.08em] text-white lg:text-2xl">
              MUGABE
            </span>

            <span className="mt-1.5 block text-[9px] font-bold tracking-[0.6em] text-[#f5c518] lg:text-[11px]">
              FITNESS
            </span>
          </span>
        </a>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 lg:flex xl:gap-11">
          {links.map((link) => {
            const current = active === link.id;

            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={current ? "true" : undefined}
                className={`relative py-2 text-[15px] font-medium transition ${
                  current ? "text-white" : "text-white/75 hover:text-white"
                }`}
              >
                {link.label}

                <span
                  aria-hidden
                  className={`absolute -bottom-1.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-[#f5c518] transition-all duration-300 ${
                    current ? "w-[calc(100%+0.75rem)] opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/account"
            className="max-w-[9rem] truncate text-[15px] font-medium text-white/75 transition hover:text-white"
          >
            {accountLabel}
          </Link>

          <a
            href="#programs"
            className="group inline-flex items-center gap-2.5 rounded-full bg-[#f5c518] px-7 py-3.5 text-[15px] font-bold text-black transition hover:bg-[#ffd84a]"
          >
            Start Training
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Mobile button */}
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-[#f5c518] lg:hidden"
        >
          <span className="text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </nav>

      {/* Mobile navigation */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-black transition-all duration-300 lg:hidden ${
          open ? "max-h-[30rem] opacity-100" : "max-h-0 border-t-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-5 py-4 sm:px-6">
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={closeMenu}
              aria-current={active === link.id ? "true" : undefined}
              className={`flex items-center justify-between border-b border-white/10 py-4 text-sm font-semibold transition ${
                active === link.id ? "text-[#f5c518]" : "text-white/75 hover:text-white"
              }`}
            >
              {link.label}
              {active === link.id && (
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f5c518]" />
              )}
            </a>
          ))}

          <Link
            href="/account"
            onClick={closeMenu}
            className="border-b border-white/10 py-4 text-sm font-semibold text-white/75 transition hover:text-white"
          >
            {session ? "My account" : "Log in"}
          </Link>

          <a
            href="#programs"
            onClick={closeMenu}
            className="mt-5 inline-flex items-center justify-center gap-2.5 rounded-full bg-[#f5c518] px-5 py-4 text-sm font-bold text-black"
          >
            Start Training
            <ArrowIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
