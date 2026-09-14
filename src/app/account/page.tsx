"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { inputClass, labelClass } from "@/components/form-classes";
import PaymentStep from "@/components/payment-step";
import {
  parseCredentials,
  parseRegistration,
  PASSWORD_MIN,
  type AccountBooking,
} from "@/lib/account";
import {
  fetchAccount,
  getSession,
  getSessionOnServer,
  logIn,
  logOut,
  register,
  subscribeSession,
  type AccountLoad,
  type Session,
} from "@/lib/account-client";
import { parseMoney } from "@/lib/billing";
import {
  getChosenPlan,
  getChosenPlanOnServer,
  subscribeChosenPlan,
} from "@/lib/chosen-plan";
import {
  fetchPaymentSettings,
  type PaymentSettingsLoad,
} from "@/lib/payment-client";
import type { EnquiryPaymentStatus, Program } from "@/lib/types";
import { useDB } from "@/lib/use-store";

const subscribeNothing = () => () => {};

const BOOKING_STATUS: Record<
  EnquiryPaymentStatus,
  { label: string; badge: string; action: string }
> = {
  none: {
    label: "Payment due",
    badge: "border-white/20 bg-white/5 text-white/70",
    action: "Pay now",
  },
  submitted: {
    label: "Under review",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
    action: "View status",
  },
  verified: {
    label: "Confirmed",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
    action: "View",
  },
  rejected: {
    label: "Payment rejected",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
    action: "Pay again",
  },
};

