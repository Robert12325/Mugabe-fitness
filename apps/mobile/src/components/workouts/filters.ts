import { EQUIPMENT, type EquipmentId, type Exercise } from "@mugabe/fitness-content";

/** "No equipment" is its own choice: an exercise whose equipment list is empty. */
export const NO_EQUIPMENT = "none";

export type EquipmentOption = { id: EquipmentId | typeof NO_EQUIPMENT; name: string; count: number };

/**
 * The equipment choices a list of exercises actually offers, straight from
 * the catalogue: "No equipment" first, then each item in the catalogue's
 * own order, with how many exercises use it. Nothing is invented: an item
 * appears only if an exercise lists it.
 */
export function equipmentOptions(exercises: readonly Exercise[]): EquipmentOption[] {
  const options: EquipmentOption[] = [];
  const bare = exercises.filter((exercise) => exercise.equipment.length === 0).length;

  if (bare) options.push({ id: NO_EQUIPMENT, name: "No equipment", count: bare });

  for (const id of Object.keys(EQUIPMENT) as EquipmentId[]) {
    const count = exercises.filter((exercise) => exercise.equipment.includes(id)).length;
    if (count) options.push({ id, name: EQUIPMENT[id].name, count });
  }

  return options;
}

/** Whether an exercise fits the chosen equipment ("all" fits everything). */
export function matchesEquipment(exercise: Exercise, choice: EquipmentOption["id"] | "all") {
  if (choice === "all") return true;
  if (choice === NO_EQUIPMENT) return exercise.equipment.length === 0;
  return exercise.equipment.includes(choice);
}
