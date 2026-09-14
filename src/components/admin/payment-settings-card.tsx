"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_PAYMENT_SETTINGS,
  MAX_PAYEE_NAME,
  isValidUpiId,
  paymentsEnabled,
  type PaymentSettings,
} from "@/lib/payment";
import {
  fetchPaymentSettings,
  prepareQrImage,
  savePaymentSettings,
} from "@/lib/payment-client";
import { Btn, Card, Field, SectionTitle } from "./ui";

type Load = "loading" | "online" | "offline" | "error";

export default function PaymentSettingsCard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [load, setLoad] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [draft, setDraft] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchPaymentSettings({ fresh: true }).then((result) => {
      if (!active) return;

      if (result.state === "online") {
        setSaved(result.settings);
        setDraft(result.settings);
      }

      setLoad(result.state);
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  const upiId = draft.upiId.trim();
  const payeeName = draft.payeeName.trim();
  const upiInvalid = upiId !== "" && !isValidUpiId(upiId);

  const changed =
    upiId !== saved.upiId ||
    payeeName !== saved.payeeName ||
    draft.qrImage !== saved.qrImage;

  const canSave =
    load === "online" &&
    changed &&
    !busy &&
    !preparing &&
    !upiInvalid &&
    payeeName.length <= MAX_PAYEE_NAME;

  function edit(patch: Partial<PaymentSettings>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNote("");
  }

  async function handleFile(file: File) {
    setPreparing(true);
    setError("");

    try {
      edit({ qrImage: await prepareQrImage(file) });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That image could not be read.",
      );
    } finally {
      setPreparing(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setNote("");

    const result = await savePaymentSettings({
      upiId,
      payeeName,
      qrImage: draft.qrImage,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSaved(result.settings);
    setDraft(result.settings);
    setNote(
      paymentsEnabled(result.settings)
        ? "Saved. Visitors will see these payment details within about 30 seconds."
        : "Saved. Payments are off — the form just sends a request.",
    );
  }

  return (
    <Card>
      <SectionTitle
        icon="qr"
        title="UPI payment"
        hint="Shown to visitors after they submit the contact form, so they can pay and send proof."
      />

      {load === "loading" && <p className="text-xs text-white/45">Loading…</p>}

      {load === "offline" && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/85">
          This needs the database, so it only works on the live site.
        </p>
      )}

      {load === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs leading-6 text-red-300">
          <span>Couldn&apos;t load the payment details.</span>

          <Btn
            size="sm"
            onClick={() => {
              setLoad("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </Btn>
        </div>
      )}

      {load === "online" && (
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-xs text-white/55">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${paymentsEnabled(saved) ? "bg-[#5cc98a]" : "bg-white/25"}`}
            />
            {paymentsEnabled(saved)
              ? "Payments are on."
              : "Payments are off — add a UPI ID to turn them on."}
          </p>

          <div className="grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-start">
            <div>
              <div className="aspect-square w-48 overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
                {draft.qrImage ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={draft.qrImage}
                      alt="UPI QR code"
                      fill
                      sizes="12rem"
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="-m-2 flex h-[calc(100%+1rem)] items-center justify-center bg-black px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                    No QR code
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Btn
                  size="sm"
                  disabled={preparing}
                  onClick={() => fileInput.current?.click()}
                >
                  {preparing
                    ? "Working…"
                    : draft.qrImage
                      ? "Replace QR"
                      : "Upload QR"}
                </Btn>

                {draft.qrImage && (
                  <Btn size="sm" variant="danger" onClick={() => edit({ qrImage: "" })}>
                    Remove
                  </Btn>
                )}
              </div>

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
            </div>

            <div className="space-y-4">
              <div>
                <Field
                  label="UPI ID"
                  value={draft.upiId}
                  placeholder="yourname@okaxis"
                  onChange={(value) => edit({ upiId: value })}
                />

                {upiInvalid && (
                  <p role="alert" className="mt-2 text-xs text-red-300">
                    Enter a UPI ID like name@okaxis.
                  </p>
                )}
              </div>

              <Field
                label="Payee name (optional)"
                value={draft.payeeName}
                placeholder="Name as shown in UPI apps"
                onChange={(value) => edit({ payeeName: value })}
              />

              <ul className="space-y-2 text-xs leading-6 text-white/55">
                <li>
                  <span className="font-bold text-white/75">QR code:</span>{" "}
                  save it from your UPI app (GPay, PhonePe, Paytm → your
                  profile → QR code) and upload it here.
                </li>
                <li>
                  <span className="font-bold text-white/75">Checking:</span>{" "}
                  visitors pay the program price, then send a screenshot and
                  transaction ID. Review them under Enquiries — verify only
                  once the money shows in your bank or UPI app.
                </li>
                <li>
                  <span className="font-bold text-white/75">Turning off:</span>{" "}
                  clear the UPI ID and save.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Btn variant="gold" disabled={!canSave} onClick={() => void save()}>
              {busy ? "Saving…" : "Save"}
            </Btn>

            {changed && !busy && (
              <span className="text-xs text-white/45">Unsaved changes</span>
            )}
          </div>

          {note && (
            <p className="text-xs font-semibold text-[#d4af37]">{note}</p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs leading-6 text-red-300"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
