import { EQUIPMENT } from "./modes";
import type { Exercise, Muscle, WorkoutMode } from "./types";
import type { ExerciseVideo } from "./videos";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Path segments the pages use themselves: /workouts/<mode>/exercises/<slug>. */
const RESERVED = new Set(["exercises"]);

/** Muscles close enough that one exercise can stand in for another. */
const SAME_GROUP: Partial<Record<Muscle, Muscle>> = { "upper-chest": "chest", obliques: "abs" };
const group = (muscle: Muscle) => SAME_GROUP[muscle] ?? muscle;

/**
 * Everything wrong with a catalogue, as readable sentences. An empty list
 * means it is fit to ship. The tests run this over the real catalogue, so
 * an incomplete or inconsistent exercise fails the build's checks.
 */
export function validateCatalogue(
  modes: readonly WorkoutMode[],
  exercises: readonly Exercise[],
  options: {
    /**
     * Checking only part of the catalogue (the website build sees the
     * published list alone): an alternative that isn't in this list may be
     * an unpublished draft, so it is skipped rather than reported. The
     * tests check everything together without this.
     */
    partial?: boolean;
  } = {},
): string[] {
  const problems: string[] = [];
  const modeIds = new Set<string>();

  for (const mode of modes) {
    if (modeIds.has(mode.id)) problems.push(`Mode "${mode.id}" is listed twice.`);
    modeIds.add(mode.id);

    const slugs = new Set<string>();
    for (const category of mode.categories) {
      if (slugs.has(category.slug)) problems.push(`Mode "${mode.id}" lists category "${category.slug}" twice.`);
      if (RESERVED.has(category.slug)) problems.push(`Category "${category.slug}" is a reserved address.`);
      slugs.add(category.slug);
      if (!category.name.trim()) problems.push(`Category "${mode.id}/${category.slug}" has no name.`);
    }
  }

  const exerciseSlugs = new Set<string>();
  const names = new Set<string>();

  for (const exercise of exercises) {
    const label = `Exercise "${exercise.slug}"`;

    if (!SLUG.test(exercise.slug)) problems.push(`${label}: the slug must be lowercase words joined by hyphens.`);
    if (exerciseSlugs.has(exercise.slug)) problems.push(`${label} is listed twice.`);
    exerciseSlugs.add(exercise.slug);

    const nameKey = `${exercise.mode}:${exercise.name.trim().toLowerCase()}`;
    if (names.has(nameKey)) problems.push(`${label}: another ${exercise.mode} exercise has the same name.`);
    names.add(nameKey);

    const mode = modes.find((candidate) => candidate.id === exercise.mode);
    if (!mode) {
      problems.push(`${label}: unknown mode "${exercise.mode}".`);
      continue;
    }

    if (exercise.categories.length === 0) problems.push(`${label}: needs at least one category.`);
    for (const slug of exercise.categories) {
      if (!mode.categories.some((category) => category.slug === slug)) {
        problems.push(`${label}: "${slug}" is not a ${mode.id} category.`);
      }
    }

    if (exercise.primaryMuscles.length === 0) problems.push(`${label}: needs at least one target muscle.`);
    if (exercise.secondaryMuscles.some((muscle) => exercise.primaryMuscles.includes(muscle))) {
      problems.push(`${label}: a muscle is listed as both a target and a secondary muscle.`);
    }
    if (exercise.steps.length < 3) problems.push(`${label}: needs at least 3 steps.`);
    if (exercise.breathing.length === 0) problems.push(`${label}: needs a breathing cue.`);
    if (exercise.mistakes.length === 0) problems.push(`${label}: needs at least one common mistake.`);

    const blank = [...exercise.steps, ...exercise.breathing, ...exercise.tips, ...exercise.mistakes].some(
      (line) => !line.trim(),
    );
    if (blank) problems.push(`${label}: has an empty instruction line.`);

    const kinds = exercise.equipment.map((id) => EQUIPMENT[id]?.kind);
    if (kinds.some((kind) => kind === undefined)) problems.push(`${label}: lists unknown equipment.`);
    if (exercise.mode === "no-equipment" && kinds.some((kind) => kind !== "household")) {
      problems.push(`${label}: a no-equipment exercise can only use household items like a chair or table.`);
    }
    if (exercise.mode === "equipment" && !kinds.some((kind) => kind === "gym" || kind === "home")) {
      problems.push(`${label}: an equipment exercise must name the equipment it uses.`);
    }
    if (exercise.equipment.includes("door-anchor") && !exercise.equipment.includes("resistance-band")) {
      problems.push(`${label}: a door anchor needs a resistance band listed with it.`);
    }

    if (exercise.review === "coach-approved" && !exercise.amountsConfirmed) {
      problems.push(`${label}: its sets, reps and rest must be confirmed by the coach before it is approved.`);
    }

    if (exercise.coachReview) {
      if (exercise.review === "coach-approved") {
        problems.push(`${label}: an approved exercise can't still carry technical-review notes.`);
      }
      if (exercise.review === "published-pending-review") {
        problems.push(`${label}: a published exercise can't carry review notes; they belong in exercises/review-notes.ts.`);
      }
      if (exercise.coachReview.status !== "new" && exercise.coachReview.changes.length === 0 && exercise.coachReview.check.length === 0) {
        problems.push(`${label}: its review notes say nothing.`);
      }
    }

    const { prescription } = exercise;
    const counts =
      prescription.kind === "reps"
        ? [prescription.sets, prescription.reps[0], prescription.reps[1]]
        : [prescription.sets, prescription.seconds];
    if (counts.some((value) => !Number.isInteger(value) || value <= 0)) {
      problems.push(`${label}: sets, reps and seconds must be whole numbers above 0.`);
    }
    if (prescription.kind === "reps" && prescription.reps[0] > prescription.reps[1]) {
      problems.push(`${label}: the rep range is the wrong way round.`);
    }
    if (!Number.isInteger(exercise.restSeconds) || exercise.restSeconds < 0) {
      problems.push(`${label}: rest must be a whole number of seconds.`);
    }

    if (exercise.demo.kind === "diagram" && !exercise.demo.alt.trim()) {
      problems.push(`${label}: the diagram needs a text description.`);
    }
  }

  for (const exercise of exercises) {
    for (const alternative of exercise.alternatives) {
      const match = exercises.find((candidate) => candidate.slug === alternative);
      if (alternative === exercise.slug) {
        problems.push(`Exercise "${exercise.slug}" lists itself as an alternative.`);
      } else if (!match) {
        if (!options.partial) {
          problems.push(`Exercise "${exercise.slug}": alternative "${alternative}" is not in the catalogue.`);
        }
      } else if (match.mode !== exercise.mode) {
        // The modes stay separate: a gym exercise is no swap for someone without a gym.
        problems.push(`Exercise "${exercise.slug}": alternative "${alternative}" is in the other mode.`);
      } else if (!match.primaryMuscles.some((muscle) => exercise.primaryMuscles.map(group).includes(group(muscle)))) {
        // A swap has to train the same thing: a triceps exercise is no stand-in for a curl.
        problems.push(`Exercise "${exercise.slug}": alternative "${alternative}" works different target muscles.`);
      }
    }
  }

  return problems;
}

