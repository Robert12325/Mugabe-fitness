import { EQUIPMENT } from "./modes";
import type { Exercise, Muscle, WorkoutMode } from "./types";

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
