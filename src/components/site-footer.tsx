"use client";

import Link from "next/link";
import { useDB } from "@/lib/use-store";

export default function SiteFooter() {
  const { settings } = useDB();

  return (
    <footer className="bg-black px-6 py-10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="font-black tracking-[0.2em] text-white">
            {settings.brandName}
          </div>

          <div className="text-[9px] font-bold tracking-[0.45em] text-[#d4af37]">
            {settings.brandSuffix}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/admin"
            className="text-xs font-semibold text-white/55 transition hover:text-[#d4af37]"
          >
            Admin
          </Link>

          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} {settings.brandName}{" "}
            {settings.brandSuffix}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
