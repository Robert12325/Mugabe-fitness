"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/billing";
import { loadEnquiries, patchEnquiry } from "@/lib/enquiries-client";
import {
  formatDay,
  formatMoment,
  type Membership,
  type MembershipPayment,
  type MembershipPaymentStatus,
  type MembershipStatus,
} from "@/lib/membership";
import {
  loadMembers,
  loadRenewalScreenshot,
  reviewRenewal,
  type MemberRow,
  type MembersLoad,
} from "@/lib/membership-client";
import { loadPaymentScreenshot } from "@/lib/payment-client";
import { replaceLeads } from "@/lib/store";
import EmailText from "./email-text";
import { setUnlocked } from "./session";
import { Btn, Card, EmptyState, Notice, SectionTitle } from "./ui";

/**
 * Client accounts on a trial or membership: who is in, who owes, and the
 * payments waiting for the coach to confirm.
 *
 * Everything shown is worked out by the server from the trial and the
 * verified payments. Verifying here is what opens a client's dashboard;
 * there is no separate "mark as paid" switch to forget.
 */

const STATUS: Record<
  Exclude<MembershipStatus, "none">,
  { label: string; badge: string }
> = {
  trial: {
    label: "Trial",
    badge: "border-[#d4af37]/45 bg-[#d4af37]/10 text-[#eac55a]",
  },
  paid: {
    label: "Paid",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  },
  due: {
    label: "Payment due",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
  },
  expired: {
    label: "Expired",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
  },
};

const PAYMENT_STATUS: Record<
  MembershipPaymentStatus,
  { label: string; badge: string }
> = {
  submitted: {
    label: "To verify",
    badge: "border-amber-300/40 bg-amber-400/10 text-amber-200",
  },
  verified: {
    label: "Verified",
    badge: "border-[#5cc98a]/35 bg-[#2ea55c]/15 text-[#5cc98a]",
  },
  rejected: {
    label: "Rejected",
    badge: "border-[#f0928c]/40 bg-[#c0453d]/15 text-[#f0928c]",
  },
};

