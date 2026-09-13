"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
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
import {
  loadEnquiries,
  signIn,
  signOut,
  type LoadResult,
  type ServerState,
} from "@/lib/enquiries-client";
import { replaceLeads } from "@/lib/store";
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
  const [server, setServer] = useState<ServerState>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const unlocked = useSyncExternalStore(
    subscribeUnlock,
    getUnlocked,
    getUnlockedOnServer,
  );

  // The server holds the real enquiries. Writing them into the local store
  // means every panel that already reads `db.leads` (overview stats, the
  // "new" badge, counts) shows them without changes of its own.
  const apply = useCallback((result: LoadResult) => {
    if (result.state === "online") {
      replaceLeads(result.enquiries);
      setServer("online");
    } else if (result.state === "unauthorized") {
      // Session expired or was cleared in another tab: ask again.
      setUnlocked(false);
    } else {
      setServer(result.state);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    let active = true;

    const load = () => {
      loadEnquiries().then((result) => {
        if (active) apply(result);
      });
    };

    load();

    // Coming back to the tab picks up requests sent while it was hidden.
    window.addEventListener("focus", load);

    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, [unlocked, apply]);

  const refresh = useCallback(() => {
    setRefreshing(true);

    loadEnquiries()
      .then(apply)
      .finally(() => setRefreshing(false));
  }, [apply]);

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
            <button
              type="button"
              onClick={() => setTab("leads")}
              className="rounded-full border border-[#e7c65c]/35 bg-[#ad8b2b]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#e7c65c] transition hover:bg-[#ad8b2b]/25"
            >
              {newCount} new
            </button>
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
              onClick={() => {
                void signOut();
                setUnlocked(false);
              }}
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
        {tab === "leads" && (
          <LeadsPanel
            server={server}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        )}
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || !value) return;

    setBusy(true);
    setError("");

    const result = await signIn(value);

    setBusy(false);

    if (result === "ok") {
      onUnlock();
      return;
    }

    if (result === "wrong") {
      setError("Incorrect password.");
      return;
    }

    if (result === "rate") {
      setError("Too many attempts. Try again in a few minutes.");
      return;
    }

    // No admin password on the server yet (local development, or the Vercel
    // setup is unfinished). This browser's passcode opens the dashboard, but
    // the server keeps refusing enquiry data until it is configured.
    if (value === expected) {
      onUnlock();
      return;
    }

    setError("Incorrect password.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <form
        onSubmit={(event) => void submit(event)}
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
          className="mb-2 mt-8 block text-[10px] font-black uppercase tracking-[0.2em] text-white/45"
        >
          Password
        </label>

        <input
          id="passcode"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          className={inputClass}
        />

        {error && (
          <p role="alert" className="mt-3 text-xs font-semibold text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>

        <p className="mt-6 text-[11px] leading-6 text-white/35">
          Coach access only.
        </p>
      </form>
    </div>
  );
}
