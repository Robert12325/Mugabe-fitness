"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { inputClass, labelClass } from "@/components/form-classes";
import { useT } from "@/lib/i18n";
import {
  cleanTxnId,
  isValidTxnId,
  paymentsEnabled,
  upiPayLink,
} from "@/lib/payment";
import {
  fetchEnquiryPayment,
  prepareScreenshot,
  sendPaymentProof,
  type Booking,
  type PaymentSettingsLoad,
} from "@/lib/payment-client";
import type { EnquiryPayment, EnquiryPaymentStatus } from "@/lib/types";

/** How often a visitor waiting on the coach checks back. */
const POLL_MS = 15_000;

type View = "loading" | "error" | "missing" | EnquiryPaymentStatus;

const darkCard =
  "rounded-[2rem] border border-black/20 bg-black p-10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]";

const goldPill =
  "inline-flex items-center justify-center rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60";

const ghostPill =
  "inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-white hover:text-white";

export default function PaymentStep({
  booking,
  settings,
  fresh,
  onRetrySettings,
  onClose,
}: {
  booking: Booking;
  settings: PaymentSettingsLoad | "loading";
  /** Just created on this page, so there is nothing to look up yet. */
  fresh: boolean;
  onRetrySettings: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [view, setView] = useState<View>(fresh ? "none" : "loading");
  const [payment, setPayment] = useState<EnquiryPayment | null>(null);
  const [checking, setChecking] = useState(false);

  // Primitives, not the object: the account page builds a new booking object
  // on every render, and that must not restart the status check.
  const { id, token, via } = booking;
  const inAccount = via === "account";

  const check = useCallback(
    () =>
      fetchEnquiryPayment({ id, token, via }).then((result) => {
        if (result.state === "ok") {
          setPayment(result.payment);
          setView(result.payment.status);
        } else if (result.state === "missing") {
          setView("missing");
        } else {
          // A failed poll keeps showing what was last known.
          setView((current) => (current === "loading" ? "error" : current));
        }
      }),
    [id, token, via],
  );

  useEffect(() => {
    if (!fresh) void check();
  }, [fresh, check]);

  // While the coach is verifying, check back on a timer and whenever the
  // visitor returns to the tab — so "confirmed" appears without a reload.
  useEffect(() => {
    if (view !== "submitted") return;

    const tick = () => {
      if (document.visibilityState === "visible") void check();
    };

    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [view, check]);

  function checkNow() {
    setChecking(true);
    void check().finally(() => setChecking(false));
  }

  if (view === "loading") {
    return (
      <div role="status" className={darkCard}>
        <p className="text-sm text-white/60">{t("pay.checking")}</p>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div role="alert" className={darkCard}>
        <h3 className="text-2xl font-black uppercase text-white">
          {t("pay.errorTitle")}
        </h3>

        <p className="mt-3 text-sm leading-7 text-white/60">
          {t("pay.errorText")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setView("loading");
              void check();
            }}
            className={goldPill}
          >
            {t("pay.tryAgain")}
          </button>

          <button type="button" onClick={onClose} className={ghostPill}>
            {inAccount ? t("pay.close") : t("pay.startOver")}
          </button>
        </div>
      </div>
    );
  }

  if (view === "missing") {
    return (
      <div role="status" className={darkCard}>
        <h3 className="text-2xl font-black uppercase text-white">
          {t("pay.closedTitle")}
        </h3>

        <p className="mt-3 text-sm leading-7 text-white/60">
          {t("pay.closedText")}
        </p>

        <button type="button" onClick={onClose} className={`mt-8 ${goldPill}`}>
          {inAccount ? t("pay.close") : t("pay.newRequest")}
        </button>
      </div>
    );
  }

  if (view === "submitted") {
    return (
      <div role="status" className={darkCard}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/40">
          <span
            aria-hidden
            className="h-3 w-3 animate-pulse rounded-full bg-[#d4af37]"
          />
        </div>

        <h3 className="mt-5 text-2xl font-black uppercase text-white">
          {t("pay.reviewTitle")}
        </h3>

        <p className="mt-3 text-sm leading-7 text-white/60">
          {booking.programName
            ? t("pay.review.withProgram").replace(
                "{program}",
                booking.programName,
              )
            : t("pay.review.plain")}
        </p>

        {payment?.txnId && (
          <p className="mt-6 text-xs text-white/45">
            {t("pay.txnId")}{" "}
            <span className="font-mono font-bold text-white/80">
              {payment.txnId}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={checkNow}
          disabled={checking}
          className={`mt-8 ${goldPill}`}
        >
          {checking ? t("pay.checkingNow") : t("pay.checkStatus")}
        </button>

        <p className="mt-6 text-xs leading-6 text-white/35">
          {inAccount ? t("pay.keepAccount") : t("pay.keepDevice")}
        </p>
      </div>
    );
  }

  if (view === "verified") {
    return (
      <div role="status" className={darkCard}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37] text-2xl font-black text-black">
          ✓
        </div>

        <h3 className="mt-5 text-2xl font-black uppercase text-white">
          {t("pay.confirmedTitle")}
        </h3>

        <p className="mt-3 text-sm leading-7 text-white/60">
          {booking.programName
            ? t("pay.confirmed.withProgram").replace(
                "{program}",
                booking.programName,
              )
            : t("pay.confirmed.plain")}
        </p>

        {payment?.txnId && (
          <p className="mt-6 text-xs text-white/45">
            {t("pay.txnId")}{" "}
            <span className="font-mono font-bold text-white/80">
              {payment.txnId}
            </span>
          </p>
        )}

        <button type="button" onClick={onClose} className={`mt-8 ${goldPill}`}>
          {t("pay.done")}
        </button>
      </div>
    );
  }

  // "none" or "rejected": ask for payment and proof.
  return (
    <PayForm
      booking={booking}
      settings={settings}
      rejected={view === "rejected"}
      onRetrySettings={onRetrySettings}
      onClose={onClose}
      onSent={(next) => {
        setPayment(next);
        setView(next.status);
      }}
      onMissing={() => setView("missing")}
      onLocked={() => void check()}
    />
  );
}

function PayForm({
  booking,
  settings,
  rejected,
  onRetrySettings,
  onClose,
  onSent,
  onMissing,
  onLocked,
}: {
  booking: Booking;
  settings: PaymentSettingsLoad | "loading";
  rejected: boolean;
  onRetrySettings: () => void;
  onClose: () => void;
  onSent: (payment: EnquiryPayment) => void;
  onMissing: () => void;
  onLocked: () => void;
}) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const [screenshot, setScreenshot] = useState("");
  const [txnId, setTxnId] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const details =
    settings !== "loading" &&
    settings.state === "online" &&
    paymentsEnabled(settings.settings)
      ? settings.settings
      : null;

  async function handleFile(file: File) {
    setPreparing(true);
    setErrors((prev) => ({ ...prev, screenshot: "" }));

    try {
      setScreenshot(await prepareScreenshot(file));
    } catch (cause) {
      setErrors((prev) => ({
        ...prev,
        screenshot:
          cause instanceof Error ? cause.message : t("pay.err.image"),
      }));
    } finally {
      setPreparing(false);
    }
  }

  async function copyUpiId(upiId: string) {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the ID is on screen to copy by hand.
    }
  }

  async function complete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending || preparing) return;

    const txn = cleanTxnId(txnId);
    const found: Record<string, string> = {};

    if (!screenshot) {
      found.screenshot = t("pay.err.shot");
    }

    if (!isValidTxnId(txn)) {
      found.txnId = t("pay.err.txn");
    }

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setSending(true);
    setSubmitError("");

    const result = await sendPaymentProof(booking, {
      txnId: txn,
      screenshot,
    });

    setSending(false);

    if (result.ok) {
      onSent(result.payment);
      return;
    }

    if (result.kind === "missing") return onMissing();

    // Already sent (say, from another tab) — show where it stands.
    if (result.kind === "locked") return onLocked();

    setSubmitError(result.message);
  }

  function startOver() {
    // From the account page this only closes; the booking stays listed.
    if (booking.via === "account") return onClose();

    const ok = window.confirm(t("pay.confirmStartOver"));

    if (ok) onClose();
  }

  return (
    <div>
      <form
        onSubmit={(event) => void complete(event)}
        noValidate
        className="rounded-[2rem] border border-black/20 bg-[#d4af37]/70 p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-9"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/55">
          {t("pay.step")}
        </p>

        <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight text-black">
          {t("pay.title")}
        </h3>

        {rejected && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-900/30 bg-red-900/10 p-4 text-sm leading-6 text-black"
          >
            <p className="font-bold">{t("pay.rejectedTitle")}</p>
            <p className="mt-1 text-black/75">{t("pay.rejectedText")}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 rounded-2xl bg-black px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
              {booking.programName || t("pay.yourProgram")}
            </p>

            <p className="mt-1 text-2xl font-black text-white">
              {booking.amountLabel || "—"}
            </p>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
            {t("pay.amount")}
          </p>
        </div>

        {settings === "loading" ? (
          <p className="mt-6 text-sm text-black/65">
            {t("pay.loadingDetails")}
          </p>
        ) : !details ? (
          <div className="mt-6 rounded-2xl border border-black/25 bg-black/[0.08] p-4 text-sm leading-6 text-black">
            <p className="font-bold">{t("pay.offlineTitle")}</p>

            <p className="mt-1 text-black/75">{t("pay.offlineText")}</p>

            <button
              type="button"
              onClick={onRetrySettings}
              className="mt-3 font-black underline underline-offset-4"
            >
              {t("pay.tryAgain")}
            </button>
          </div>
        ) : (
          <>
            <div
              className={`mt-6 grid gap-6 ${details.qrImage ? "sm:grid-cols-[11rem_1fr]" : ""}`}
            >
              {details.qrImage && (
                <div className="mx-auto w-44 sm:mx-0">
                  <div className="aspect-square w-44 overflow-hidden rounded-2xl border border-black/15 bg-white p-2">
                    <div className="relative h-full w-full">
                      <Image
                        src={details.qrImage}
                        alt={t("pay.qrAlt").replace("{upi}", details.upiId)}
                        fill
                        sizes="11rem"
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-center text-[11px] font-semibold text-black/60">
                    {t("pay.scan")}
                  </p>
                </div>
              )}

              <div className="min-w-0">
                <p className={labelClass}>{t("pay.upiId")}</p>

                <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-white/70 py-2 pl-4 pr-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-sm font-bold text-black">
                    {details.upiId}
                  </span>

                  <button
                    type="button"
                    onClick={() => void copyUpiId(details.upiId)}
                    className="shrink-0 rounded-full bg-black px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
                  >
                    {copied ? t("pay.copied") : t("pay.copy")}
                  </button>
                </div>

                {details.payeeName && (
                  <p className="mt-2 text-xs text-black/65">
                    {t("pay.paying")} <strong>{details.payeeName}</strong>
                  </p>
                )}

                {/* upi:// only opens an app on a phone. */}
                <a
                  href={upiPayLink(
                    details,
                    booking.amountMinor,
                    booking.programName,
                  )}
                  className="mt-4 flex w-full items-center justify-center rounded-full border border-black px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-black hover:text-white sm:hidden"
                >
                  {t("pay.openApp")}
                </a>

                <ol className="mt-4 list-decimal space-y-1 pl-4 text-xs leading-5 text-black/70">
                  <li>{t("pay.step1")}</li>
                  <li>{t("pay.step2")}</li>
                  <li>{t("pay.step3")}</li>
                </ol>
              </div>
            </div>

            <div className="mt-7 border-t border-black/15 pt-6">
              <p className={labelClass}>{t("pay.shotLabel")}</p>

              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.target.value = "";
                }}
              />

              {screenshot ? (
                <div className="flex items-center gap-4 rounded-xl border border-black/15 bg-white/70 p-3">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-black/10">
                    <Image
                      src={screenshot}
                      alt={t("pay.shotAlt")}
                      fill
                      sizes="3.5rem"
                      unoptimized
                      className="object-cover object-top"
                    />
                  </div>

                  <p className="flex-1 text-xs font-semibold text-black/70">
                    {t("pay.shotAdded")}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={preparing}
                    className="text-xs font-black text-black underline underline-offset-4"
                  >
                    {preparing ? t("pay.preparing") : t("pay.change")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={preparing}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-black/25 bg-white/40 px-4 py-6 text-center transition hover:border-black hover:bg-white/70 disabled:cursor-wait"
                >
                  <span className="text-sm font-black text-black">
                    {preparing ? t("pay.preparing") : t("pay.upload")}
                  </span>

                  <span className="text-xs text-black/55">
                    {t("pay.fileTypes")}
                  </span>
                </button>
              )}

              {errors.screenshot && (
                <p className="mt-2 text-xs font-semibold text-red-900">
                  {errors.screenshot}
                </p>
              )}
            </div>

            <div className="mt-5">
              <label htmlFor="txnId" className={labelClass}>
                {t("pay.txnLabel")}
              </label>

              <input
                id="txnId"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={60}
                value={txnId}
                onChange={(event) => setTxnId(event.target.value)}
                placeholder={t("pay.txnPh")}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-black/60">
                {t("pay.txnHint")}
              </p>

              {errors.txnId && (
                <p className="mt-2 text-xs font-semibold text-red-900">
                  {errors.txnId}
                </p>
              )}
            </div>

            {submitError && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-black/25 bg-black/[0.08] p-4 text-sm font-bold leading-6 text-black"
              >
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || preparing}
              className="mt-7 w-full rounded-full bg-black px-7 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-black disabled:hover:text-white"
            >
              {sending ? t("form.sending") : t("pay.complete")}
            </button>
          </>
        )}
      </form>

      <button
        type="button"
        onClick={startOver}
        className="mt-4 block w-full text-center text-xs font-bold text-black/60 underline underline-offset-4 transition hover:text-black"
      >
        {booking.via === "account" ? t("pay.close") : t("pay.cancel")}
      </button>
    </div>
  );
}
