"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  DEFAULT_COACH_PHOTOS,
  MAX_COACH_PHOTOS,
  STORAGE_KEY,
  coachPhotoList,
  exportJSON,
  importJSON,
  resetAll,
  saveSettings,
} from "@/lib/store";
import { formatBytes, prepareImage } from "@/lib/image";
import { removePhotoSlot, savePhotoSlot } from "@/lib/site-photo-client";
import { useDB } from "@/lib/use-store";
import CoachMediaCard from "./coach-media-card";
import PaymentSettingsCard from "./payment-settings-card";
import { Btn, Card, Field, Notice, SectionTitle } from "./ui";

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
    <div className="space-y-8">
      <Card decorated>
        <SectionTitle
          icon="gear"
          title="Site details"
          hint="Update your brand and contact information. This will be shown in the header, footer and contact block."
          flourish
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            icon="tag"
            label="Brand name"
            value={db.settings.brandName}
            onChange={(v) => saveSettings({ brandName: v })}
          />

          <Field
            icon="crown"
            solidIcon
            label="Brand suffix"
            value={db.settings.brandSuffix}
            onChange={(v) => saveSettings({ brandSuffix: v })}
          />

          <Field
            icon="bolt"
            solidIcon
            label="Tagline"
            value={db.settings.tagline}
            onChange={(v) => saveSettings({ tagline: v })}
          />

          <Field
            icon="mail"
            label="Contact email"
            value={db.settings.coachEmail}
            onChange={(v) => saveSettings({ coachEmail: v })}
          />

          <Field
            icon="phone"
            label="Contact phone"
            value={db.settings.coachPhone}
            onChange={(v) => saveSettings({ coachPhone: v })}
          />

          <Field
            icon="shield"
            label="Admin passcode"
            value={db.settings.adminPasscode}
            onChange={(v) => saveSettings({ adminPasscode: v })}
          />
        </div>

        <div className="mt-6">
          <Notice>
            The passcode only hides this screen from a casual visitor.
            Everything lives in the browser, so anyone with devtools can read
            it — do not treat it as real security.
          </Notice>
        </div>
      </Card>

      <PaymentSettingsCard />

      <CoachMediaCard />

      <CoachPhotoCard />

      <Card>
        <SectionTitle
          icon="database"
          title="Backup & data"
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

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Enquiries", value: db.leads.length },
            { label: "Programs", value: db.programs.length },
            { label: "Steps", value: db.method.length },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                {item.label}
              </dt>
              <dd className="mt-1 text-xl font-black text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function CoachPhotoCard() {
  const { settings } = useDB();
  const photos = coachPhotoList(settings);

  return (
    <Card>
      <SectionTitle
        icon="image"
        title="Site photos"
        hint={`Up to ${MAX_COACH_PHOTOS} pictures, spread across the home page so no two sections repeat.`}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {photos.map((photo, index) => (
          <PhotoSlot
            key={index}
            index={index}
            photo={photo}
            override={(settings.coachPhotos[index] ?? "").trim()}
          />
        ))}
      </div>

      <p className="mt-6 text-xs leading-6 text-white/45">
        An uploaded photo only changes what <strong>this browser</strong> shows
        — every other visitor sees the built-in files. To change a picture for
        everyone, put it in the project&apos;s <code>public</code> folder under
        the name each slot lists and redeploy.
      </p>
    </Card>
  );
}

/** Where each photo turns up, so it is clear what a slot is choosing. */
const SLOT_USED_BY = [
  "Home hero, How to start, Your coach",
  "The method — figure and step 01",
  "Why Mugabe Fitness — figure",
  "The last method and reason cards",
];

function PhotoSlot({
  index,
  photo,
  override,
}: {
  index: number;
  photo: string;
  override: string;
}) {
  const { settings } = useDB();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const builtIn = DEFAULT_COACH_PHOTOS[index];

  // A slot whose built-in file has not been added yet would otherwise
  // preview as a broken box. Remembering which src failed (rather than a
  // boolean) resets on its own when the photo changes.
  const [failedSrc, setFailedSrc] = useState("");
  const missing = failedSrc === photo;

  /** Writes one slot without disturbing the others. */
  function saveSlot(value: string) {
    const next = Array.from(
      { length: MAX_COACH_PHOTOS },
      (_, slot) => settings.coachPhotos[slot] ?? "",
    );

    next[index] = value;

    // Slot 0 also clears the pre-gallery single-photo setting, which would
    // otherwise keep winning over an emptied slot.
    return saveSettings(
      index === 0
        ? { coachPhotos: next, coachPhoto: "" }
        : { coachPhotos: next },
    );
  }

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    setNote("");

    try {
      const image = await prepareImage(file);
      const size = `${image.width}×${image.height}, ${formatBytes(image.bytes)}`;

      // Send it to the database first, so the picture is the one every
      // visitor sees rather than a copy trapped in this browser.
      const uploaded = await savePhotoSlot(index, image.dataUrl);

      if (uploaded.ok) {
        saveSlot(uploaded.url);
        setNote(`${size}. Everyone sees it within a minute.`);
        return;
      }

      if (!uploaded.offline) {
        setError(uploaded.message);
        return;
      }

      if (saveSlot(image.dataUrl)) {
        setNote(`${size}. Saved in this browser only — no database connected.`);
      } else {
        // The in-memory copy still shows it, but a reload would lose it, so
        // say so rather than let it silently disappear.
        setError(
          "Showing, but not saved to this browser — storage is full. Try a smaller image, or clear old enquiries.",
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
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">
          Photo {index + 1}
        </span>

        <span
          className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
            override ? "text-white/40" : "text-white/25"
          }`}
        >
          {override ? "Custom" : "Built-in"}
        </span>
      </div>

      <div className="relative mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black">
        {missing ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
              Not added yet
            </span>

            <span className="text-[10px] leading-4 text-white/20">
              Shows photo 1 until this file exists
            </span>
          </div>
        ) : (
          <Image
            src={photo}
            alt={`Site photo ${index + 1}`}
            fill
            sizes="12rem"
            unoptimized={!photo.startsWith("/")}
            onError={() => setFailedSrc(photo)}
            className="object-cover object-top"
          />
        )}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-white/40">
        {SLOT_USED_BY[index]}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Btn variant="gold" onClick={() => fileInput.current?.click()}>
          {busy ? "Working…" : "Upload"}
        </Btn>

        {override.startsWith("data:") && (
          <a
            href={override}
            download={`coach-${index + 1}.jpg`}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/30 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-white/85 transition hover:border-white/35 hover:text-white"
          >
            Download
          </a>
        )}

        {override && (
          <Btn
            variant="danger"
            onClick={() => {
              void removePhotoSlot(index);
              saveSlot("");
              setNote("Back to the built-in photo.");
              setError("");
            }}
          >
            Clear
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

      <div className="mt-3">
        <Field
          icon="image"
          label="Or an image path / URL"
          value={override.startsWith("data:") ? "" : override}
          placeholder={builtIn}
          onChange={saveSlot}
        />

        <p className="mt-2 text-[11px] leading-5 text-white/35">
          Ships with the site as <code>public{builtIn}</code>.
        </p>
      </div>

      {note && (
        <p className="mt-3 text-[11px] font-semibold text-[#d4af37]">{note}</p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
