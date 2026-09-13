"use client";

import { useSyncExternalStore } from "react";
import {
  discardLocalBilling,
  getBillingSyncServerState,
  getBillingSyncState,
  refreshBilling,
  subscribeBillingSync,
  uploadLocalBilling,
} from "@/lib/billing-sync";
import { Btn } from "./ui";

export default function BillingSyncNotice() {
  const sync = useSyncExternalStore(
    subscribeBillingSync,
    getBillingSyncState,
    getBillingSyncServerState,
  );

  switch (sync.status) {
    case "idle":
      return null;

    case "loading":
      return (
        <p className="text-xs text-white/45">Loading clients and payments…</p>
      );

    case "synced":
    case "saving":
      return (
        <p className="flex items-center gap-2 text-xs text-white/45">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              sync.status === "saving" ? "bg-[#e7c65c]" : "bg-[#5cc98a]"
            }`}
          />
          {sync.status === "saving"
            ? "Saving changes…"
            : "Live — clients and payments sync across your devices."}
        </p>
      );

    case "offline":
      return (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/85">
          Not connected to the database — clients and payments are saved in
          this browser only.
        </div>
      );

    case "error":
      return (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs leading-6 text-red-300"
        >
          <span>
            {sync.message} Your latest changes are kept in this browser and
            will be sent again.
          </span>

          <Btn size="sm" onClick={refreshBilling}>
            Retry
          </Btn>
        </div>
      );

    case "migrate":
      return (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/85">
          <p className="font-bold text-amber-100">
            This browser has {sync.clients} client
            {sync.clients === 1 ? "" : "s"} and {sync.payments} invoice
            {sync.payments === 1 ? "" : "s"} that aren&apos;t on the server
            yet.
          </p>

          <p className="mt-1">
            Upload them so they show on every device, or discard this
            browser&apos;s copy and start fresh.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" variant="gold" onClick={uploadLocalBilling}>
              Upload to server
            </Btn>

            <Btn
              size="sm"
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    "Discard this browser's clients and invoices? This cannot be undone.",
                  )
                ) {
                  discardLocalBilling();
                }
              }}
            >
              Discard
            </Btn>
          </div>
        </div>
      );
  }
}
