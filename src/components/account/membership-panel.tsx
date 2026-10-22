"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/icons";
import PaymentStep from "@/components/payment-step";
import type { AccountBooking } from "@/lib/account";
import { formatMoney } from "@/lib/billing";
import { useT, type StringKey } from "@/lib/i18n";
import {
  formatDay,
  formatMoment,
  type Membership,
  type MembershipPaymentStatus,
  type MembershipStatus,
} from "@/lib/membership";
import type { PaymentSettingsLoad } from "@/lib/payment-client";
import type { Program } from "@/lib/types";

/**
 * Payment & Subscription on the client's dashboard: where their trial or
 * membership stands, what they owe, and what they have paid.
 *
 * Once access has lapsed this is the renewal screen — the rest of the
 * dashboard is not shown, and the server refuses its data either way.
 *
 * Everything here is what the server worked out. Paying only ever sends
 * proof; the status changes when the coach confirms it, never on a click.
 */

const STATUS: Record<
  Exclude<MembershipStatus, "none">,
  { label: StringKey; badge: string }
> = {
  trial: {
    label: "mem.status.trial",
    badge: "border-[#d4af37]/45 bg-[#d4af37]/10 text-[#eac55a]",
  },
  paid: {
    label: "mem.status.paid",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  },
  due: {
    label: "mem.status.due",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
  },
  expired: {
    label: "mem.status.expired",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
  },
};

const PAYMENT_STATUS: Record<
  MembershipPaymentStatus,
  { label: StringKey; badge: string }
> = {
  submitted: {
    label: "status.submitted",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
  },
  verified: {
    label: "status.verified",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  },
  rejected: {
    label: "status.rejected",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
  },
};

const goldButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white";

export default function MembershipPanel({
  membership,
  token,
  settings,
  onRetrySettings,
  onChanged,
}: {
  membership: Membership;
  token: string;
  settings: PaymentSettingsLoad | "loading";
  onRetrySettings: () => void;
  /** Ask the server again — after a payment is sent or the screen closes. */
  onChanged: () => void;
}) {
  const t = useT();
  const [paying, setPaying] = useState(false);

  if (membership.status === "none") {
    return (
      <section className="rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#0b0b0b] p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]">
          <Icon name="bolt" className="h-5 w-5" />
        </span>

        <h2 className="mt-5 text-lg font-black uppercase tracking-wide text-white">
          {t("mem.noneTitle")}
        </h2>

        <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
          {t("mem.noneText")}
        </p>

        <Link href="/#programs" className={`mt-6 ${goldButton}`}>
          {t("mem.noneCta")}
        </Link>
      </section>
    );
  }

  const {
    status,
    hasAccess,
    pending,
    renewal,
    feeMinor,
    programName,
  } = membership;

  const locked = !hasAccess;
  const program = programName || t("dash.tbd");
  const statusStyle = STATUS[status];

  // A renewal already with the coach can be followed; otherwise a new one
  // can be started — unless any payment is still being checked.
  const following = renewal === "submitted";
  const canPay = !pending || following;

  const payLabel: StringKey = following
    ? "status.submitted.action"
    : status === "paid"
      ? "mem.payAhead"
      : "mem.pay";

  const facts: { label: StringKey; value: string; strong?: boolean }[] = [
    {
      label: "mem.fee",
      value: feeMinor ? formatMoney(feeMinor) : t("mem.priceTbd"),
    },
    { label: "mem.trialStart", value: formatMoment(membership.trialStartedAt) },
    {
      label: status === "trial" ? "mem.trialEnd" : "mem.trialEnded",
      value: formatMoment(membership.trialEndsAt),
      strong: status === "trial",
    },
  ];

  if (membership.paidThrough) {
    facts.push({
      label: "mem.paidThrough",
      value: formatMoment(membership.paidThrough),
      strong: status === "paid",
    });
  }

  const nextWhen = locked ? t("mem.dueNow") : formatDay(membership.nextDueAt);

  facts.push(
    {
      label: "mem.nextPayment",
      value: [feeMinor ? formatMoney(feeMinor) : "", nextWhen]
        .filter(Boolean)
        .join(" · "),
      strong: locked,
    },
    {
      label: "mem.outstanding",
      value: formatMoney(membership.outstandingMinor),
      strong: membership.outstandingMinor > 0,
    },
    { label: "mem.amountPaid", value: formatMoney(membership.amountPaidMinor) },
    {
      label: "mem.lastPayment",
      value: membership.lastPaidAt ? formatDay(membership.lastPaidAt) : "—",
    },
  );

  return (
    <section
      aria-labelledby="membership-title"
      className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 ${
        locked
          ? "border-[#d4af37]/45 bg-[linear-gradient(160deg,#1d1606,#0b0b0b_55%)] shadow-[0_30px_80px_-40px_rgba(212,175,55,0.45)]"
          : "border-white/10 bg-[#0b0b0b]"
      }`}
    >
      {locked && (
        <div className="mb-8 border-b border-[#d4af37]/20 pb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]">
            <Icon name="lock" solid className="h-6 w-6" />
          </span>

          <h2 className="mt-5 text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl">
            {t("mem.expiredTitle")}
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
            {t(status === "due" ? "mem.expiredDue" : "mem.expiredTrial").replace(
              "{program}",
              program,
            )}
          </p>

          <p className="mt-2 max-w-xl text-xs leading-6 text-white/45">
            {t("mem.expiredNote")}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            id="membership-title"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]"
          >
            {t("mem.title")}
          </p>

          <p className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            {program}
          </p>

          <p className="mt-1 text-sm text-white/55">
            {membership.priceLabel || t("mem.priceTbd")}
          </p>
        </div>

        <span
          className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusStyle.badge}`}
        >
          <span className="sr-only">{t("mem.statusLabel")}: </span>
          {t(statusStyle.label)}
        </span>
      </div>

      {status === "trial" && !pending && (
        <p className="mt-5 rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/[0.07] p-4 text-sm leading-6 text-[#f0d27a]">
          {t("mem.trialNote").replace(
            "{date}",
            formatMoment(membership.trialEndsAt),
          )}
        </p>
      )}

      {pending && (
        <p
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200/90"
        >
          <span
            aria-hidden
            className="mt-2 h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-300"
          />
          {t("mem.pending")}
        </p>
      )}

      <dl className="mt-6 grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {t(fact.label)}
            </dt>

            <dd
              className={`mt-1.5 break-words ${
                fact.strong ? "font-black text-white" : "text-white/75"
              }`}
            >
              {fact.value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {canPay && !paying && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setPaying(true)}
            className={locked ? `${goldButton} w-full py-4 sm:w-auto sm:px-10` : goldButton}
          >
            <Icon name="rupee" className="h-4 w-4" />
            {/* Sized here: a site-wide rule gives buttons their parent's
                font, which outranks the size on the button itself. */}
            <span className={`font-black ${locked ? "text-sm" : "text-xs"}`}>
              {t(payLabel)}
            </span>
          </button>
        </div>
      )}

      {paying && (
        <div className="mt-8 rounded-[2rem] bg-[#d4af37] p-3 sm:p-4">
          <PaymentStep
            booking={{
              id: "membership",
              token,
              via: "membership",
              programName,
              amountLabel: membership.priceLabel,
              amountMinor: feeMinor,
            }}
            settings={settings}
            // Follow a renewal already sent (or one the coach rejected);
            // otherwise start a fresh payment.
            fresh={renewal !== "submitted" && renewal !== "rejected"}
            onRetrySettings={onRetrySettings}
            onClose={() => {
              setPaying(false);
              onChanged();
            }}
          />
        </div>
      )}

      <PaymentHistory membership={membership} />
    </section>
  );
}

