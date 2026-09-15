"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Icon, { type IconName } from "@/components/icons";
import ContactScene from "@/components/motion/contact-scene";
import PaymentStep from "@/components/payment-step";
import {
  authHeader,
  getSession,
  getSessionOnServer,
  subscribeSession,
  type Session,
} from "@/lib/account-client";
import { parseMoney } from "@/lib/billing";
import {
  clearChosenPlan,
  getChosenPlan,
  getChosenPlanOnServer,
  subscribeChosenPlan,
} from "@/lib/chosen-plan";
import { submitEnquiry } from "@/lib/enquiries-client";
import { paymentsEnabled } from "@/lib/payment";
import {
  clearBooking,
  fetchPaymentSettings,
  getBooking,
  getBookingOnServer,
  saveBooking,
  subscribeBooking,
  type PaymentSettingsLoad,
} from "@/lib/payment-client";
import { useDB } from "@/lib/use-store";

const GOALS = [
  "Fat loss",
  "Muscle gain",
  "Strength",
  "General fitness",
  "Sport performance",
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  programId: "",
  slot: "",
  goal: GOALS[0],
  message: "",
  /** Honeypot — hidden from people, filled in by bots. */
  company: "",
};

const FEATURES = [
  { icon: "dumbbell", top: "Better", bottom: "Fitness" },
  { icon: "brain", top: "Stronger", bottom: "Mindset" },
  { icon: "mountain", top: "Bigger", bottom: "Goals" },
  { icon: "crown", top: "Real", bottom: "Results" },
] as const satisfies readonly { icon: IconName; top: string; bottom: string }[];