/**
 * Folders and a name of lowercase words joined by hyphens, e.g.
 * "mugabe-fitness/exercises/push-up". No underscores, so no part can read as
 * a transformation in the address (t_..., c_...), and no "v12" part, which
 * would read as a version number.
 */
const PUBLIC_ID = /^(?!(?:.*\/)?v\d+(?:\/|$))[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real day of the calendar written as YYYY-MM-DD: no 2026-02-30. */
function isCalendarDate(value: string) {
  const match = DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Everything wrong with the video list, as readable sentences. A video may
 * only point at a published exercise, so a clip can never put a draft or a
 * withdrawn exercise on a page; one clip per exercise and angle, and each
 * clip used once.
 */
export function validateVideos(videos: readonly ExerciseVideo[], published: readonly Exercise[]): string[] {
  const problems: string[] = [];
  const exercises = new Map(published.map((exercise) => [exercise.slug, exercise]));
  const seen = new Set<string>();
  const clips = new Set<string>();

  for (const video of videos) {
    const label = `Video for "${video.exercise}"`;
    const exercise = exercises.get(video.exercise);
    if (!exercise) problems.push(`${label}: no published exercise has that slug.`);
    else if (exercise.review === "draft") problems.push(`${label}: the exercise is still a draft.`);
    const key = `${video.exercise}/${video.angle}`;
    if (seen.has(key)) problems.push(`${label}: there is already a ${video.angle} video for it.`);
    seen.add(key);
    if (!PUBLIC_ID.test(video.publicId)) problems.push(`${label}: "${video.publicId}" is not a valid Cloudinary ID.`);
    else if (clips.has(video.publicId)) problems.push(`${label}: "${video.publicId}" is already used by another video.`);
    clips.add(video.publicId);
    if (!Number.isInteger(video.width) || !Number.isInteger(video.height) || video.width <= 0 || video.height <= 0) {
      problems.push(`${label}: width and height must be whole numbers above 0.`);
    }
    if (!(video.durationSeconds >= 1 && video.durationSeconds <= 60)) {
      problems.push(`${label}: a demonstration should last between 1 and 60 seconds.`);
    }
    if (!isCalendarDate(video.reviewedOn)) problems.push(`${label}: reviewedOn must be a real date like 2026-10-24.`);
  }

  return problems;
}
