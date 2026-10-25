// The entry point the website and app import. It must never import
// ./exercises (the drafts): see published.ts. The catalogue checks live at
// "@mugabe/fitness-content/validate", for tests, review tools and the
// website's build, so they aren't shipped to visitors or in the app.
export type * from "./types";
export {
  CATEGORY_NAMES,
  CATEGORY_SLUGS,
  EQUIPMENT,
  MODES,
  MODE_BY_ID,
  MODE_IDS,
  getCategory,
  getMode,
  isModeId,
} from "./modes";
export { CATALOGUE, createCatalogue, isPendingReview, isPublished, type Catalogue } from "./catalogue";
export { PUBLISHED_EXERCISES } from "./published";
export {
  EXERCISE_VIDEOS,
  VIDEO_PRESETS,
  videoFor,
  videoSources,
  type ExerciseVideo,
  type VideoAngle,
  type VideoSources,
} from "./videos";
export {
  DIFFICULTY_NAMES,
  ENGLISH_WORDS,
  MUSCLE_NAMES,
  equipmentNames,
  formatPrescription,
  formatRest,
  type FormatWords,
} from "./format";
