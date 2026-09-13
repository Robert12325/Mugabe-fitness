"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import LeadsPanel from "@/components/admin/leads-panel";
import MethodPanel from "@/components/admin/method-panel";
import Overview from "@/components/admin/overview";
import PaymentsPanel from "@/components/admin/payments-panel";
import ProgramsPanel from "@/components/admin/programs-panel";
import SettingsPanel from "@/components/admin/settings-panel";
import {
  getUnlocked,
  getUnlockedOnServer,
  setUnlocked,
  subscribeUnlock,
} from "@/components/admin/session";
import { inputClass } from "@/components/admin/ui";
import { TODAY } from "@/lib/billing";
import { useDB } from "@/lib/use-store";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Enquiries" },
  { id: "payments", label: "Payments" },
  { id: "programs", label: "Programs" },
  { id: "method", label: "Method" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const db = useDB();
  const [tab, setTab] = useState<TabId>("overview");

  const unlocked = useSyncExternalStore(
    subscribeUnlock,
    getUnlocked,
    getUnlockedOnServer,
  );

  if (!unlocked) {
    return (
      <Gate
        expected={db.settings.adminPasscode}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  const newCount = db.leads.filter((lead) => lead.status === "new").length;

  const overdueCount = db.payments.filter(
    (payment) => payment.state === "pending" && payment.dueDate < TODAY,
  ).length;

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-5">
          <div>
            <div className="text-base font-black tracking-[0.2em] text-white">
              {db.settings.brandName}
            </div>

            <div className="text-[9px] font-bold tracking-[0.45em] text-[#d4af37]">
              ADMIN
            </div>
          </div>

          {newCount > 0 && (
            <span className="rounded-full border border-[#e7c65c]/35 bg-[#ad8b2b]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#e7c65c]">
              {newCount} new
            </span>
          )}

          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setTab("payments")}
              className="rounded-full border border-[#f0928c]/40 bg-[#c0453d]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#f0928c] transition hover:bg-[#c0453d]/25"
            >
              {overdueCount} overdue
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white"
            >
              View site
            </Link>

            <button
              type="button"
              onClick={() => setUnlocked(false)}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white"
            >
              Lock
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                tab === item.id
                  ? "bg-[#d4af37] text-black"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-8">
        {tab === "overview" && <Overview />}
        {tab === "leads" && <LeadsPanel />}
        {tab === "payments" && <PaymentsPanel />}
        {tab === "programs" && <ProgramsPanel />}
        {tab === "method" && <MethodPanel />}
        {tab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}

function Gate({
  expected,
  onUnlock,
}: {
  expected: string;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (value === expected) {
      onUnlock();
      return;
    }

    setError(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b0b] p-8"
      >
        <div className="text-lg font-black tracking-[0.2em] text-white">
          MUGABE
        </div>

        <div className="text-[9px] font-bold tracking-[0.45em] text-[#d4af37]">
          ADMIN
        </div>

        <label
          htmlFor="passcode"
          className="mb-2 mt-8 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35"
        >
          Passcode
        </label>

        <input
          id="passcode"
          type="password"
          autoFocus
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(false);
          }}
          className={inputClass}
        />

        {error && (
          <p className="mt-3 text-xs font-semibold text-red-400">
            Incorrect passcode.
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
        >
          Unlock
        </button>

        <p className="mt-6 text-[11px] leading-6 text-white/25">
          Default passcode is <span className="text-white/50">mugabe</span>.
          This gate only hides the screen — all data lives in this browser, so
          it is not real security.
        </p>
      </form>
    </div>
  );
}
