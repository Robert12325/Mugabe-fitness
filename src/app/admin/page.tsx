"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import Icon, { type IconName } from "@/components/icons";
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
import { BrandLockup, Btn, IconTile } from "@/components/admin/ui";
import { TODAY } from "@/lib/billing";
import {
  refreshBilling,
  startBillingSync,
  stopBillingSync,
} from "@/lib/billing-sync";
import {
  refreshContentSync,
  startContentSync,
  stopContentSync,
} from "@/lib/site-content-sync";
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
  { id: "overview", label: "Overview", icon: "home" },
  { id: "leads", label: "Enquiries", icon: "users" },
  { id: "payments", label: "Payments", icon: "card" },
  { id: "programs", label: "Programs", icon: "calendar" },
  { id: "method", label: "Method", icon: "dumbbell" },
  { id: "settings", label: "Settings", icon: "gear" },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

type TabId = (typeof TABS)[number]["id"];

type Alert = { count: number; label: string; tone: "gold" | "amber" | "red" };

const ALERT_TONE = {
  gold: "bg-[#d4af37] text-black",
  amber: "bg-amber-300 text-black",
  red: "bg-[#f0928c] text-black",
};

// Labels show on phones-to-tablets and on wide screens. On laptops (xl up to
// 1600px) the six tabs need the room, so the buttons shrink to icons.
const headerButton =
  "inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white/85 transition hover:border-white/35 hover:text-white sm:h-12 sm:px-6 xl:px-4 min-[1600px]:px-6";

