import * as entryPoint from "@mugabe/fitness-content";
import {
  CATALOGUE,
  EQUIPMENT,
  MODES,
  PUBLISHED_EXERCISES,
  createCatalogue,
  formatPrescription,
  formatRest,
  type Exercise,
} from "@mugabe/fitness-content";
import { DRAFT_EXERCISES } from "@mugabe/fitness-content/exercises";
import { PENDING_REVIEW_NOTES } from "@mugabe/fitness-content/exercises/review-notes";
import { WITHDRAWN_EXERCISES } from "@mugabe/fitness-content/exercises/withdrawn";
import { validateCatalogue } from "@mugabe/fitness-content/validate";

/**
 * The shared exercise catalogue on its own: the real content, what clients
 * may see of it, the checks every exercise must pass, and how amounts read.
 *
 * Drafts live apart from what clients see: the entry point the website and
 * app import has only the published list. Tests reach the drafts through
 * "@mugabe/fitness-content/exercises".
 */

const EXERCISES = [...PUBLISHED_EXERCISES, ...DRAFT_EXERCISES];

// Held back from early publishing until the coach answers their safety questions.
const HELD = [
  "barbell-bench-press",
  "barbell-back-squat",
  "romanian-deadlift",
  "hanging-knee-raise",
  "kettlebell-swing",
  "superman",
  "elevated-pike-push-up",
  "chair-dip",
];

const approve = (exercise: Exercise): Exercise => ({ ...exercise, review: "coach-approved" });
const bySlug = (slug: string) => {
  const exercise = EXERCISES.find((candidate) => candidate.slug === slug);
  if (!exercise) throw new Error(`No exercise "${slug}"`);
  return exercise;
};

