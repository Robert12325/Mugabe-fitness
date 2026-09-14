"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import Marquee from "@/components/motion/marquee";
import {
  getSession,
  getSessionOnServer,
  subscribeSession,
} from "@/lib/account-client";

const TICKER = [
  "Strength",
  "Discipline",
  "Performance",
  "Transformation",
  "Consistency",
  "Accountability",
];

const links = [
  { label: "Home", href: "#home" },
  { label: "Programs", href: "#programs" },
  { label: "Method", href: "#method" },
  { label: "Coach", href: "#coach" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const session = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSessionOnServer,
  );

  const accountLabel = session
    ? session.user.name.split(" ")[0] || "Account"
    : "Log in";

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6 lg:h-20 lg:px-8">
        <a href="#home" onClick={closeMenu} className="shrink-0">
          <div className="text-base font-black tracking-[0.2em] text-white sm:text-lg">
            MUGABE
          </div>

          <div className="text-[8px] font-bold tracking-[0.45em] text-[#d4af37] sm:text-[9px]">
            FITNESS
          </div>
        </a>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 md:flex lg:gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/60 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <Link
            href="/account"
            className="max-w-[9rem] truncate rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[#d4af37] hover:text-white"
          >
            {accountLabel}
          </Link>

          <a
            href="#programs"
            className="rounded-full bg-[#d4af37] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white"
          >
            Start Training
          </a>
        </div>

        {/* Mobile button */}
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#d4af37] md:hidden"
        >
          <span className="text-xl leading-none">
            {open ? "×" : "☰"}
          </span>
        </button>
      </nav>

      {/* Mobile navigation */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-black transition-all duration-300 md:hidden ${
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 py-5">
          <div className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}

            <Link
              href="/account"
              onClick={closeMenu}
              className="border-b border-white/10 py-4 text-sm font-semibold text-white/70 transition hover:text-white"
            >
              {session ? "My account" : "Log in"}
            </Link>

            <a
              href="#programs"
              onClick={closeMenu}
              className="mt-5 rounded-full bg-[#d4af37] px-5 py-4 text-center text-xs font-black uppercase tracking-wider text-black"
            >
              Start Training
            </a>
          </div>
        </div>
      </div>

      <Marquee items={TICKER} compact />
    </header>
  );
}