function formatDate(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AccountPage() {
  const session = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSessionOnServer,
  );

  // Who is signed in lives only in this browser, so the server can't render
  // it. Waiting for hydration avoids flashing the log-in form at someone
  // who is already signed in.
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const router = useRouter();

  const plan = useSyncExternalStore(
    subscribeChosenPlan,
    getChosenPlan,
    getChosenPlanOnServer,
  );

  // Sent here by choosing a plan: once signed in, carry on to the booking
  // form, which picks the plan up and continues to payment as usual.
  const continuing = Boolean(session && plan);

  useEffect(() => {
    if (continuing) router.push("/#contact");
  }, [continuing, router]);

  return (
    <main className="min-h-screen bg-black">
      <header className="border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <Link href="/" className="shrink-0">
            <div className="text-base font-black tracking-[0.2em] text-white sm:text-lg">
              MUGABE
            </div>

            <div className="text-[8px] font-bold tracking-[0.45em] text-[#d4af37] sm:text-[9px]">
              FITNESS
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
        {!hydrated ? null : continuing ? (
          <p role="status" className="text-center text-sm text-white/55">
            Taking you to your booking…
          </p>
        ) : session ? (
          <Dashboard key={session.token} session={session} />
        ) : (
          <AuthPanel planId={plan?.programId ?? ""} />
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Log in / create account                                             */
/* ------------------------------------------------------------------ */

type Mode = "login" | "register";

const EMPTY_FIELDS = { name: "", email: "", phone: "", password: "" };

function AuthPanel({ planId }: { planId: string }) {
  const db = useDB();
  const planName = db.programs.find((program) => program.id === planId)?.name;
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function set(field: keyof typeof EMPTY_FIELDS, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setMessage("");

    let result;

    if (mode === "register") {
      const parsed = parseRegistration(values);

      if (!parsed.ok) {
        setErrors({ [parsed.field]: parsed.error });
        return;
      }

      setErrors({});
      setBusy(true);
      result = await register(parsed.value);
    } else {
      const parsed = parseCredentials(values);

      if (!parsed.ok) {
        setErrors({ [parsed.field]: parsed.error });
        return;
      }

      setErrors({});
      setBusy(true);
      result = await logIn(parsed.value.email, parsed.value.password);
    }

    setBusy(false);

    // On success the saved session changes and the page shows the account.
    if (!result.ok) setMessage(result.message);
  }

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="mt-2 text-xs font-semibold text-red-900">{errors[field]}</p>
    ) : null;

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d4af37]">
        Your account
      </p>

      <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h1>

      <p className="mt-4 text-sm leading-7 text-white/55">
        Track your bookings and payment status from any device.
      </p>

      {planId && (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-[#d4af37]/35 bg-[#d4af37]/10 p-4 text-sm leading-6"
        >
          <p className="font-bold text-[#e7c65c]">
            {planName ? `You chose ${planName}.` : "You chose a plan."}
          </p>

          <p className="mt-1 text-white/65">
            Log in or create an account to continue — you&apos;ll go straight
            to the booking form next.
          </p>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Log in or create an account"
        className="mt-8 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
      >
        {(
          [
            { id: "login", label: "Log in" },
            { id: "register", label: "Create account" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => switchMode(tab.id)}
            className={`rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition ${
              mode === tab.id
                ? "bg-[#d4af37] text-black"
                : "text-white/55 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => void submit(event)}
        noValidate
        className="mt-6 rounded-[2rem] border border-black/20 bg-[#d4af37] p-7 sm:p-9"
      >
        {mode === "register" && (
          <>
            <div>
              <label htmlFor="account-name" className={labelClass}>
                Name
              </label>

              <input
                id="account-name"
                autoComplete="name"
                maxLength={100}
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Your full name"
                className={inputClass}
              />

              {fieldError("name")}
            </div>

            <div className="mt-5">
              <label htmlFor="account-phone" className={labelClass}>
                Phone
              </label>

              <input
                id="account-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
                value={values.phone}
                onChange={(event) => set("phone", event.target.value)}
                placeholder="+91 00000 00000"
                className={inputClass}
              />

              {fieldError("phone")}
            </div>
          </>
        )}

        <div className={mode === "register" ? "mt-5" : ""}>
          <label htmlFor="account-email" className={labelClass}>
            Email
          </label>

          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={200}
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />

          {fieldError("email")}
        </div>

        <div className="mt-5">
          <label htmlFor="account-password" className={labelClass}>
            Password
          </label>

          <input
            id="account-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={200}
            value={values.password}
            onChange={(event) => set("password", event.target.value)}
            className={inputClass}
          />

          {mode === "register" && !errors.password && (
            <p className="mt-2 text-xs text-black/60">
              At least {PASSWORD_MIN} characters.
            </p>
          )}

          {fieldError("password")}
        </div>

        {message && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-black/25 bg-black/[0.08] p-4 text-sm font-bold leading-6 text-black"
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-7 w-full rounded-full bg-black px-7 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-black disabled:hover:text-white"
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Signed in                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ session }: { session: Session }) {
  const db = useDB();
  const { token, user } = session;
  const [load, setLoad] = useState<AccountLoad | "loading">("loading");
  const [attempt, setAttempt] = useState(0);
  const [settings, setSettings] = useState<PaymentSettingsLoad | "loading">(
    "loading",
  );
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchAccount(token).then((result) => {
      if (active) setLoad(result);
    });

    return () => {
      active = false;
    };
  }, [token, attempt]);

  useEffect(() => {
    let active = true;

    fetchPaymentSettings().then((result) => {
      if (active) setSettings(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const programs = useMemo(
    () => new Map(db.programs.map((program) => [program.id, program])),
    [db.programs],
  );

  const firstName = user.name.split(" ")[0] || "there";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d4af37]">
            Your account
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            Hi, {firstName}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void logOut(session)}
          className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Log out
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">
          Profile
        </h2>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          {[
            { label: "Name", value: user.name },
            { label: "Email", value: user.email },
            { label: "Phone", value: user.phone },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {item.label}
              </dt>

              <dd className="mt-1.5 break-words text-white/75">
                {item.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">
            Bookings
          </h2>

          <Link
            href="/#contact"
            className="rounded-full bg-[#d4af37] px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
          >
            New booking
          </Link>
        </div>

        {load === "loading" ? (
          <p className="mt-6 text-sm text-white/45">Loading your bookings…</p>
        ) : load.state === "offline" ? (
          <p className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200/85">
            Bookings can&apos;t be loaded right now. Please try again later.
          </p>
        ) : load.state === "error" ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            <span>Couldn&apos;t load your bookings.</span>

            <button
              type="button"
              onClick={() => {
                setLoad("loading");
                setAttempt((n) => n + 1);
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-white/40"
            >
              Retry
            </button>
          </div>
        ) : load.state === "signed-out" ? null : load.bookings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center text-sm leading-7 text-white/40">
            No bookings yet. Pick a program and send a request while signed in
            — it will show up here.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {load.bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                program={programs.get(booking.programId)}
                token={token}
                settings={settings}
                open={openId === booking.id}
                onToggle={() =>
                  setOpenId((current) =>
                    current === booking.id ? null : booking.id,
                  )
                }
                onRetrySettings={() => {
                  setSettings("loading");
                  fetchPaymentSettings().then(setSettings);
                }}
                onClose={() => {
                  setOpenId(null);
                  // Pick up a payment sent or verified while it was open.
                  setAttempt((n) => n + 1);
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BookingCard({
  booking,
  program,
  token,
  settings,
  open,
  onToggle,
  onRetrySettings,
  onClose,
}: {
  booking: AccountBooking;
  program: Program | undefined;
  token: string;
  settings: PaymentSettingsLoad | "loading";
  open: boolean;
  onToggle: () => void;
  onRetrySettings: () => void;
  onClose: () => void;
}) {
  const status = BOOKING_STATUS[booking.payment.status];

  // Without a program there is no amount to pay; the coach follows up.
  const canOpen = Boolean(program) || booking.payment.status !== "none";

  const details = [formatDate(booking.createdAt), booking.slot, booking.goal]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-base font-black uppercase tracking-wide text-white">
            {program?.name ?? "Program to be decided"}
          </p>

          {details && <p className="mt-1 text-xs text-white/45">{details}</p>}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${status.badge}`}
        >
          {canOpen ? status.label : "Coach will contact you"}
        </span>

        {canOpen && (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-[#d4af37] hover:text-white"
          >
            {open ? "Close" : status.action}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#d4af37] p-4 sm:p-6">
          <PaymentStep
            booking={{
              id: booking.id,
              token,
              via: "account",
              programName: program?.name ?? "",
              amountLabel: program ? `${program.price}${program.period}` : "",
              amountMinor: program ? parseMoney(program.price) : 0,
            }}
            settings={settings}
            fresh={false}
            onRetrySettings={onRetrySettings}
            onClose={onClose}
          />
        </div>
      )}
    </li>
  );
}
