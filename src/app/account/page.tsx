"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import ProgressPanel from "@/components/account/progress-panel";
import AthletePhoto from "@/components/athlete-photo";
import BrandMark from "@/components/brand-mark";
import FeatureBadges from "@/components/feature-badges";
import { GoldCardGlow, goldCardClass } from "@/components/gold-card";
import Icon, { type IconName } from "@/components/icons";
import PaymentStep from "@/components/payment-step";
import {
  parseCredentials,
  parseRegistration,
  PASSWORD_MIN,
  type AccountBooking,
  type AuthErrorCode,
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
import { useT, type StringKey } from "@/lib/i18n";
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
  { label: StringKey; badge: string; action: StringKey }
> = {
  none: {
    label: "status.none",
    badge: "border-white/20 bg-white/5 text-white/70",
    action: "status.none.action",
  },
  submitted: {
    label: "status.submitted",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
    action: "status.submitted.action",
  },
  verified: {
    label: "status.verified",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
    action: "status.verified.action",
  },
  rejected: {
    label: "status.rejected",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
    action: "status.rejected.action",
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
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#050505] font-[family-name:var(--font-display)] text-white">
      <AccountHeader />

      {!hydrated ? null : continuing ? (
        <Continuing />
      ) : session ? (
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-6 sm:pb-20">
          <Dashboard key={session.token} session={session} />
        </div>
      ) : (
        <AuthPanel planId={plan?.programId ?? ""} />
      )}
    </main>
  );
}

function Continuing() {
  const t = useT();

  return (
    <p role="status" className="px-5 pt-16 text-center text-sm text-white/55">
      {t("auth.continuing")}
    </p>
  );
}

function AccountHeader() {
  const t = useT();
  const { settings } = useDB();
  const tagline = settings.tagline.trim() || "Rise. Grind. Shine.";

  return (
    <header className="relative z-20 mx-auto flex max-w-[110rem] items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
      <Link
        href="/"
        aria-label={t("auth.home")}
        className="flex shrink-0 items-center gap-3"
      >
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

      <p className="hidden items-center gap-5 text-sm font-semibold uppercase italic tracking-[0.3em] text-[#e0b54a] md:flex">
        <span aria-hidden className="h-px w-24 bg-[#e0b54a]/70" />
        {tagline}
      </p>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Log in / create account                                             */
/* ------------------------------------------------------------------ */

type Mode = "login" | "register";

const TABS = [
  { id: "login", label: "auth.tab.login" },
  { id: "register", label: "auth.tab.register" },
] as const satisfies readonly { id: Mode; label: StringKey }[];

const COPY: Record<Mode, Record<string, StringKey>> = {
  login: {
    top: "auth.login.top",
    accent: "auth.login.accent",
    line: "auth.login.line",
    submit: "auth.login.submit",
    switchPrompt: "auth.login.prompt",
    switchLabel: "auth.login.switch",
  },
  register: {
    top: "auth.register.top",
    accent: "auth.register.accent",
    line: "auth.register.line",
    submit: "auth.register.submit",
    switchPrompt: "auth.register.prompt",
    switchLabel: "auth.register.switch",
  },
};

/** The English message travels with the failure; this is its Hindi twin. */
const AUTH_ERROR: Record<AuthErrorCode, StringKey> = {
  nameMissing: "auth.err.name",
  nameLong: "auth.err.nameLong",
  phone: "form.err.phone",
  email: "form.err.email",
  passwordShort: "auth.err.pwShort",
  passwordLong: "auth.err.pwLong",
  passwordMissing: "auth.err.pwMissing",
};

const EMPTY_FIELDS = { name: "", email: "", phone: "", password: "" };

/** Room on the left for the field's icon. */
const authInputClass =
  "w-full rounded-full border border-white/10 bg-white/[0.04] py-4 pl-14 pr-5 text-[15px] text-white outline-none transition [color-scheme:dark] placeholder:text-white/40 hover:border-white/25 focus:border-[#e0b54a]/70 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(224,181,74,0.12)]";

function AuthPanel({ planId }: { planId: string }) {
  const t = useT();
  const db = useDB();
  const planName = db.programs.find((program) => program.id === planId)?.name;
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const copy = COPY[mode];

  function set(field: keyof typeof EMPTY_FIELDS, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function authError(code: AuthErrorCode) {
    return t(AUTH_ERROR[code]).replace("{min}", String(PASSWORD_MIN));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setMessage("");
    setShowPassword(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setMessage("");

    let result;

    if (mode === "register") {
      const parsed = parseRegistration(values);

      if (!parsed.ok) {
        setErrors({ [parsed.field]: authError(parsed.code) });
        return;
      }

      setErrors({});
      setBusy(true);
      result = await register(parsed.value);
    } else {
      const parsed = parseCredentials(values);

      if (!parsed.ok) {
        setErrors({ [parsed.field]: authError(parsed.code) });
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

  return (
    <>
      <AuthBackdrop />

      {/* From xl the left padding leaves the photo strip clear. */}
      <div className="relative mx-auto grid max-w-[80rem] gap-12 px-5 pb-16 pt-6 sm:px-8 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-10 lg:px-12 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] xl:pl-[13rem] 2xl:pl-[17rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e0b54a]">
            {t("auth.eyebrow")}
          </p>

          {/* Each line is sized to its words: gradient text only paints
              inside its own box. */}
          <h1 className="mt-4 font-black uppercase leading-[0.92] tracking-[-0.01em]">
            <span className="block w-max bg-[linear-gradient(180deg,#ffffff,#cfcfcf)] bg-clip-text text-[clamp(2.6rem,7.5vw,4.5rem)] text-transparent 2xl:text-[5rem]">
              {t(copy.top)}
            </span>

            <span className="relative mt-1 block w-max pb-4">
              <span className="block bg-[linear-gradient(100deg,#fbe3a0_0%,#e8b54a_40%,#c98f28_75%,#f3c969_100%)] bg-clip-text pr-[0.14em] text-[clamp(3.2rem,10vw,6rem)] italic text-transparent">
                {t(copy.accent)}
              </span>

              <svg
                viewBox="0 0 300 30"
                preserveAspectRatio="none"
                aria-hidden
                className="absolute bottom-0 left-[1%] h-5 w-[110%]"
              >
                <defs>
                  <linearGradient id="welcome-swoosh" x1="0" x2="1">
                    <stop offset="0" stopColor="#f3c969" stopOpacity="0.25" />
                    <stop offset="0.35" stopColor="#e8b54a" />
                    <stop offset="1" stopColor="#fbe3a0" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 22C80 12 180 6 296 8C200 14 110 20 30 27Z"
                  fill="url(#welcome-swoosh)"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-sm text-lg leading-8 text-white/85">
            {t(copy.line)}
          </p>

          {planId && (
            <div
              role="status"
              className="mt-7 max-w-md rounded-2xl border border-[#e0b54a]/35 bg-[#e0b54a]/10 p-4 text-sm leading-6"
            >
              <p className="font-bold text-[#f0c96a]">
                {planName
                  ? t("auth.chose").replace("{name}", planName)
                  : t("auth.chosePlain")}
              </p>

              <p className="mt-1 text-white/70">
                {t("auth.choseNote")}
              </p>
            </div>
          )}

          <FeatureBadges className="mt-10 max-w-xl" />
        </div>

        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className={`${goldCardClass} p-6 sm:p-9`}
        >
          <GoldCardGlow />

          <div className="relative">
            <div
              role="tablist"
              aria-label={t("auth.tablist")}
              className="flex items-end gap-5 border-b border-white/10 sm:gap-8"
            >
              <span
                aria-hidden
                className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e0b54a]/60 text-[#e0b54a]"
              >
                <Icon name="user" className="h-5 w-5" />
              </span>

              {TABS.map((tab) => {
                const active = mode === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchMode(tab.id)}
                    className="relative pb-4 pt-2"
                  >
                    {/* Text styles live on the span: a site-wide rule gives
                        buttons their parent's font. */}
                    <span
                      className={`text-sm font-bold uppercase tracking-[0.04em] transition sm:text-base ${
                        active ? "text-white" : "text-white/45 hover:text-white/75"
                      }`}
                    >
                      {t(tab.label)}
                    </span>

                    <span
                      aria-hidden
                      className={`absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-[#e0b54a] shadow-[0_0_12px_rgba(224,181,74,0.7)] transition-opacity ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-7 space-y-6">
              {mode === "register" && (
                <>
                  <AuthField
                    id="account-name"
                    label={t("auth.fullName")}
                    icon="user"
                    error={errors.name}
                  >
                    <input
                      id="account-name"
                      autoComplete="name"
                      maxLength={100}
                      value={values.name}
                      onChange={(event) => set("name", event.target.value)}
                      placeholder={t("form.namePh")}
                      className={authInputClass}
                    />
                  </AuthField>

                  <AuthField
                    id="account-phone"
                    label={t("form.phone")}
                    icon="phone"
                    error={errors.phone}
                  >
                    <input
                      id="account-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={values.phone}
                      onChange={(event) => set("phone", event.target.value)}
                      placeholder={t("form.phonePh")}
                      className={authInputClass}
                    />
                  </AuthField>
                </>
              )}

              <AuthField
                id="account-email"
                label={t("auth.emailLabel")}
                icon="mail"
                error={errors.email}
              >
                <input
                  id="account-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={200}
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder={t("form.emailPh")}
                  className={authInputClass}
                />
              </AuthField>

              <AuthField
                id="account-password"
                label={t("auth.password")}
                icon="lock"
                error={errors.password}
                hint={
                  mode === "register" && !errors.password
                    ? t("auth.pwHint").replace("{min}", String(PASSWORD_MIN))
                    : undefined
                }
              >
                <input
                  id="account-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  maxLength={200}
                  value={values.password}
                  onChange={(event) => set("password", event.target.value)}
                  placeholder={
                    mode === "login"
                      ? t("auth.pwPhLogin")
                      : t("auth.pwPhRegister")
                  }
                  className={`${authInputClass} pr-14`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? t("auth.hidePw") : t("auth.showPw")}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon name={showPassword ? "eye" : "eyeOff"} className="h-5 w-5" />
                </button>
              </AuthField>
            </div>

            {message && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold leading-6 text-red-100"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(180deg,#f6d27a,#e0ac3c_55%,#b88420)] px-7 py-4 text-black shadow-[0_14px_36px_-14px_rgba(224,172,60,0.7)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-base font-extrabold uppercase tracking-[0.08em]">
                {busy ? t("auth.wait") : t(copy.submit)}
              </span>

              {!busy && (
                <Icon
                  name="arrowRight"
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                />
              )}
            </button>

            <div className="my-6 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              <span aria-hidden className="h-px flex-1 bg-white/10" />
              {t("auth.or")}
              <span aria-hidden className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/20 px-6 py-4 transition hover:border-[#e0b54a]/70"
            >
              <span className="text-sm text-white/60">
                {t(copy.switchPrompt)}
              </span>
              <span className="text-sm font-bold text-[#f0c96a]">
                {t(copy.switchLabel)}
              </span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function AuthField({
  id,
  label,
  icon,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: IconName;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-[#e0b54a]"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          name={icon}
          className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/80"
        />
        {children}
      </div>

      {hint && <p className="mt-2 pl-5 text-xs text-white/45">{hint}</p>}

      {error && (
        <p className="mt-2 pl-5 text-xs font-semibold text-red-300">{error}</p>
      )}
    </div>
  );
}

/** The athlete, gold light and slashes behind the log-in page. */
function AuthBackdrop() {
  const t = useT();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(45rem_30rem_at_85%_45%,rgba(224,172,60,0.12),transparent_70%),radial-gradient(40rem_30rem_at_40%_0%,rgba(224,172,60,0.06),transparent_70%)]" />

      {/* A faded band behind the heading on phones and tablets; a
          full-height strip down the left edge from xl. */}
      <div className="absolute left-0 top-0 h-[26rem] w-[85%] opacity-35 sm:h-[32rem] sm:w-[60%] xl:bottom-0 xl:h-auto xl:w-[28vw] xl:max-w-[32rem] xl:opacity-100">
        <AthletePhoto
          sizes="(min-width: 1280px) 28vw, 85vw"
          className="object-[50%_15%] brightness-[0.8] contrast-125 grayscale"
        />

        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-r from-transparent to-[#050505]" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#050505] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-[#050505] to-transparent" />
      </div>

      {/* "Stronger Together", brushed across the foot of the photo. */}
      <div className="absolute bottom-[7%] left-[2%] hidden -rotate-[12deg] xl:block">
        <p className="bg-[linear-gradient(90deg,#c98f28,#f3c969_60%,#fbe3a0)] bg-clip-text pr-3 font-[family-name:var(--font-script)] text-[3.4rem] leading-[0.95] text-transparent">
          {t("scene.stronger")}
          <br />
          <span className="ml-10">{t("scene.together")}</span>
        </p>

        <svg viewBox="0 0 220 18" className="ml-8 mt-1 h-4 w-52">
          <path
            d="M3 15C70 8 140 4 217 3"
            fill="none"
            stroke="#e0ac3c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Gold slashes down the right side. */}
      <div className="absolute -right-32 top-24 h-5 w-[42rem] -rotate-[40deg] bg-gradient-to-r from-transparent via-[#b88420]/60 to-[#f6d27a]/90" />
      <div className="absolute -right-24 top-52 h-1.5 w-[34rem] -rotate-[40deg] bg-gradient-to-r from-transparent to-[#e0ac3c]/60" />
      <div className="absolute -right-28 bottom-20 h-4 w-[38rem] -rotate-[40deg] bg-gradient-to-r from-transparent via-[#b88420]/50 to-[#e0ac3c]/80" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Signed in                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ session }: { session: Session }) {
  const t = useT();
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

  const firstName = user.name.split(" ")[0] || t("dash.there");

  // A verified payment is what makes someone a client, and it is the coach
  // who marks it verified — so this is his decision, read back.
  const isClient =
    load !== "loading" &&
    load.state === "ok" &&
    load.bookings.some((booking) => booking.payment.status === "verified");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d4af37]">
            {t("auth.eyebrow")}
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            {t("dash.hi").replace("{name}", firstName)}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void logOut(session)}
          className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          {t("dash.logout")}
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">
          {t("dash.profile")}
        </h2>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          {[
            { label: "form.name" as StringKey, value: user.name },
            { label: "form.email" as StringKey, value: user.email },
            { label: "form.phone" as StringKey, value: user.phone },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {t(item.label)}
              </dt>

              <dd className="mt-1.5 break-words text-white/75">
                {item.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {load !== "loading" && load.state === "ok" && (
        <ProgressPanel token={token} unlocked={isClient} />
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">
            {t("dash.bookings")}
          </h2>

          <Link
            href="/#contact"
            className="rounded-full bg-[#d4af37] px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
          >
            {t("dash.newBooking")}
          </Link>
        </div>

        {load === "loading" ? (
          <p className="mt-6 text-sm text-white/45">{t("dash.loading")}</p>
        ) : load.state === "offline" ? (
          <p className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200/85">
            {t("dash.offline")}
          </p>
        ) : load.state === "error" ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            <span>{t("dash.error")}</span>

            <button
              type="button"
              onClick={() => {
                setLoad("loading");
                setAttempt((n) => n + 1);
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-white/40"
            >
              {t("dash.retry")}
            </button>
          </div>
        ) : load.state === "signed-out" ? null : load.bookings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center text-sm leading-7 text-white/40">
            {t("dash.empty")}
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
  const t = useT();
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
            {program?.name ?? t("dash.tbd")}
          </p>

          {details && <p className="mt-1 text-xs text-white/45">{details}</p>}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${status.badge}`}
        >
          {canOpen ? t(status.label) : t("dash.willContact")}
        </span>

        {canOpen && (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-[#d4af37] hover:text-white"
          >
            {open ? t("pay.close") : t(status.action)}
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
