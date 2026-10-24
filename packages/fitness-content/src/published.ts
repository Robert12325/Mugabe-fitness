import type { Exercise } from "./types";

/**
 * The exercises clients see: only ones the coach has approved.
 *
 * To publish a draft from `exercises/`, move its entry here with `review`
 * set to "coach-approved". Drafts never come through this file, and the
 * package's entry point never imports `exercises/`, so they aren't even
 * in the website's or the app's code, let alone on a screen.
 */
export const PUBLISHED_EXERCISES: readonly Exercise[] = [];
