import type { Exercise } from "../types";

/**
 * Exercises taken out of the proposed catalogue during review, kept on
 * record for the coach. Not drafts: nothing here is offered for approval
 * or shown to clients. To bring one back, move it into its mode's draft
 * file once the coach has approved how it should be done.
 */
export const WITHDRAWN_EXERCISES: readonly Exercise[] = [
  {
    slug: "inverted-table-row",
    name: "Inverted table row",
    mode: "no-equipment",
    categories: ["back"],
    primaryMuscles: ["upper-back", "lats"],
    secondaryMuscles: ["biceps", "rear-delts"],
    equipment: ["sturdy-table"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [6, 12] },
    restSeconds: 90,
    steps: [
      "Use a heavy, solid table that won't tip. Test it with your weight before you start.",
      "Lie on your back under the table and grip its edge with both hands, shoulder-width apart.",
      "With your heels on the floor and body straight, pull your chest up towards the edge.",
      "Lower yourself slowly until your arms are straight.",
    ],
    breathing: ["Breathe out as you pull up; breathe in as you lower."],
    tips: ["Bend your knees and put your feet flat to make it easier."],
    mistakes: ["Using a light or folding table.", "Letting your hips sag on the way up."],
    alternatives: ["prone-y-t-raise"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "removed",
      changes: [
        "Removed from the proposed catalogue in review preparation: a table can tip or give way under a pulling load.",
        "Kept on record only. It returns to the drafts only if the coach approves a specific safe, stable setup.",
      ],
      check: [
        "Restore only with an approved setup (which table or surface, and how to check it), so the steps can describe it.",
      ],
    },
  },
];