function PaymentHistory({ membership }: { membership: Membership }) {
  const t = useT();

  return (
    <div className="mt-10 border-t border-white/10 pt-6">
      <h3 className="text-sm font-black uppercase tracking-wide text-white">
        {t("mem.history")}
      </h3>

      {membership.payments.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">{t("mem.historyEmpty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {membership.payments.map((payment) => {
            const style = PAYMENT_STATUS[payment.status];

            return (
              <li
                key={payment.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3.5 text-sm"
              >
                <span className="w-28 shrink-0 text-white/45">
                  {formatDay(payment.submittedAt) || "—"}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="font-black text-white">
                    {payment.amountMinor ? formatMoney(payment.amountMinor) : "—"}
                  </span>

                  <span className="ml-2 text-xs text-white/40">
                    {t(
                      payment.source === "renewal"
                        ? "mem.source.renewal"
                        : "mem.source.booking",
                    )}
                    {payment.method ? ` · ${payment.method}` : ""}
                    {payment.reference ? (
                      <span className="font-mono"> · {payment.reference}</span>
                    ) : null}
                  </span>

                  {payment.coversFrom && (
                    <span className="mt-0.5 block text-xs text-white/40">
                      {t("mem.covers")
                        .replace("{from}", formatDay(payment.coversFrom))
                        .replace("{to}", formatDay(payment.coversTo))}
                    </span>
                  )}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${style.badge}`}
                >
                  {t(style.label)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * What the client's program includes, from the program as it is on the
 * site — only shown while their access is open.
 */
export function YourProgram({
  program,
  bookings,
}: {
  program: Program | undefined;
  bookings: AccountBooking[];
}) {
  const t = useT();

  if (!program) return null;

  // Newest first from the server: the latest time they asked for.
  const slot =
    bookings.find((booking) => booking.programId === program.id && booking.slot)
      ?.slot ?? "";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-white">
            {t("mem.yourProgram")}
          </h2>

          {program.subtitle && (
            <p className="mt-1 text-xs text-white/45">{program.subtitle}</p>
          )}
        </div>

        {slot && (
          <p className="text-xs text-white/55">
            <span className="mr-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {t("mem.slot")}
            </span>
            {slot}
          </p>
        )}
      </div>

      {program.features.length > 0 && (
        <ul className="mt-5 grid gap-2.5 text-sm text-white/75 sm:grid-cols-2">
          {program.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Icon
                name="check"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]"
              />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