const FILTERS = [
  { id: "all", label: "All clients" },
  { id: "trial", label: "Trial" },
  { id: "paid", label: "Paid" },
  { id: "due", label: "Payment due" },
  { id: "expired", label: "Expired" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

const badge =
  "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]";

export default function MembersCard() {
  const [load, setLoad] = useState<MembersLoad | "loading">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshing(true);

    return loadMembers()
      .then((result) => {
        if (result.state === "unauthorized") setUnlocked(false);
        else setLoad(result);
      })
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    let active = true;

    loadMembers().then((result) => {
      if (!active) return;

      if (result.state === "unauthorized") setUnlocked(false);
      else setLoad(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const members = useMemo(
    () => (load !== "loading" && load.state === "online" ? load.members : []),
    [load],
  );

  const counts = useMemo(() => {
    const tally: Record<Filter, number> = {
      all: members.length,
      trial: 0,
      paid: 0,
      due: 0,
      expired: 0,
    };

    for (const member of members) {
      const status = member.membership.status;
      if (status !== "none") tally[status] += 1;
    }

    return tally;
  }, [members]);

  const waiting = members.filter((member) =>
    member.membership.payments.some((payment) => payment.status === "submitted"),
  ).length;

  const shown =
    filter === "all"
      ? members
      : members.filter((member) => member.membership.status === filter);

  return (
    <Card>
      <SectionTitle
        icon="users"
        title="Client memberships"
        hint="3-day trials and monthly access for client accounts. A payment opens access only once you verify it."
        action={
          <Btn
            size="sm"
            icon="cycle"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Btn>
        }
      />

      {load === "loading" ? (
        <p className="text-sm text-white/50">Loading memberships…</p>
      ) : load.state === "offline" ? (
        <Notice icon="database">
          Memberships need the server database, which isn&apos;t configured
          here.
        </Notice>
      ) : load.state === "error" ? (
        <Notice icon="alert" tone="red">
          Memberships couldn&apos;t be loaded. Try Refresh.
        </Notice>
      ) : (
        <>
          {waiting > 0 && (
            <div className="mb-6">
              <Notice icon="alert">
                <strong>
                  {waiting} client{waiting === 1 ? "" : "s"}
                </strong>{" "}
                {waiting === 1 ? "has" : "have"} a payment waiting for you to
                verify. Check it reached your UPI app, then verify it below.
              </Notice>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                  filter === option.id
                    ? "border-[#d4af37] bg-[#d4af37] text-black"
                    : "border-white/15 text-white/55 hover:text-white"
                }`}
              >
                {option.label}
                <span className="ml-1.5 opacity-60">{counts[option.id]}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState>
              {members.length === 0
                ? "No client accounts yet. A trial starts when a logged-in visitor books a program."
                : "No clients match this filter."}
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {shown.map((member) => (
                <MemberItem
                  key={member.userId}
                  member={member}
                  open={open === member.userId}
                  onToggle={() =>
                    setOpen((id) => (id === member.userId ? null : member.userId))
                  }
                  onChanged={() => void refresh()}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function MemberItem({
  member,
  open,
  onToggle,
  onChanged,
}: {
  member: MemberRow;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const { membership } = member;

  if (membership.status === "none") return null;

  const status = STATUS[membership.status];
  const waiting = membership.payments.some((p) => p.status === "submitted");

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <span className={`${badge} ${status.badge}`}>{status.label}</span>

        <span className="min-w-[8rem] flex-1">
          <span className="block text-sm font-bold text-white">
            {member.name || "Unnamed client"}
          </span>

          <span className="block text-xs text-white/45">
            {membership.programName || "Program removed"}
            {membership.feeMinor ? ` · ${formatMoney(membership.feeMinor)}/mo` : ""}
          </span>
        </span>

        {waiting && (
          <span className={`${badge} ${PAYMENT_STATUS.submitted.badge}`}>
            To verify
          </span>
        )}

        <span className="hidden text-xs text-white/55 md:block">
          <NextDue membership={membership} />
        </span>

        <span className="text-white/45">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/55">
            {member.email && (
              <span className="min-w-0 break-words">
                <EmailText email={member.email} />
              </span>
            )}
            {member.phone && <span>{member.phone}</span>}
          </div>

          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Program" value={membership.programName || "—"} />
            <Fact
              label="Amount"
              value={membership.priceLabel || formatMoney(membership.feeMinor)}
            />
            <Fact
              label="Trial started"
              value={formatMoment(membership.trialStartedAt)}
            />
            <Fact
              label={membership.status === "trial" ? "Trial ends" : "Trial ended"}
              value={formatMoment(membership.trialEndsAt)}
            />
            <Fact
              label="Paid until"
              value={membership.paidThrough ? formatMoment(membership.paidThrough) : "—"}
            />
            <Fact
              label="Last payment"
              value={membership.lastPaidAt ? formatDay(membership.lastPaidAt) : "—"}
            />
            <Fact label="Next payment" value={<NextDue membership={membership} />} />
            <Fact
              label="Outstanding"
              value={formatMoney(membership.outstandingMinor)}
            />
          </dl>

          <h3 className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Payment history · {formatMoney(membership.amountPaidMinor)} paid
          </h3>

          {membership.payments.length === 0 ? (
            <p className="mt-3 text-xs text-white/40">No payments yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {membership.payments.map((payment) => (
                <PaymentItem
                  key={payment.id}
                  member={member}
                  payment={payment}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NextDue({ membership }: { membership: Membership }) {
  if (!membership.hasAccess) return <>due now</>;

  return (
    <>
      {membership.status === "trial" ? "trial ends " : "renews "}
      {formatDay(membership.nextDueAt)}
    </>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </dt>

      <dd className="mt-1.5 break-words text-white/75">{value || "—"}</dd>
    </div>
  );
}

type Shot =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "failed" }
  | { state: "shown"; src: string };

/** Browsers refuse to navigate to a data URL, so it goes through a blob. */
async function openFullSize(src: string) {
  const blob = await (await fetch(src)).blob();
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function PaymentItem({
  member,
  payment,
  onChanged,
}: {
  member: MemberRow;
  payment: MembershipPayment;
  onChanged: () => void;
}) {
  const [shot, setShot] = useState<Shot>({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const style = PAYMENT_STATUS[payment.status];
  const isBooking = payment.source === "booking";

  function showScreenshot() {
    setShot({ state: "loading" });

    const request = isBooking
      ? loadPaymentScreenshot(payment.enquiryId)
      : loadRenewalScreenshot(member.userId, payment.id);

    void request.then((src) =>
      setShot(src ? { state: "shown", src } : { state: "failed" }),
    );
  }

  async function review(next: MembershipPaymentStatus) {
    if (
      next === "verified" &&
      !window.confirm(
        `Verify ${member.name || "this client"}'s payment of ${formatMoney(payment.amountMinor)}? Their dashboard opens straight away.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    // A booking's payment lives on its enquiry, so it is reviewed there —
    // the Enquiries tab and this list then agree.
    const ok = isBooking
      ? await patchEnquiry(payment.enquiryId, { paymentStatus: next })
      : await reviewRenewal(member.userId, payment.id, next);

    setBusy(false);

    if (!ok) {
      setError("That change couldn't be saved. Try again.");
      return;
    }

    if (isBooking) {
      void loadEnquiries().then((result) => {
        if (result.state === "online") replaceLeads(result.enquiries);
      });
    }

    onChanged();
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="w-24 shrink-0 text-white/40">
          {formatDay(payment.submittedAt) || "—"}
        </span>

        <span className="font-black text-white">
          {payment.amountMinor ? formatMoney(payment.amountMinor) : "—"}
        </span>

        <span className="text-white/45">
          {isBooking ? "With booking" : "Renewal"}
          {payment.method ? ` · ${payment.method}` : ""}
        </span>

        {payment.reference && (
          <span className="font-mono text-white/70">{payment.reference}</span>
        )}

        <span className={`ml-auto ${badge} ${style.badge}`}>{style.label}</span>
      </div>

      {payment.coversFrom && (
        <p className="mt-2 text-xs text-white/40">
          Covers {formatDay(payment.coversFrom)} – {formatDay(payment.coversTo)}
        </p>
      )}

      {shot.state === "shown" && (
        <div className="mt-4">
          <div className="relative h-96 w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-black">
            <Image
              src={shot.src}
              alt={`Payment screenshot from ${member.name}`}
              fill
              sizes="20rem"
              unoptimized
              className="object-contain"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => void openFullSize(shot.src)}>
              Open full size
            </Btn>

            <Btn size="sm" onClick={() => setShot({ state: "idle" })}>
              Hide
            </Btn>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {shot.state !== "shown" && (
          <Btn
            size="sm"
            disabled={shot.state === "loading"}
            onClick={showScreenshot}
          >
            {shot.state === "loading" ? "Loading…" : "View screenshot"}
          </Btn>
        )}

        {payment.status !== "verified" && (
          <Btn
            size="sm"
            variant="gold"
            disabled={busy}
            onClick={() => void review("verified")}
          >
            Verify payment
          </Btn>
        )}

        {payment.status !== "rejected" && (
          <Btn
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => void review("rejected")}
          >
            Reject
          </Btn>
        )}

        {payment.status !== "submitted" && (
          <Btn size="sm" disabled={busy} onClick={() => void review("submitted")}>
            Undo review
          </Btn>
        )}

        {shot.state === "failed" && (
          <span className="text-xs text-red-300">
            The screenshot couldn&apos;t be loaded.
          </span>
        )}

        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    </div>
  );
}