/** Room on the left for the field's icon. */
const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-white/35 hover:border-white/20 focus:border-[#e0b54a]/70 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(224,181,74,0.12)]";

const selectClass = `${fieldClass} cursor-pointer appearance-none pr-10`;

/** The dark glass card the form and its confirmation sit on. */
const cardClass =
  "relative overflow-hidden rounded-[1.75rem] border border-[#e0b54a]/30 bg-[linear-gradient(180deg,rgba(22,20,16,0.92),rgba(8,8,8,0.96))] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_70px_-25px_rgba(224,181,74,0.35)] backdrop-blur-xl";

type SubmitError = { message: string; offerDirectContact: boolean };

function takesPayment(load: PaymentSettingsLoad | "loading") {
  return (
    load !== "loading" &&
    load.state === "online" &&
    paymentsEnabled(load.settings)
  );
}

/** A blank form, with the contact details already filled in when signed in. */
function formFor(session: Session | null) {
  return session
    ? {
        ...EMPTY,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
      }
    : EMPTY;
}

export default function EnquiryForm() {
  const db = useDB();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "sending" | "sent">("idle");
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [settings, setSettings] = useState<PaymentSettingsLoad | "loading">(
    "loading",
  );
  const [createdId, setCreatedId] = useState("");

  // A request waiting on payment (or its verification) survives reloads, so
  // the visitor comes back to it rather than to an empty form.
  const booking = useSyncExternalStore(
    subscribeBooking,
    getBooking,
    getBookingOnServer,
  );

  const session = useSyncExternalStore(
    subscribeSession,
    getSession,
    getSessionOnServer,
  );

  // Arriving signed in, or signing in on another tab, fills the contact
  // details once — never over anything already typed. Adjusted during render
  // rather than in an effect, so there is no flash of an empty form.
  const accountId = session?.user.id ?? "";
  const [prefilledFor, setPrefilledFor] = useState("");

  if (accountId !== prefilledFor) {
    setPrefilledFor(accountId);

    if (session) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || session.user.name,
        email: prev.email || session.user.email,
        phone: prev.phone || session.user.phone,
      }));
    }
  }

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
    () => db.programs.filter((program) => program.active),
    [db.programs],
  );

  const selected = programs.find((program) => program.id === form.programId);

  // A plan chosen on its card arrives here already picked — once the visitor
  // is signed in. Applied while rendering, then the hand-off is cleared so
  // it only happens once per choice.
  const chosenPlan = useSyncExternalStore(
    subscribeChosenPlan,
    getChosenPlan,
    getChosenPlanOnServer,
  );

  const planToApply =
    session &&
    chosenPlan &&
    programs.some((program) => program.id === chosenPlan.programId)
      ? chosenPlan.programId
      : "";

  const [appliedPlan, setAppliedPlan] = useState("");

  if (planToApply !== appliedPlan) {
    setAppliedPlan(planToApply);

    if (planToApply) {
      const plan = programs.find((program) => program.id === planToApply);

      setForm((prev) => ({
        ...prev,
        programId: planToApply,
        slot: plan?.slots.includes(prev.slot) ? prev.slot : "",
      }));
    }
  }

  useEffect(() => {
    if (planToApply) clearChosenPlan();
  }, [planToApply]);

  // One program chosen -> just its slots. Nothing chosen yet -> every slot,
  // grouped, so a visitor can still say when they want to train.
  const slotGroups = selected
    ? [{ name: selected.name, slots: selected.slots }]
    : programs
        .filter((program) => program.slots.length > 0)
        .map((program) => ({ name: program.name, slots: program.slots }));

  const hasSlots = slotGroups.some((group) => group.slots.length > 0);

  const coachDigits = db.settings.coachPhone.replace(/\D/g, "");

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Switching program invalidates a slot picked from the previous one.
  function setProgram(programId: string) {
    const next = programs.find((program) => program.id === programId);
    const stillValid = next ? next.slots.includes(form.slot) : false;

    setForm((prev) => ({
      ...prev,
      programId,
      slot: stillValid ? prev.slot : "",
    }));
  }

  function validate(needsProgram: boolean) {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = "Please enter your name.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Please enter a valid email.";
    }

    const digits = form.phone.replace(/\D/g, "").length;

    if (digits < 7 || digits > 15) {
      next.phone = "Please enter a valid phone number.";
    }

    // Payment needs an amount, and the amount comes from the program.
    if (needsProgram && !selected) {
      next.programId = "Choose a program to continue to payment.";
    }

    return next;
  }

  /** The visitor's details, ready to send to the coach on WhatsApp if the
   *  online form can't deliver them. */
  function whatsappLink() {
    const lines = [
      "Hi, I'd like to start training.",
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim()}`,
      `Program: ${selected?.name ?? "Not sure yet"}`,
      form.slot ? `Preferred time: ${form.slot}` : "",
      `Goal: ${form.goal}`,
      form.message.trim() ? `Message: ${form.message.trim()}` : "",
    ].filter(Boolean);

    return `https://wa.me/${coachDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  function retrySettings() {
    setSettings("loading");
    fetchPaymentSettings().then(setSettings);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (phase === "sending") return;

    const found = validate(takesPayment(settings));
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setPhase("sending");
    setSubmitError(null);

    // The payment details normally arrive with the page. If they haven't,
    // ask once more so a slow connection doesn't skip the payment step.
    let load = settings;

    if (load === "loading" || load.state === "error") {
      load = await fetchPaymentSettings();
      setSettings(load);
    }

    const paying = takesPayment(load);

    if (paying && !selected) {
      setErrors(validate(true));
      setPhase("idle");
      return;
    }

    const result = await submitEnquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      // "" means "Not sure yet" — never quietly default to a program.
      programId: form.programId,
      slot: form.slot,
      goal: form.goal,
      message: form.message.trim(),
      company: form.company,
    }, authHeader(session));

    if (result.ok) {
      setForm(formFor(session));

      if (paying && selected && result.id && result.token) {
        saveBooking({
          id: result.id,
          token: result.token,
          via: "enquiry",
          programName: selected.name,
          amountLabel: `${selected.price}${selected.period}`,
          amountMinor: parseMoney(selected.price),
        });
        setCreatedId(result.id);
        setPhase("idle");
        return;
      }

      setPhase("sent");
      return;
    }

    // Keep what they typed, and never claim success for a request that
    // didn't arrive.
    setPhase("idle");
    setSubmitError({
      message: result.message,
      offerDirectContact: result.kind !== "invalid",
    });
  }

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-[#050505] px-5 pb-24 pt-24 font-[family-name:var(--font-display)] sm:px-6 lg:px-8 lg:py-28"
    >
      <ContactScene />

      {/* From xl the left padding leaves the photo strip clear. */}
      <div className="relative mx-auto grid max-w-[80rem] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-10 xl:pl-[15rem] 2xl:gap-16">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#e0b54a] sm:text-xs">
            <span aria-hidden className="flex shrink-0 items-center gap-1.5">
              <span className="h-px w-4 bg-[#e0b54a]/60" />
              <span className="h-px w-9 bg-[#e0b54a]" />
            </span>
            Your next chapter starts here
          </p>

          {/* Each line is sized to its words: gradient text only paints
              inside its own box. */}
          <h2 className="mt-5 font-black uppercase leading-[0.92] tracking-[-0.01em]">
            <span className="block w-max bg-[linear-gradient(180deg,#ffffff,#cfcfcf)] bg-clip-text text-[clamp(2.6rem,8vw,4.5rem)] text-transparent">
              Ready to
            </span>

            <span className="relative mt-1 block w-max pb-3">
              <span className="block bg-[linear-gradient(100deg,#fbe3a0_0%,#e8b54a_40%,#c98f28_75%,#f3c969_100%)] bg-clip-text pr-[0.14em] text-[clamp(3rem,10vw,5.5rem)] italic text-transparent">
                Rise?
              </span>

              <svg
                viewBox="0 0 300 30"
                preserveAspectRatio="none"
                aria-hidden
                className="absolute bottom-0 left-[1%] h-4 w-[104%] sm:h-5"
              >
                <defs>
                  <linearGradient id="rise-swoosh" x1="0" x2="1">
                    <stop offset="0" stopColor="#f3c969" stopOpacity="0.25" />
                    <stop offset="0.35" stopColor="#e8b54a" />
                    <stop offset="1" stopColor="#fbe3a0" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 22C80 12 180 6 296 8C200 14 110 20 30 27Z"
                  fill="url(#rise-swoosh)"
                />
              </svg>
            </span>
          </h2>

          <p className="mt-8 max-w-md text-base leading-7 text-white/75">
            Tell me where you are today and what you want to build. I&apos;ll
            come back to you with the plan that fits.
          </p>

          <ul className="mt-8 space-y-4">
            <ContactRow
              icon="mail"
              label="Email"
              value={db.settings.coachEmail}
              href={`mailto:${db.settings.coachEmail}`}
            />

            <ContactRow
              icon="phone"
              label="Phone"
              value={db.settings.coachPhone}
              href={coachDigits ? `tel:+${coachDigits}` : undefined}
            />
          </ul>

          <ul className="mt-10 grid max-w-xl grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-y-0">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.top}
                className={`flex flex-col items-center gap-3 px-2 text-center ${
                  index > 0 ? "sm:border-l sm:border-white/10" : ""
                }`}
              >
                <Icon name={feature.icon} className="h-7 w-7 text-[#e0b54a]" />

                <span className="text-[10px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-white/80">
                  {feature.top}
                  <br />
                  {feature.bottom}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {booking ? (
            // The payment step is designed for the gold panel it used to sit
            // on, so it keeps that ground here.
            <div className="rounded-[2rem] bg-[#d4af37] p-3 sm:p-4">
              <PaymentStep
                key={booking.id}
                booking={booking}
                settings={settings}
                fresh={booking.id === createdId}
                onRetrySettings={retrySettings}
                onClose={clearBooking}
              />
            </div>
          ) : phase === "sent" ? (
            <div role="status" className={`${cardClass} p-10`}>
              <CardGlow />

              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f6d27a,#c98f28)] text-black">
                  <Icon name="check" className="h-7 w-7" />
                </span>

                <h3 className="mt-6 text-2xl font-black uppercase text-white">
                  Request sent
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/65">
                  Your details reached me. I&apos;ll get back to you on the
                  phone or email you gave to get you started.
                </p>

                <p className="mt-8 inline-block rounded-full bg-[linear-gradient(180deg,#f6d27a,#e0ac3c_55%,#b88420)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-black">
                  Thank you
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className={`${cardClass} p-5 sm:p-8`}
            >
              <CardGlow />

              <div className="relative">
                {/* Honeypot: off-screen and hidden from assistive tech. Real
                    visitors never fill it; bots filling every input do. */}
                <div
                  aria-hidden
                  className="absolute -left-[9999px] h-px w-px overflow-hidden"
                >
                  <label htmlFor="company">Company</label>
                  <input
                    id="company"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(event) => set("company", event.target.value)}
                  />
                </div>

                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e0b54a]/30 bg-[#e0b54a]/10 text-[#e8c05a]">
                    <Icon name="user" className="h-5 w-5" />
                  </span>

                  <p className="text-xs leading-5 text-white/75">
                    {session ? (
                      <>
                        Signed in as <strong className="text-white">{session.user.email}</strong>{" "}
                        — this request will show in{" "}
                        <Link
                          href="/account"
                          className="font-bold text-[#e8c05a] underline-offset-4 hover:underline"
                        >
                          your account
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        Have an account?{" "}
                        <Link
                          href="/account"
                          className="font-bold text-[#e8c05a] underline-offset-4 hover:underline"
                        >
                          Log in
                        </Link>{" "}
                        to track your booking and payment from any device.
                      </>
                    )}
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="name" label="Name" icon="user" error={errors.name}>
                    <input
                      id="name"
                      autoComplete="name"
                      maxLength={100}
                      value={form.name}
                      onChange={(event) => set("name", event.target.value)}
                      placeholder="Your full name"
                      className={fieldClass}
                    />
                  </Field>

                  <Field id="phone" label="Phone" icon="phone" error={errors.phone}>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={form.phone}
                      onChange={(event) => set("phone", event.target.value)}
                      placeholder="+91 00000 00000"
                      className={fieldClass}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="email" label="Email" icon="mail" error={errors.email}>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={200}
                      value={form.email}
                      onChange={(event) => set("email", event.target.value)}
                      placeholder="you@example.com"
                      className={fieldClass}
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field
                    id="program"
                    label="Program"
                    icon="dumbbell"
                    error={errors.programId}
                  >
                    <select
                      id="program"
                      value={form.programId}
                      onChange={(event) => setProgram(event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Not sure yet</option>

                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name} — {program.price}
                          {program.period}
                        </option>
                      ))}
                    </select>
                    <Chevron />
                  </Field>

                  <Field id="goal" label="Main goal" icon="target">
                    <select
                      id="goal"
                      value={form.goal}
                      onChange={(event) => set("goal", event.target.value)}
                      className={selectClass}
                    >
                      {GOALS.map((goal) => (
                        <option key={goal} value={goal}>
                          {goal}
                        </option>
                      ))}
                    </select>
                    <Chevron />
                  </Field>
                </div>

                {hasSlots && (
                  <div className="mt-5">
                    <Field
                      id="slot"
                      label="Preferred time"
                      icon="clock"
                      hint={
                        selected
                          ? `Slots available for ${selected.name}.`
                          : "Pick a program above to narrow these down."
                      }
                    >
                      <select
                        id="slot"
                        value={form.slot}
                        onChange={(event) => set("slot", event.target.value)}
                        className={selectClass}
                      >
                        <option value="">No preference</option>

                        {selected
                          ? selected.slots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))
                          : slotGroups.map((group) => (
                              <optgroup key={group.name} label={group.name}>
                                {group.slots.map((slot) => (
                                  <option key={group.name + slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                      </select>
                      <Chevron />
                    </Field>
                  </div>
                )}

                <div className="mt-5">
                  <Field id="message" label="Anything else" icon="chat" top>
                    <textarea
                      id="message"
                      rows={3}
                      maxLength={2000}
                      value={form.message}
                      onChange={(event) => set("message", event.target.value)}
                      placeholder="Injuries, schedule, experience level…"
                      className={`${fieldClass} resize-y`}
                    />
                  </Field>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100"
                  >
                    <p className="font-bold">{submitError.message}</p>

                    {submitError.offerDirectContact && coachDigits && (
                      <p className="mt-2 text-red-100/80">
                        You can also reach me directly on{" "}
                        <a
                          href={whatsappLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#e8c05a] underline underline-offset-4"
                        >
                          WhatsApp
                        </a>{" "}
                        or{" "}
                        <a
                          href={`tel:+${coachDigits}`}
                          className="font-bold text-[#e8c05a] underline underline-offset-4"
                        >
                          call {db.settings.coachPhone}
                        </a>
                        .
                      </p>
                    )}
                  </div>
                )}

                {/* Text styles live on the inner span: a site-wide rule gives
                    buttons their parent's font. */}
                <button
                  type="submit"
                  disabled={phase === "sending"}
                  className="group mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(180deg,#f6d27a,#e0ac3c_55%,#b88420)] px-7 py-4 text-black shadow-[0_14px_36px_-14px_rgba(224,172,60,0.7)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                >
                  <Icon name="send" className="h-4 w-4" />

                  <span className="text-sm font-extrabold uppercase tracking-[0.14em]">
                    {phase === "sending" ? "Sending…" : "Submit"}
                  </span>

                  <Icon
                    name="arrowRight"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </button>

                {takesPayment(settings) && (
                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/55">
                    <Icon name="lock" className="h-3.5 w-3.5 text-[#e0b54a]" />
                    Next, pay by UPI to confirm your spot.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  hint,
  top = false,
  children,
}: {
  id: string;
  label: string;
  icon: IconName;
  error?: string;
  hint?: string;
  /** Pin the icon to the first line, for a textarea. */
  top?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60"
      >
        <span
          aria-hidden
          className="h-2.5 w-[3px] -skew-x-[20deg] rounded-full bg-[#e0b54a]"
        />
        {label}
      </label>

      <div className="relative">
        <Icon
          name={icon}
          className={`pointer-events-none absolute left-4 z-10 h-5 w-5 text-[#e0b54a] ${
            top ? "top-3.5" : "top-1/2 -translate-y-1/2"
          }`}
        />
        {children}
      </div>

      {hint && <p className="mt-2 text-xs text-white/45">{hint}</p>}

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-300">{error}</p>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <Icon
      name="chevronDown"
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
    />
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}) {
  const text = (
    <span className="block break-all text-base font-semibold text-white transition group-hover:text-[#e8c05a] sm:text-lg">
      {value}
    </span>
  );

  return (
    <li className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0b54a]/40 bg-[#e0b54a]/10 text-[#e8c05a]">
        <Icon name={icon} className="h-5 w-5" />
      </span>

      <span className="min-w-0">
        <span className="block text-xs text-white/50">{label}</span>

        {href ? (
          <a href={href} className="group">
            {text}
          </a>
        ) : (
          text
        )}
      </span>
    </li>
  );
}

/** Gold light catching two corners of the card. */
function CardGlow() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#e0b54a]/25 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#e0b54a]/20 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-tr-[1.75rem] border-r-2 border-t-2 border-[#f3c969] [mask-image:linear-gradient(225deg,#000_10%,transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-bl-[1.75rem] border-b-2 border-l-2 border-[#f3c969] [mask-image:linear-gradient(45deg,#000_10%,transparent_65%)]"
      />
    </>
  );
}