const headerButtonLabel = "hidden sm:inline xl:hidden min-[1600px]:inline";

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
    void startBillingSync(() => setUnlocked(false));
    void startContentSync(() => setUnlocked(false));

    // Returning to the tab picks up enquiries and payment changes made on
    // other devices while it was hidden.
    const onFocus = () => {
      load();
      refreshBilling();
      refreshContentSync();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      stopBillingSync();
      stopContentSync();
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

  const verifyCount = db.leads.filter(
    (lead) => lead.payment.status === "submitted",
  ).length;

  const overdueCount = db.payments.filter(
    (payment) => payment.state === "pending" && payment.dueDate < TODAY,
  ).length;

  // What needs attention, shown on the tab it lives under.
  const alerts: Partial<Record<TabId, Alert[]>> = {
    leads: [
      { count: newCount, label: "new", tone: "gold" },
      { count: verifyCount, label: "to verify", tone: "amber" },
    ],
    payments: [{ count: overdueCount, label: "overdue", tone: "red" }],
  };

  const alertsFor = (id: TabId) =>
    (alerts[id] ?? []).filter((alert) => alert.count > 0);

  const describe = (id: TabId, label: string) =>
    [label, ...alertsFor(id).map((a) => `${a.count} ${a.label}`)].join(", ");

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#050505] text-white">
      <Backdrop />

      <header className="relative z-20 border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="flex min-h-[4.5rem] items-center gap-4 px-4 sm:min-h-[5.5rem] sm:gap-6 sm:px-8 xl:min-h-[6.5rem] xl:gap-5 min-[1600px]:gap-8">
          <BrandLockup
            name={db.settings.brandName}
            suffix={db.settings.brandSuffix}
          />

          <span aria-hidden className="hidden h-10 w-px bg-white/10 xl:block" />

          <nav
            aria-label="Admin sections"
            className="hidden min-w-0 self-stretch xl:flex"
          >
            {TABS.map((item) => {
              const active = tab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-label={describe(item.id, item.label)}
                  onClick={() => setTab(item.id)}
                  className={`relative flex shrink-0 items-center gap-2 px-3 text-[15px] font-semibold transition min-[1600px]:gap-2.5 min-[1600px]:px-5 min-[1600px]:text-base min-[1800px]:gap-3 min-[1800px]:px-6 min-[1800px]:text-[17px] ${
                    active
                      ? "bg-[linear-gradient(180deg,transparent,rgba(212,175,55,0.12))] text-[#f0c93f]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} solid={active} className="h-5 w-5" />
                  {item.label}

                  {alertsFor(item.id).map((alert) => (
                    <span
                      key={alert.label}
                      aria-hidden
                      className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black leading-none ${ALERT_TONE[alert.tone]}`}
                    >
                      {alert.count}
                    </span>
                  ))}

                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[#d4af37] shadow-[0_0_16px_2px_rgba(212,175,55,0.6)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/" className={headerButton} aria-label="View site">
              <Icon name="eye" className="h-5 w-5" />
              <span className={headerButtonLabel}>View Site</span>
            </Link>

            <button
              type="button"
              aria-label="Lock"
              onClick={() => {
                void signOut();
                setUnlocked(false);
              }}
              className={headerButton}
            >
              <Icon name="lock" className="h-5 w-5" />
              <span className={headerButtonLabel}>Lock</span>
            </button>
          </div>
        </div>

        {/* Phones: the sections get their own scrolling row. */}
        <nav
          aria-label="Admin sections"
          className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            const count = alertsFor(item.id).reduce((n, a) => n + a.count, 0);

            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-label={describe(item.id, item.label)}
                onClick={(event) => {
                  setTab(item.id);
                  // The row scrolls sideways; keep the chosen tab in view.
                  event.currentTarget.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                    behavior: "smooth",
                  });
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                  active
                    ? "bg-[#d4af37] text-black"
                    : "border border-white/10 text-white/65"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
                {count > 0 && (
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-black" : "bg-[#d4af37]"}`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="relative z-10 flex">
        <aside className="sticky top-0 hidden h-screen w-[5.5rem] shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-white/10 bg-black/40 py-6 md:flex">
          {TABS.map((item) => {
            const active = tab === item.id;
            const flagged = alertsFor(item.id).length > 0;

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-current={active ? "page" : undefined}
                aria-label={describe(item.id, item.label)}
                onClick={() => setTab(item.id)}
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition ${
                  active
                    ? "border border-[#d4af37]/25 bg-[linear-gradient(145deg,#2c2309,#100d05)] text-[#eac55a] shadow-[0_12px_30px_-12px_rgba(212,175,55,0.5)]"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon name={item.icon} solid={active} className="h-6 w-6" />

                {flagged && (
                  <span
                    aria-hidden
                    className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#d4af37] ring-2 ring-[#050505]"
                  />
                )}
              </button>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-11">
          <div className="mx-auto max-w-[100rem]">
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
          </div>
        </main>
      </div>
    </div>
  );
}

/** The soft gold light and brushed gold slashes behind the dashboard. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(55rem_35rem_at_92%_0%,rgba(212,175,55,0.09),transparent_70%),radial-gradient(40rem_28rem_at_0%_100%,rgba(212,175,55,0.07),transparent_70%)]" />

      {/* On phones the slashes would cut across the stacked cards. */}
      <div className="hidden md:block">
        <div className="absolute -right-20 top-44 h-5 w-80 -rotate-45 bg-gradient-to-r from-transparent via-[#b18a24] to-[#f6da80] opacity-80" />
        <div className="absolute -right-12 top-64 h-1.5 w-60 -rotate-45 bg-gradient-to-r from-transparent to-[#d4af37]/60" />

        <div className="absolute -left-24 bottom-28 h-6 w-80 -rotate-45 bg-gradient-to-r from-[#f6da80] via-[#b18a24] to-transparent opacity-80" />
        <div className="absolute -left-14 bottom-10 h-1.5 w-64 -rotate-45 bg-gradient-to-r from-[#d4af37]/60 to-transparent" />
      </div>
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
  const db = useDB();
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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-[#050505] px-4">
      <Backdrop />

      <form
        onSubmit={(event) => void submit(event)}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#121212,#0a0a0a)] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-10"
      >
        <BrandLockup
          name={db.settings.brandName}
          suffix={db.settings.brandSuffix}
        />

        <h1 className="mt-10 text-2xl font-black uppercase tracking-tight text-white">
          Admin <span className="text-[#f0c93f]">access</span>
        </h1>

        <p className="mt-1.5 text-sm text-white/55">Coach access only.</p>

        <label className="mt-7 flex cursor-text items-center gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] py-3 pl-3 pr-4 transition focus-within:border-[#d4af37]/55 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]">
          <IconTile icon="shield" />

          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Password
            </span>

            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              className="mt-1 w-full bg-transparent text-base text-white outline-none"
            />
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-400">
            {error}
          </p>
        )}

        <div className="mt-7 [&>button]:w-full">
          <Btn type="submit" variant="gold" icon="lock" disabled={busy}>
            {busy ? "Checking…" : "Unlock"}
          </Btn>
        </div>
      </form>
    </div>
  );
}
