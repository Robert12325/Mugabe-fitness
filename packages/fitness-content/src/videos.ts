/**
 * Demonstration videos, kept apart from the exercises' instructions.
 *
 * One entry per real, recorded and reviewed clip. A clip goes in only once
 * the coach has recorded it and it has been checked against the exercise's
 * steps: never a placeholder, a clip of a different movement, or generated
 * footage. An exercise with no entry shows "Demonstration coming soon".
 *
 * The clips live in the business's Cloudinary account. Only their IDs are
 * stored here; addresses are built from the account's public cloud name,
 * so the website and the app can share this list.
 */

export type VideoAngle = "front" | "side" | "front-side";

export type ExerciseVideo = {
  /** The exercise's slug. Must be a published exercise. */
  exercise: string;
  /** The clip's Cloudinary public ID, e.g. "mugabe-fitness/exercises/push-up". */
  publicId: string;
  angle: VideoAngle;
  durationSeconds: number;
  /** The recorded size, for the player's shape before it loads (portrait: 9:16). */
  width: number;
  height: number;
  /** When the coach reviewed the clip against the exercise's steps (YYYY-MM-DD). */
  reviewedOn: string;
};

/** Reviewed, real footage only. Empty until the first clip is approved. */
export const EXERCISE_VIDEOS: readonly ExerciseVideo[] = [];

/**
 * The account's two named transformations: a compressed 720p video, and a
 * poster frame. Named, so the account can turn on Strict transformations
 * and refuse any other size someone makes up in a URL.
 */
export const VIDEO_PRESETS = { video: "mf_demo", poster: "mf_poster" } as const;

/** A public cloud name is letters, digits, hyphens and underscores. */
const CLOUD_NAME = /^[a-z0-9_-]+$/i;

export type VideoSources = { src: string; poster: string; width: number; height: number };

/** The video and poster addresses for one clip, or null without a valid cloud name. */
export function videoSources(
  video: ExerciseVideo,
  cloudName: string | undefined,
  presets: { video: string; poster: string } = VIDEO_PRESETS,
): VideoSources | null {
  if (!cloudName || !CLOUD_NAME.test(cloudName)) return null;
  const base = `https://res.cloudinary.com/${cloudName}/video/upload`;
  return {
    src: `${base}/t_${presets.video}/${video.publicId}.mp4`,
    poster: `${base}/t_${presets.poster}/${video.publicId}.jpg`,
    width: video.width,
    height: video.height,
  };
}

/** The reviewed clip for an exercise, if there is one. Front views first. */
export function videoFor(slug: string, videos: readonly ExerciseVideo[] = EXERCISE_VIDEOS) {
  const order: VideoAngle[] = ["front", "front-side", "side"];
  return videos
    .filter((video) => video.exercise === slug)
    .sort((a, b) => order.indexOf(a.angle) - order.indexOf(b.angle))[0];
}
