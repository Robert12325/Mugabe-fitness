import type { Exercise } from "../types";
import { EQUIPMENT_EXERCISES } from "./equipment";
import { NO_EQUIPMENT_EXERCISES } from "./no-equipment";

/**
 * Every exercise written but not yet approved, in both modes: the coach's
 * review copy. Imported only by tests and review tools, through
 * "@mugabe/fitness-content/exercises"; never by the website or the app.
 */
export const DRAFT_EXERCISES: readonly Exercise[] = [...EQUIPMENT_EXERCISES, ...NO_EQUIPMENT_EXERCISES];
