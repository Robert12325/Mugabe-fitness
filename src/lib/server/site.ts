import {
  DEFAULT_COACH_MEDIA,
  parseCoachMedia,
  type CoachMedia,
} from "@/lib/coach-media";
import { redis } from "./redis";

const COACH_MEDIA = "mf:site:coach-media";

export async function getCoachMedia(): Promise<CoachMedia> {
  const raw = await redis<unknown>("GET", COACH_MEDIA);

  if (typeof raw !== "string") return DEFAULT_COACH_MEDIA;

  try {
    const parsed = parseCoachMedia(JSON.parse(raw));

    // A stored value that no longer validates falls back to the photo
    // rather than breaking the section.
    return parsed.ok ? parsed.value : DEFAULT_COACH_MEDIA;
  } catch {
    return DEFAULT_COACH_MEDIA;
  }
}

export async function setCoachMedia(media: CoachMedia) {
  await redis("SET", COACH_MEDIA, JSON.stringify(media));

  return media;
}
