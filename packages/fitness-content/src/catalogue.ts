import { PUBLISHED_EXERCISES } from "./published";
import type { CategorySlug, Exercise, WorkoutModeId } from "./types";

/** Clients only ever see exercises the coach has approved. */
export function isPublished(exercise: Exercise) {
  return exercise.review === "coach-approved";
}

/**
 * What clients may see of a list of exercises. Every lookup goes through
 * here, so nothing unapproved reaches a page by any route: not in a list,
 * not by its address, not as another exercise's alternative.
 */
export type Catalogue = {
  /** Published exercises in a mode, optionally one category, in catalogue order. */
  published(mode: WorkoutModeId, category?: CategorySlug): Exercise[];
  /** A published exercise of that mode, or undefined for drafts, other modes and unknown slugs. */
  find(mode: string, slug: string): Exercise | undefined;
  /** An exercise's alternatives that are themselves published. */
  alternativesOf(exercise: Exercise): Exercise[];
};

export function createCatalogue(exercises: readonly Exercise[]): Catalogue {
  const visible = exercises.filter(isPublished);

  return {
    published: (mode, category) =>
      visible.filter(
        (exercise) => exercise.mode === mode && (category === undefined || exercise.categories.includes(category)),
      ),
    find: (mode, slug) => visible.find((exercise) => exercise.mode === mode && exercise.slug === slug),
    alternativesOf: (exercise) =>
      exercise.alternatives
        .map((slug) => visible.find((candidate) => candidate.slug === slug && candidate.mode === exercise.mode))
        .filter((candidate): candidate is Exercise => candidate !== undefined),
  };
}

/**
 * The catalogue the website and app show: built from the published list
 * only. The `isPublished` filter above still applies, as a second guard.
 */
export const CATALOGUE = createCatalogue(PUBLISHED_EXERCISES);