describe("the real catalogue", () => {
  it("passes every check, withdrawn exercises included", () => {
    expect(validateCatalogue(MODES, EXERCISES)).toEqual([]);
    expect(validateCatalogue(MODES, [...EXERCISES, ...WITHDRAWN_EXERCISES])).toEqual([]);
  });

  it("keeps every sets, reps and rest figure a draft recommendation: none is confirmed yet", () => {
    expect(EXERCISES.every((exercise) => exercise.amountsConfirmed === undefined)).toBe(true);
  });

  it("has at least three distinct drafts in every category of both modes", () => {
    const thin: string[] = [];
    for (const mode of MODES) {
      for (const category of mode.categories) {
        const count = EXERCISES.filter(
          (exercise) => exercise.mode === mode.id && exercise.categories.includes(category.slug),
        ).length;
        if (count < 3) thin.push(`${mode.id}/${category.slug}: ${count}`);
      }
    }
    expect(thin).toEqual([]);
  });

  it("keeps drafts and published exercises apart, each marked as what it is", () => {
    expect(DRAFT_EXERCISES.every((exercise) => exercise.review === "draft")).toBe(true);
    expect(
      PUBLISHED_EXERCISES.every((exercise) => ["coach-approved", "published-pending-review"].includes(exercise.review)),
    ).toBe(true);
  });

  it("publishes 44 ahead of the coach's review, none marked as coach-approved", () => {
    expect(PUBLISHED_EXERCISES).toHaveLength(44);
    expect(PUBLISHED_EXERCISES.every((exercise) => exercise.review === "published-pending-review")).toBe(true);
    expect(PUBLISHED_EXERCISES.some((exercise) => exercise.review === "coach-approved")).toBe(false);
  });

  it("holds back the 8 with open safety questions, and shows them nowhere", () => {
    const drafts = DRAFT_EXERCISES.map((exercise) => exercise.slug);
    expect(HELD.every((slug) => drafts.includes(slug))).toBe(true);
    for (const mode of MODES) {
      for (const slug of HELD) expect(CATALOGUE.find(mode.id, slug)).toBeUndefined();
      expect(CATALOGUE.published(mode.id).some((exercise) => HELD.includes(exercise.slug))).toBe(false);
    }
    expect(CATALOGUE.find("no-equipment", "push-up")?.name).toBe("Push-up");
    expect(CATALOGUE.find("equipment", "pull-up")?.name).toBe("Pull-up");
  });

  it("keeps every other draft a new exercise awaiting the coach, hidden from clients", () => {
    const others = DRAFT_EXERCISES.filter((exercise) => !HELD.includes(exercise.slug));
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((exercise) => exercise.coachReview?.status === "new")).toBe(true);
    for (const exercise of others) expect(CATALOGUE.find(exercise.mode, exercise.slug)).toBeUndefined();
  });

  it("has at most 10 exercises in any category, counting published and drafts", () => {
    const over: string[] = [];
    for (const mode of MODES) {
      for (const category of mode.categories) {
        const count = EXERCISES.filter(
          (exercise) => exercise.mode === mode.id && exercise.categories.includes(category.slug),
        ).length;
        if (count > 10) over.push(`${mode.id}/${category.slug}: ${count}`);
      }
    }
    expect(over).toEqual([]);
  });

  it("keeps review notes off published exercises, in a file that never ships", () => {
    expect(PUBLISHED_EXERCISES.some((exercise) => exercise.coachReview)).toBe(false);
    const published = new Set(PUBLISHED_EXERCISES.map((exercise) => exercise.slug));
    expect(Object.keys(PENDING_REVIEW_NOTES).every((slug) => published.has(slug))).toBe(true);
    expect(PENDING_REVIEW_NOTES["pull-up"]?.check.join(" ")).toMatch(/door-frame bars/);
    expect(Object.keys(entryPoint)).not.toContain("PENDING_REVIEW_NOTES");
  });

  it("hides held exercises when a published one lists them as alternatives", () => {
    const crunch = CATALOGUE.find("equipment", "cable-crunch");
    expect(crunch?.alternatives).toEqual(["hanging-knee-raise"]);
    expect(CATALOGUE.alternativesOf(crunch!)).toEqual([]);
  });

  it("doesn't hand drafts, withdrawn exercises or the checks to the website or app", () => {
    expect(Object.keys(entryPoint)).not.toContain("DRAFT_EXERCISES");
    expect(Object.keys(entryPoint)).not.toContain("WITHDRAWN_EXERCISES");
    expect(Object.keys(entryPoint)).not.toContain("EXERCISES");
    expect(Object.keys(entryPoint)).not.toContain("validateCatalogue");
  });

  it("allows only household items in the no-equipment mode, and names them", () => {
    for (const exercise of EXERCISES.filter((candidate) => candidate.mode === "no-equipment")) {
      expect(exercise.equipment.every((id) => EQUIPMENT[id].kind === "household")).toBe(true);
    }
    expect(bySlug("incline-push-up").equipment).toEqual(["sturdy-table"]);
    expect(bySlug("chair-dip").equipment).toEqual(["sturdy-chair"]);
  });

  it("puts pull-ups, chin-ups and hanging knee raises in the equipment mode, with their bar", () => {
    expect(bySlug("pull-up")).toMatchObject({ mode: "equipment", categories: ["back"], equipment: ["pull-up-bar"] });
    expect(bySlug("chin-up")).toMatchObject({
      mode: "equipment",
      categories: ["back", "biceps-triceps"],
      equipment: ["pull-up-bar"],
    });
    expect(bySlug("hanging-knee-raise")).toMatchObject({ mode: "equipment", equipment: ["hanging-station"] });
    expect(EQUIPMENT["pull-up-bar"]).toEqual({ name: "Securely fixed pull-up bar", kind: "home" });
  });

  it("makes pull-ups and chin-ups conditional on a properly fitted bar, without inventing a load limit", () => {
    for (const slug of ["pull-up", "chin-up"]) {
      const exercise = bySlug(slug);
      expect(exercise.steps[0]).toMatch(/manufacturer's instructions/);
      expect(exercise.steps[0]).toMatch(/maximum user weight covers your body weight/);
      expect(exercise.tips.join(" ")).toMatch(/door-frame bar only on a frame its instructions say is suitable/);
      // No number of kilograms or pounds anywhere: the bar's own limit applies.
      expect(JSON.stringify(exercise)).not.toMatch(/\d+\s*(kg|kilo|lb|pound)/i);
    }
  });

  it("requires a rack or uprights with safety arms for the bench press", () => {
    expect(bySlug("barbell-bench-press").equipment).toContain("rack-with-safeties");
    expect(bySlug("barbell-bench-press").steps[0]).toMatch(/safety arms/);
    expect(bySlug("romanian-deadlift").steps[0]).toMatch(/rack at about mid-thigh/);
  });

  it("names the equipment of every equipment-mode exercise", () => {
    for (const exercise of EXERCISES.filter((candidate) => candidate.mode === "equipment")) {
      expect(exercise.equipment.some((id) => EQUIPMENT[id].kind !== "household")).toBe(true);
    }
  });

  it("treats a door anchor as home kit that needs a resistance band", () => {
    expect(EQUIPMENT["door-anchor"].kind).toBe("home");
    expect(EQUIPMENT["resistance-band"].kind).toBe("home");
  });

  it("takes the inverted table row out of the proposed catalogue, on record only", () => {
    expect(EXERCISES.some((exercise) => exercise.slug === "inverted-table-row")).toBe(false);
    expect(WITHDRAWN_EXERCISES.map((exercise) => [exercise.slug, exercise.coachReview?.status, exercise.review])).toEqual([
      ["inverted-table-row", "removed", "draft"],
    ]);
    for (const mode of MODES) expect(CATALOGUE.find(mode.id, "inverted-table-row")).toBeUndefined();
    expect(bySlug("prone-y-t-raise").tips.join(" ")).toMatch(/one Y lift plus one T lift is one rep/);
  });

  it("has the close-grip push-up in Arms, published ahead of review and flagged for the coach", () => {
    expect(bySlug("close-grip-push-up")).toMatchObject({
      mode: "no-equipment",
      categories: ["arms"],
      primaryMuscles: ["triceps"],
      equipment: [],
      review: "published-pending-review",
    });
    expect(PENDING_REVIEW_NOTES["close-grip-push-up"]?.status).toBe("new");
    expect(PENDING_REVIEW_NOTES["close-grip-push-up"]?.check.join(" ")).toMatch(/Diamond push-up/);
  });

  it("lists a shared exercise once, under each of its categories", () => {
    expect(EXERCISES.filter((exercise) => exercise.slug === "chin-up")).toHaveLength(1);
    expect(EXERCISES.filter((exercise) => exercise.slug === "prone-y-t-raise")).toHaveLength(1);
    expect(bySlug("prone-y-t-raise").categories).toEqual(["back", "shoulders"]);
  });

  it("uses only the approved placeholder for demonstrations, for now", () => {
    expect(EXERCISES.every((exercise) => exercise.demo.kind === "coming-soon")).toBe(true);
  });
});

