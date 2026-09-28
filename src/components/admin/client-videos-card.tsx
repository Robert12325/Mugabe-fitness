"use client";

import { useEffect, useState } from "react";
import VideoFrame from "@/components/video-frame";
import {
  MAX_CLIENT_VIDEOS,
  MAX_VIDEO_TITLE,
  emptyVideo,
  type ClientVideo,
} from "@/lib/client-videos";
import {
  fetchClientVideos,
  saveClientVideos,
} from "@/lib/client-videos-client";
import { VIDEO_LINK_HELP, parseVideoUrl } from "@/lib/coach-media";
import { Btn, Card, Field, SectionTitle } from "./ui";

type Load = "loading" | "online" | "offline" | "error";

/** Up to five client workout clips, shown between the hero and programs. */
export default function ClientVideosCard() {
  const [load, setLoad] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<ClientVideo[]>([]);
  const [draft, setDraft] = useState<ClientVideo[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchClientVideos({ fresh: true }).then((result) => {
      if (!active) return;

      if (result.state === "online") {
        setSaved(result.videos);
        setDraft(result.videos);
      }

      setLoad(result.state);
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  function edit(next: ClientVideo[]) {
    setDraft(next);
    setNote("");
    setError("");
  }

  function change(id: string, field: "title" | "url", value: string) {
    edit(
      draft.map((video) =>
        video.id === id ? { ...video, [field]: value } : video,
      ),
    );
  }

  function move(index: number, by: number) {
    const next = [...draft];
    const target = index + by;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    edit(next);
  }

  const filled = draft.filter((video) => video.url.trim() !== "");
  const firstBad = filled.find((video) => !parseVideoUrl(video.url.trim()));

  const changed =
    JSON.stringify(filled.map((v) => [v.title.trim(), v.url.trim()])) !==
    JSON.stringify(saved.map((v) => [v.title, v.url]));

  const canSave = load === "online" && changed && !busy && !firstBad;

  async function save() {
    setBusy(true);
    setError("");
    setNote("");

    const result = await saveClientVideos(
      filled.map((video) => ({
        id: video.id,
        title: video.title.trim(),
        url: video.url.trim(),
      })),
    );

    setBusy(false);

    if (!result.ok) return setError(result.message);

    setSaved(result.videos);
    setDraft(result.videos);
    setNote(
      result.videos.length === 0
        ? "Saved. The section is hidden until you add a video."
        : "Saved. It is live on the homepage.",
    );
  }

  return (
    <Card>
      <SectionTitle
        icon="video"
        title="Client workout videos"
        hint={`Shown between the hero and the programs. Up to ${MAX_CLIENT_VIDEOS}. ${VIDEO_LINK_HELP}`}
      />

      {load === "loading" && (
        <p className="mt-6 text-sm text-white/45">Loading…</p>
      )}

      {load === "offline" && (
        <p className="mt-6 text-sm text-amber-200/85">
          The database isn&apos;t reachable, so videos can&apos;t be edited
          right now.
        </p>
      )}

      {load === "error" && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm text-red-300">
            The videos couldn&apos;t be loaded.
          </span>

          <Btn
            size="sm"
            onClick={() => {
              setLoad("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Btn>
        </div>
      )}

      {load === "online" && (
        <>
          <div className="mt-6 space-y-5">
            {draft.length === 0 && (
              <p className="text-sm text-white/45">
                No videos yet. Add one and the section appears on the
                homepage.
              </p>
            )}

            {draft.map((video, index) => (
              <VideoRow
                key={video.id}
                video={video}
                index={index}
                total={draft.length}
                onChange={(field, value) => change(video.id, field, value)}
                onMove={(by) => move(index, by)}
                onRemove={() =>
                  edit(draft.filter((item) => item.id !== video.id))
                }
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Btn
              icon="plus"
              size="sm"
              disabled={draft.length >= MAX_CLIENT_VIDEOS}
              onClick={() => edit([...draft, emptyVideo()])}
            >
              Add video
            </Btn>

            <Btn variant="gold" disabled={!canSave} onClick={() => void save()}>
              {busy ? "Saving…" : "Save videos"}
            </Btn>

            {draft.length >= MAX_CLIENT_VIDEOS && (
              <span className="text-xs text-white/40">
                That&apos;s the maximum of {MAX_CLIENT_VIDEOS}.
              </span>
            )}

            {note && <span className="text-xs text-[#7ddba0]">{note}</span>}

            {error && <span className="text-xs text-red-300">{error}</span>}
          </div>
        </>
      )}
    </Card>
  );
}

function VideoRow({
  video,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  video: ClientVideo;
  index: number;
  total: number;
  onChange: (field: "title" | "url", value: string) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
}) {
  const link = video.url.trim();
  const source = link ? parseVideoUrl(link) : null;
  const invalid = link !== "" && source === null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Video {index + 1}
        </span>

        <span className="ml-auto flex gap-2">
          <Btn
            size="sm"
            title="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </Btn>

          <Btn
            size="sm"
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </Btn>

          <Btn size="sm" variant="danger" onClick={onRemove}>
            Remove
          </Btn>
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Field
          label="Title (optional)"
          icon="tag"
          value={video.title}
          placeholder="Ravi — deadlift day"
          onChange={(value) => onChange("title", value.slice(0, MAX_VIDEO_TITLE))}
        />

        <Field
          label="Video link"
          icon="video"
          value={video.url}
          placeholder="https://youtu.be/…"
          onChange={(value) => onChange("url", value)}
        />
      </div>

      {invalid && (
        <p className="mt-3 text-xs text-red-300">{VIDEO_LINK_HELP}</p>
      )}

      {source && (
        <div className="relative mt-4 aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-black">
          <VideoFrame source={source} title={video.title || "Client workout"} />
        </div>
      )}
    </div>
  );
}
