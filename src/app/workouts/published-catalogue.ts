import { MODES, PUBLISHED_EXERCISES, type Exercise } from "@mugabe/fitness-content";
import { validateCatalogue } from "@mugabe/fitness-content/validate";

/**
 * Fails the website build if the published catalogue breaks any rule.
 * Called while pages are generated, on the server only, so the checks
 * never ship to visitors. Drafts are checked by the mobile app's tests.
 */
export function assertPublishedCatalogue(exercises: readonly Exercise[] = PUBLISHED_EXERCISES) {
  const problems = validateCatalogue(MODES, exercises);

  if (problems.length > 0) {
    throw new Error(`The published exercise catalogue has problems:\n- ${problems.join("\n- ")}`);
  }
}