describe("what clients may see", () => {
  const pushUp = approve(bySlug("push-up"));
  const incline = approve(bySlug("incline-push-up"));
  const decline: Exercise = { ...bySlug("decline-push-up"), review: "draft" }; // a draft here
  const bench = approve(bySlug("barbell-bench-press"));
  const catalogue = createCatalogue([pushUp, incline, decline, bench]);

  it("lists only approved exercises, by mode and by category", () => {
    expect(catalogue.published("no-equipment").map((e) => e.slug)).toEqual(["push-up", "incline-push-up"]);
    expect(catalogue.published("equipment").map((e) => e.slug)).toEqual(["barbell-bench-press"]);
    expect(catalogue.published("no-equipment", "chest").map((e) => e.slug)).toEqual(["push-up", "incline-push-up"]);
    expect(catalogue.published("no-equipment", "back")).toEqual([]);
  });

  it("finds an exercise only in its own mode, and never a draft", () => {
    expect(catalogue.find("no-equipment", "push-up")?.name).toBe("Push-up");
    expect(catalogue.find("equipment", "push-up")).toBeUndefined();
    expect(catalogue.find("no-equipment", "decline-push-up")).toBeUndefined();
    expect(catalogue.find("no-equipment", "nope")).toBeUndefined();
    expect(catalogue.find("bodyweight", "push-up")).toBeUndefined();
  });

  it("offers only approved alternatives", () => {
    // Push-up lists incline (approved) and decline (draft).
    expect(catalogue.alternativesOf(pushUp).map((e) => e.slug)).toEqual(["incline-push-up"]);
  });
});

