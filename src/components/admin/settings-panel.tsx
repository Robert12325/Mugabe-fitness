"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  STORAGE_KEY,
  exportJSON,
  importJSON,
  resetAll,
  saveSettings,
} from "@/lib/store";
import { formatBytes, prepareImage } from "@/lib/image";
import { useDB } from "@/lib/use-store";
import { Btn, Card, Field, SectionTitle } from "./ui";

export default function SettingsPanel() {
  const db = useDB();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function handleExport() {
    const url = URL.createObjectURL(
      new Blob([exportJSON()], { type: "application/json" }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mugabe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      importJSON(await file.text());
      flash("Backup restored.");
    } catch {
      flash("That file could not be read as a valid backup.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="Site details"
          hint="Shown in the header, footer, and contact block."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Brand name"
            value={db.settings.brandName}
            onChange={(v) => saveSettings({ brandName: v })}
          />

          <Field
            label="Brand suffix"
            value={db.settings.brandSuffix}
            onChange={(v) => saveSettings({ brandSuffix: v })}
          />

          <Field
            label="Tagline"
            value={db.settings.tagline}
            onChange={(v) => saveSettings({ tagline: v })}
          />

          <Field
            label="Contact email"
            value={db.settings.coachEmail}
            onChange={(v) => saveSettings({ coachEmail: v })}
          />

          <Field
            label="Contact phone"
            value={db.settings.coachPhone}
            onChange={(v) => saveSettings({ coachPhone: v })}
          />

          <Field
            label="Admin passcode"
            value={db.settings.adminPasscode}
            onChange={(v) => saveSettings({ adminPasscode: v })}
          />
        </div>

        <p className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/80">
          The passcode only hides this screen from a casual visitor. Everything
          lives in the browser, so anyone with devtools can read it — do not
          treat it as real security.
        </p>
      </Card>

      <CoachPhotoCard />

      <Card>
        <SectionTitle
          title="Data"
          hint={`Stored in this browser under localStorage key "${STORAGE_KEY}".`}
        />

        <div className="flex flex-wrap gap-2">
          <Btn onClick={handleExport}>Download backup (JSON)</Btn>

          <Btn onClick={() => fileInput.current?.click()}>Restore backup</Btn>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = "";
            }}
          />

          <Btn
            variant="danger"
            onClick={() => {
              const ok = window.confirm(
                "Reset everything — enquiries, programs, method, and settings — back to defaults?",
              );

              if (ok) {
                resetAll();
                flash("All data reset to defaults.");
              }
            }}
          >
            Reset all data
          </Btn>
        </div>

        {notice && (
          <p className="mt-4 text-xs font-semibold text-[#d4af37]">{notice}</p>
        )}

        <dl className="mt-6 grid gap-3 text-xs text-white/40 sm:grid-cols-3">
          <div>
            <dt className="font-black uppercase tracking-[0.15em]">Enquiries</dt>
            <dd className="mt-1 text-white/70">{db.leads.length}</dd>
          </div>

          <div>
            <dt className="font-black uppercase tracking-[0.15em]">Programs</dt>
            <dd className="mt-1 text-white/70">{db.programs.length}</dd>
          </div>

          <div>
            <dt className="font-black uppercase tracking-[0.15em]">Steps</dt>
            <dd className="mt-1 text-white/70">{db.method.length}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

function CoachPhotoCard() {
  const { settings } = useDB();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const photo = settings.coachPhoto.trim();

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    setNote("");

    try {
      const image = await prepareImage(file);
      const persisted = saveSettings({ coachPhoto: image.dataUrl });

      if (persisted) {
        setNote(
          `Saved — ${image.width}×${image.height}, ${formatBytes(image.bytes)}.`,
        );
      } else {
        // The in-memory copy still shows it, but a reload would lose it, so
        // say so rather than let it silently disappear.
        setError(
          "The photo is showing but could not be saved to this browser — storage is full. Try a smaller image, or clear old enquiries.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "That image could not be read.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle
        title="Coach photo"
        hint="Shown in the Your Coach section on the home page."
      />

      <div className="grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-start">
        <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-2xl border border-white/10 bg-black">
          {photo ? (
            <Image
              src={photo}
              alt="Current coach photo"
              fill
              sizes="10rem"
              unoptimized
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              No photo
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="gold" onClick={() => fileInput.current?.click()}>
              {busy ? "Working…" : photo ? "Replace photo" : "Upload photo"}
            </Btn>

            {photo && (
              <Btn
                variant="danger"
                onClick={() => {
                  saveSettings({ coachPhoto: "" });
                  setNote("Photo removed.");
                  setError("");
                }}
              >
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

          <p className="mt-4 text-xs leading-6 text-white/35">
            JPG, PNG, WebP or AVIF. Large photos are scaled down to 1400px
            before saving, so they fit in this browser&apos;s storage.
          </p>

          <div className="mt-4">
            <Field
              label="Or use an image path / URL"
              value={photo.startsWith("data:") ? "" : photo}
              placeholder="/coach.jpg"
              onChange={(v) => saveSettings({ coachPhoto: v })}
            />

            <p className="mt-2 text-xs leading-6 text-white/30">
              Put a file in the project&apos;s <code>public</code> folder and
              reference it here (for example <code>/coach.jpg</code>) to ship
              the photo with the site instead of storing it per browser.
            </p>
          </div>

          {note && (
            <p className="mt-4 text-xs font-semibold text-[#d4af37]">{note}</p>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs leading-6 text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
