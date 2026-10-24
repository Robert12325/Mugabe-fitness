import { EQUIPMENT } from "./modes";
import type { Difficulty, Exercise, Muscle, Prescription } from "./types";

/**
 * The few words a prescription is written with. English by default; the
 * website passes its translations so the numbers read the same everywhere.
 */
export type FormatWords = {
  reps: string;
  seconds: string;
  perSide: string;
  minutes: string;
  secondsShort: string;
};

export const ENGLISH_WORDS: FormatWords = {
  reps: "reps",
  seconds: "seconds",
  perSide: "each side",
  minutes: "min",
  secondsShort: "s",
};

/** "3 × 8–12 reps", "3 × 30 seconds each side". */
export function formatPrescription(prescription: Prescription, words: FormatWords = ENGLISH_WORDS) {
  const perSide = prescription.perSide ? ` ${words.perSide}` : "";

  if (prescription.kind === "reps") {
    const [min, max] = prescription.reps;
    const range = min === max ? `${min}` : `${min}–${max}`;
    return `${prescription.sets} × ${range} ${words.reps}${perSide}`;
  }

  return `${prescription.sets} × ${prescription.seconds} ${words.seconds}${perSide}`;
}

/** "45 s", "1 min", "1 min 30 s". */
export function formatRest(seconds: number, words: FormatWords = ENGLISH_WORDS) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const parts = [minutes ? `${minutes} ${words.minutes}` : "", rest || !minutes ? `${rest} ${words.secondsShort}` : ""];
  return parts.filter(Boolean).join(" ");
}

export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const MUSCLE_NAMES: Readonly<Record<Muscle, string>> = {
  chest: "Chest",
  "upper-chest": "Upper chest",
  lats: "Lats",
  "upper-back": "Upper back",
  "lower-back": "Lower back",
  traps: "Traps",
  "front-delts": "Front shoulders",
  "side-delts": "Side shoulders",
  "rear-delts": "Rear shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms and grip",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  adductors: "Inner thighs",
  calves: "Calves",
  abs: "Abs",
  obliques: "Obliques",
  "hip-flexors": "Hip flexors",
  "heart-and-lungs": "Heart and lungs",
};

/** The names of what an exercise needs, in the order it lists them. */
export function equipmentNames(exercise: Exercise) {
  return exercise.equipment.map((id) => EQUIPMENT[id].name);
}
