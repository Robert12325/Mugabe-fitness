import type { Exercise } from "../types";

/**
 * Workouts without Equipment: the first drafts. Only household items (a
 * sturdy chair, table or towel) are allowed, and any an exercise needs is
 * listed as its equipment, so it is always named on the page. A pull-up bar
 * is equipment: pull-ups and chin-ups live in the equipment mode. Arms is
 * short on purpose: there is no sound equipment-free biceps exercise, and
 * padding isn't wanted.
 */
export const NO_EQUIPMENT_EXERCISES: readonly Exercise[] = [
  /* ---------------------------------------------------------------- Chest */

  /* ----------------------------------------------------------------- Back */

  {
    slug: "superman",
    name: "Superman",
    mode: "no-equipment",
    categories: ["back"],
    primaryMuscles: ["lower-back", "glutes"],
    secondaryMuscles: ["upper-back", "hamstrings"],
    equipment: [],
    difficulty: "beginner",
    prescription: { kind: "reps", sets: 3, reps: [8, 12] },
    restSeconds: 45,
    steps: [
      "Lie face down with your arms stretched overhead and your legs straight.",
      "Squeeze your glutes and lift your arms, chest and legs a few centimetres off the floor.",
      "Hold for 2 seconds, keeping your neck long and your eyes on the floor.",
      "Lower slowly back down.",
    ],
    breathing: [
      "Breathe out as you lift; breathe in as you lower.",
    ],
    tips: [
      "Lift only as high as feels comfortable in your lower back.",
    ],
    mistakes: [
      "Throwing your head back to look forward.",
      "Jerking up instead of lifting under control.",
    ],
    alternatives: [],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "new",
      changes: [],
      check: [
        "Suitability for clients with lower-back pain; hold time and reps.",
      ],
    },
  },
  /* ------------------------------------------------------------ Shoulders */
  {
    slug: "elevated-pike-push-up",
    name: "Feet-elevated pike push-up",
    mode: "no-equipment",
    categories: ["shoulders"],
    primaryMuscles: ["front-delts", "side-delts"],
    secondaryMuscles: ["triceps"],
    equipment: ["sturdy-chair"],
    difficulty: "advanced",
    prescription: { kind: "reps", sets: 3, reps: [5, 8] },
    restSeconds: 90,
    steps: [
      "Place a sturdy chair or step against a wall so it can't move.",
      "Put your feet on the seat and walk your hands back towards it until your hips are high over your shoulders.",
      "Bend your elbows to lower the top of your head towards the floor.",
      "Press back up to straight arms.",
    ],
    breathing: ["Breathe in as you lower; breathe out as you press up."],
    tips: ["Only move on to this once pike push-ups feel solid for 3 sets of 10."],
    mistakes: ["Using a chair that can slide.", "Collapsing at the bottom of the rep."],
    alternatives: ["pike-push-up"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Alternative is now the Pike push-up only (the Prone Y-T raise is a pulling, upper-back movement).",
      ],
      check: [
        "An advanced, head-towards-the-floor exercise: whether clients should see it without supervision.",
      ],
    },
  },

  /* ----------------------------------------------------------------- Arms */
  {
    slug: "chair-dip",
    name: "Chair dip",
    mode: "no-equipment",
    categories: ["arms"],
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["chest", "front-delts"],
    equipment: ["sturdy-chair"],
    difficulty: "beginner",
    prescription: { kind: "reps", sets: 3, reps: [8, 12] },
    restSeconds: 60,
    steps: [
      "Place a sturdy chair against a wall so it can't slide.",
      "Sit on the edge and grip it beside your hips, fingers pointing forward.",
      "Slide your hips off the seat with your knees bent and feet flat.",
      "Bend your elbows straight back to lower your hips until your upper arms are about parallel to the floor, then press back up.",
    ],
    breathing: ["Breathe in as you lower; breathe out as you press up."],
    tips: ["Straighten your legs to make it harder. Stop higher if your shoulders feel pinched."],
    mistakes: ["Going so deep that your shoulders roll forward.", "Letting your elbows flare out to the sides."],
    alternatives: ["diamond-push-up"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Alternative is now the Diamond push-up only (the Chin-up worked biceps and back, and moved to the equipment mode).",
      ],
      check: [
        "Depth and shoulder comfort; whether to allow it for beginners.",
      ],
    },
  },

  /* ------------------------------------------------------ Legs and glutes */

  /* --------------------------------------------------------- Abs and core */

  /* ------------------------------------------------------------ Full body */

  /* --------------------------------------------- Cardio and conditioning */
];