describe("checks on incomplete or inconsistent exercises", () => {
  const base = bySlug("push-up");
  const check = (exercise: Exercise, others: Exercise[] = []) => validateCatalogue(MODES, [exercise, ...others]);

  it.each<[string, Partial<Exercise>, string]>([
    ["no steps", { steps: [] }, "needs at least 3 steps"],
    ["no breathing cue", { breathing: [] }, "needs a breathing cue"],
    ["no common mistakes", { mistakes: [] }, "needs at least one common mistake"],
    ["no target muscle", { primaryMuscles: [] }, "needs at least one target muscle"],
    ["no category", { categories: [] }, "needs at least one category"],
    ["a blank instruction", { tips: ["  "] }, "has an empty instruction line"],
    ["zero sets", { prescription: { kind: "reps", sets: 0, reps: [8, 12] } }, "whole numbers above 0"],
    ["a reversed rep range", { prescription: { kind: "reps", sets: 3, reps: [12, 8] } }, "wrong way round"],
    ["fractional rest", { restSeconds: 45.5 }, "rest must be a whole number"],
    ["gym kit without a gym", { equipment: ["dumbbells"] }, "can only use household items"],
    ["a pull-up bar without a gym", { equipment: ["pull-up-bar"] }, "can only use household items"],
    ["a category from the other mode", { categories: ["biceps-triceps"] }, "is not a no-equipment category"],
    ["a muscle twice", { secondaryMuscles: ["chest"] }, "both a target and a secondary muscle"],
    ["a diagram with no description", { demo: { kind: "diagram", id: "push-up", alt: " " } }, "needs a text description"],
    ["an unknown alternative", { alternatives: ["nope"] }, 'alternative "nope" is not in the catalogue'],
    ["itself as an alternative", { alternatives: ["push-up"] }, "lists itself as an alternative"],
    ["a badly written slug", { slug: "Push Up" }, "lowercase words joined by hyphens"],
  ])("rejects an exercise with %s", (_, change, problem) => {
    const problems = check({ ...base, alternatives: [], ...change });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(problem);
  });

  it("rejects an equipment exercise that doesn't name its equipment", () => {
    const problems = check({ ...bySlug("barbell-bench-press"), equipment: [], alternatives: [] });
    expect(problems).toEqual(['Exercise "barbell-bench-press": an equipment exercise must name the equipment it uses.']);
  });

  it("rejects a door anchor without a resistance band, and in the no-equipment mode", () => {
    const anchored = { ...bySlug("cable-face-pull"), alternatives: [] };
    expect(check({ ...anchored, equipment: ["door-anchor"] })).toEqual([
      'Exercise "cable-face-pull": a door anchor needs a resistance band listed with it.',
    ]);
    expect(check({ ...anchored, equipment: ["door-anchor", "resistance-band"] })).toEqual([]);
    expect(check({ ...base, alternatives: [], equipment: ["door-anchor", "resistance-band"] })[0]).toContain(
      "can only use household items",
    );
  });

  it("rejects the cross-swaps the technical review removed", () => {
    // A biceps curl offered for triceps work, and a press for a pulling move.
    const curl = { ...bySlug("dumbbell-biceps-curl"), alternatives: ["cable-triceps-pushdown"] };
    const pushdown = { ...bySlug("cable-triceps-pushdown"), alternatives: [] };
    expect(check(curl, [pushdown])).toEqual([
      'Exercise "dumbbell-biceps-curl": alternative "cable-triceps-pushdown" works different target muscles.',
    ]);
    const yt = { ...bySlug("prone-y-t-raise"), alternatives: ["pike-push-up"] };
    const pike = { ...bySlug("pike-push-up"), alternatives: [] };
    expect(check(yt, [pike])).toEqual([
      'Exercise "prone-y-t-raise": alternative "pike-push-up" works different target muscles.',
    ]);
  });

  it("won't let an approved exercise keep technical-review notes", () => {
    const approvedWithNotes = { ...approve({ ...bySlug("superman"), alternatives: [] }), amountsConfirmed: true as const };
    expect(check(approvedWithNotes)).toEqual([
      'Exercise "superman": an approved exercise can\'t still carry technical-review notes.',
    ]);
  });

  it("won't let a published exercise carry review notes", () => {
    const withNotes = { ...bySlug("push-up"), alternatives: [], coachReview: { status: "changed" as const, changes: ["x"], check: [] } };
    expect(check(withNotes)).toEqual([
      'Exercise "push-up": a published exercise can\'t carry review notes; they belong in exercises/review-notes.ts.',
    ]);
  });

  it("lets the build check the published list alone, without reporting draft alternatives", () => {
    // Cable crunch lists the held Hanging knee raise.
    const crunch = bySlug("cable-crunch");
    expect(validateCatalogue(MODES, [crunch])).toEqual([
      'Exercise "cable-crunch": alternative "hanging-knee-raise" is not in the catalogue.',
    ]);
    expect(validateCatalogue(MODES, [crunch], { partial: true })).toEqual([]);
    expect(validateCatalogue(MODES, PUBLISHED_EXERCISES, { partial: true })).toEqual([]);
  });

  it("won't let an exercise be approved before the coach confirms its amounts", () => {
    const { coachReview, ...withoutNotes } = bySlug("push-up");
    expect(coachReview).toBeUndefined();
    const approved = approve({ ...withoutNotes, alternatives: [] });
    expect(check(approved)).toEqual([
      'Exercise "push-up": its sets, reps and rest must be confirmed by the coach before it is approved.',
    ]);
    expect(check({ ...approved, amountsConfirmed: true })).toEqual([]);
  });

  it("keeps the modes apart: an alternative must be in the same mode", () => {
    const problems = check({ ...base, alternatives: ["barbell-bench-press"] }, [
      { ...bySlug("barbell-bench-press"), alternatives: [] },
    ]);
    expect(problems).toEqual(['Exercise "push-up": alternative "barbell-bench-press" is in the other mode.']);
  });

  it("rejects two exercises with the same slug or the same name in a mode", () => {
    expect(check({ ...base, alternatives: [] }, [{ ...base, alternatives: [], name: "Push-up again" }])).toEqual([
      'Exercise "push-up" is listed twice.',
    ]);
    expect(check({ ...base, alternatives: [] }, [{ ...base, alternatives: [], slug: "push-up-2" }])).toEqual([
      'Exercise "push-up-2": another no-equipment exercise has the same name.',
    ]);
  });

  it("reserves the word the exercise addresses use", () => {
    const modes = [{ ...MODES[0], categories: [...MODES[0].categories, { slug: "exercises" as never, name: "Exercises" }] }];
    expect(validateCatalogue(modes, [])).toEqual(['Category "exercises" is a reserved address.']);
  });
});

