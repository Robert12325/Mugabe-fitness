"use client";

import { useEffect, useState } from "react";
import VideoFrame from "@/components/video-frame";
import {
  DEFAULT_COACH_MEDIA,
  VIDEO_LINK_HELP,
  parseVideoUrl,
  type CoachMedia,
  type CoachMediaMode,
} from "@/lib/coach-media";
import { fetchCoachMedia, saveCoachMedia } from "@/lib/coach-media-client";
import { Btn, Card, Field, SectionTitle } from "./ui";

type Load = "loading" | "online" | "offline" | "error";

const MODES: { id: CoachMediaMode; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
];

export default function CoachMediaCard() {
  const [load, setLoad] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<CoachMedia>(DEFAULT_COACH_MEDIA);
  const [draft, setDraft] = useState<CoachMedia>(DEFAULT_COACH_MEDIA);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchCoachMedia({ fresh: true }).then((result) => {
      if (!active) return;

      if (result.state === "online") {
        setSaved(result.media);
        setDraft(result.media);
      }

      setLoad(result.state);
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  const link = draft.videoUrl.trim();
  const source = link ? parseVideoUrl(link) : null;
  const linkInvalid = link !== "" && source === null;
  const changed = draft.mode !== saved.mode || link !== saved.videoUrl;

  const canSave =
    load === "online" &&
    changed &&
    !busy &&
    !linkInvalid &&
    !(draft.mode === "video" && !source);

  async function save() {
    setBusy(true);
    setError("");
    setNote("");

    const result = await saveCoachMedia({ mode: draft.mode, videoUrl: link });

    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSaved(result.media);
    setDraft(result.media);
    setNote(
      `Saved. Visitors will see the ${result.media.mode} within about 30 seconds.`,
    );
  }

  return (
    <Card>
      <SectionTitle
        icon="video"
        title="Coach section media"
        hint="Choose whether visitors see a photo or a video beside “Built by someone who lives the work.”"
      />

      {load === "loading" && (
        <p className="text-xs text-white/45">Loading…</p>
      )}

      {load === "offline" && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-6 text-amber-200/85">
          This needs the database, so it only works on the live site.
        </p>
      )}

      {load === "error" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs leading-6 text-red-300">
          <span>Couldn&apos;t load the current setting.</span>

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
          <div
            role="radiogroup"
            aria-label="Coach section media"
            className="flex flex-wrap gap-2"
          >
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={draft.mode === mode.id}
                onClick={() => {
                  setDraft((prev) => ({ ...prev, mode: mode.id }));
                  setNote("");
                }}
                className={`rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  draft.mode === mode.id
                    ? "border-[#d4af37] bg-[#d4af37] text-black"
                    : "border-white/15 text-white/55 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {draft.mode === "photo" ? (
            <p className="text-xs leading-6 text-white/55">
              The section shows the coach photo set in the card below.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:items-start">
              <div className="relative aspect-[4/5] w-56 overflow-hidden rounded-2xl border border-white/10 bg-black">
                {source ? (
                  <VideoFrame source={source} title="Coach video preview" />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                    Preview appears here
                  </div>
                )}
              </div>

              <div>
                <Field
                  label="Video link"
                  value={draft.videoUrl}
                  placeholder="https://youtu.be/…  or  /coach.mp4"
                  onChange={(value) => {
                    setDraft((prev) => ({ ...prev, videoUrl: value }));
                    setNote("");
                  }}
                />

                {linkInvalid && (
                  <p role="alert" className="mt-2 text-xs text-red-300">
                    {VIDEO_LINK_HELP}
                  </p>
                )}

                <ul className="mt-4 space-y-2 text-xs leading-6 text-white/55">
                  <li>
                    <span className="font-bold text-white/75">YouTube:</span>{" "}
                    upload the video (Unlisted works), then Share → Copy link.
                    Shorts links work too.
                  </li>
                  <li>
                    <span className="font-bold text-white/75">Vimeo:</span>{" "}
                    paste the video&apos;s page link.
                  </li>
                  <li>
                    <span className="font-bold text-white/75">
                      Your own file:
                    </span>{" "}
                    put <code>coach.mp4</code> in the project&apos;s{" "}
                    <code>public</code> folder, push it, then use{" "}
                    <code>/coach.mp4</code>. Keep it under about 20&nbsp;MB so
                    it loads quickly on phones.
                  </li>
                </ul>
              </div>
            </div>
          )}

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