describe("how amounts read", () => {
  it("writes sets and reps, ranges and sides", () => {
    expect(formatPrescription({ kind: "reps", sets: 3, reps: [8, 12] })).toBe("3 × 8–12 reps");
    expect(formatPrescription({ kind: "reps", sets: 3, reps: [10, 10], perSide: true })).toBe("3 × 10 reps each side");
    expect(formatPrescription({ kind: "time", sets: 3, seconds: 30 })).toBe("3 × 30 seconds");
    expect(formatPrescription({ kind: "time", sets: 3, seconds: 20, perSide: true })).toBe("3 × 20 seconds each side");
  });

  it("writes rest in minutes and seconds", () => {
    expect(formatRest(45)).toBe("45 s");
    expect(formatRest(60)).toBe("1 min");
    expect(formatRest(90)).toBe("1 min 30 s");
    expect(formatRest(120)).toBe("2 min");
    expect(formatRest(0)).toBe("0 s");
  });

  it("takes translated words", () => {
    const words = { reps: "रेप्स", seconds: "सेकंड", perSide: "हर तरफ़", minutes: "मिनट", secondsShort: "से." };
    expect(formatPrescription({ kind: "reps", sets: 3, reps: [8, 12], perSide: true }, words)).toBe("3 × 8–12 रेप्स हर तरफ़");
    expect(formatRest(90, words)).toBe("1 मिनट 30 से.");
  });
});
