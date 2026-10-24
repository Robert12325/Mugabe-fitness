import type { Exercise } from "../types";

/**
 * Workouts with Equipment: the first drafts, three per category. Every one
 * is a draft until the coach approves it, and only then do clients see it.
 */
export const EQUIPMENT_EXERCISES: readonly Exercise[] = [
  /* ---------------------------------------------------------------- Chest */
  {
    slug: "barbell-bench-press",
    name: "Barbell bench press",
    mode: "equipment",
    categories: ["chest"],
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front-delts", "triceps"],
    equipment: ["barbell", "bench", "rack-with-safeties"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [6, 10] },
    restSeconds: 120,
    steps: [
      "Set the safety arms (or spotter arms) just below the height of your chest as you lie on the bench, and put collars on the bar.",
      "Lie on the bench with your eyes under the bar and both feet flat on the floor.",
      "Grip the bar a little wider than your shoulders. Pull your shoulder blades together and down into the bench.",
      "Lift the bar out of the rack and hold it with straight arms over your shoulders.",
      "Lower it under control to your lower chest, elbows angled about 45 to 70 degrees from your body.",
      "Press the bar back up until your arms are straight, keeping your hips on the bench. Rack it at the end of the set.",
    ],
    breathing: ["Take a breath and brace before you lower the bar; breathe out as you press it up."],
    tips: [
      "Keep your wrists stacked over your elbows.",
      "If a rep stalls, lower the bar onto the safety arms rather than fighting it.",
      "For heavy sets, ask someone to spot you as well.",
    ],
    mistakes: [
      "Bouncing the bar off your chest.",
      "Flaring your elbows straight out to the sides.",
      "Lifting your hips off the bench to push the weight.",
    ],
    alternatives: ["incline-dumbbell-press", "cable-chest-fly"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Now requires a rack or bench uprights with safety arms.",
        "New first step: set the safety arms and put collars on. New tip: let a stalled rep down onto the safety arms.",
      ],
      check: [
        "Safety-arm height, the elbow angle (45 to 70 degrees) and when to use a spotter.",
        "Sets, reps and rest.",
      ],
    },
  },

  /* ----------------------------------------------------------------- Back */

  /* ------------------------------------------------------------ Shoulders */

  /* ---------------------------------------------------- Biceps and triceps */

  /* ------------------------------------------------------ Legs and glutes */
  {
    slug: "barbell-back-squat",
    name: "Barbell back squat",
    mode: "equipment",
    categories: ["legs-glutes"],
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["adductors", "lower-back"],
    equipment: ["barbell", "squat-rack"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [6, 10] },
    restSeconds: 120,
    steps: [
      "Set the bar in the rack at about shoulder height and the safety arms just below your lowest squat depth.",
      "Step under the bar and rest it across your upper back, not your neck. Grip it firmly.",
      "Stand up to lift it out, step back, and set your feet about shoulder-width apart, toes turned out slightly.",
      "Brace your core, then sit down and back, knees tracking over your toes, until your thighs are at least parallel to the floor if you can do so comfortably.",
      "Drive through your whole foot to stand back up.",
    ],
    breathing: ["Take a big breath and brace before each rep; breathe out near the top."],
    tips: ["Keep your chest up and your heels on the floor.", "Always squat with the safety arms set."],
    mistakes: [
      "Letting your knees cave inwards.",
      "Rising onto your toes.",
      "Rounding your lower back at the bottom.",
    ],
    alternatives: ["leg-press"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Alternative is now the Leg press only (the Romanian deadlift is a hinge, not a squat).",
      ],
      check: [
        "Depth, the rack and safety-arm setup.",
      ],
    },
  },
  {
    slug: "romanian-deadlift",
    name: "Romanian deadlift",
    mode: "equipment",
    categories: ["legs-glutes"],
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower-back", "forearms"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [8, 10] },
    restSeconds: 120,
    steps: [
      "Set the bar in a rack at about mid-thigh height and put collars on. Starting from the rack is the safest way in; without one, lift the bar from the floor with a flat back, as in a deadlift.",
      "Grip the bar just outside your legs, stand up to lift it off the hooks and take one or two steps back. Feet hip-width apart.",
      "Unlock your knees slightly and keep them at that angle.",
      "Push your hips back and let the bar slide down your thighs, keeping your back flat.",
      "Stop when you feel a strong stretch in your hamstrings, usually around mid-shin, then drive your hips forward to stand tall, squeezing your glutes.",
      "At the end of the set, step forward and set the bar back on the hooks, or lower it to the floor with a flat back.",
    ],
    breathing: ["Breathe in and brace as you lower; breathe out as you stand up."],
    tips: [
      "Keep the bar touching or very close to your legs the whole way.",
      "A rack set at mid-thigh makes both the start and the finish safer.",
    ],
    mistakes: ["Rounding your back to reach lower.", "Bending your knees more and more, turning it into a squat."],
    alternatives: ["cable-pull-through"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Steps now cover setting up: rack start at mid-thigh, or lifting from the floor with a flat back, and finishing safely.",
        "Alternative is now the Cable pull-through, another hip hinge (was the back squat and leg press).",
      ],
      check: [
        "The rack-start advice and how low to lower (mid-shin).",
        "Whether a rack should be required rather than recommended.",
      ],
    },
  },

  /* --------------------------------------------------------- Abs and core */
  {
    slug: "hanging-knee-raise",
    name: "Hanging knee raise",
    mode: "equipment",
    categories: ["abs-core"],
    primaryMuscles: ["abs", "hip-flexors"],
    secondaryMuscles: ["forearms"],
    equipment: ["hanging-station"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [8, 12] },
    restSeconds: 60,
    steps: [
      "Hang from a pull-up bar with straight arms, or rest your forearms on a hanging station's pads, legs together.",
      "Brace your core to stop any swinging.",
      "Raise your knees towards your chest, tilting your pelvis up at the top.",
      "Lower your legs slowly until they are straight again.",
    ],
    breathing: ["Breathe out as you raise your knees; breathe in as you lower them."],
    tips: [
      "If your grip gives out first, use a hanging station with arm pads.",
    ],
    mistakes: ["Swinging to get your knees up.", "Dropping your legs quickly."],
    alternatives: ["cable-crunch"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Now requires a pull-up bar or hanging station.",
        "Alternative is now the Kneeling cable crunch only (the Pallof press works a different movement).",
      ],
      check: [
        "Grip and shoulder readiness for hanging; whether beginners should use the arm-pad station.",
      ],
    },
  },

  /* ------------------------------------------------------------ Full body */
  {
    slug: "kettlebell-swing",
    name: "Kettlebell swing",
    mode: "equipment",
    categories: ["full-body"],
    primaryMuscles: ["glutes", "hamstrings"],
    secondaryMuscles: ["lower-back", "abs", "forearms"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    prescription: { kind: "reps", sets: 3, reps: [12, 15] },
    restSeconds: 60,
    steps: [
      "Stand with your feet a little wider than your hips, a kettlebell on the floor just in front of you.",
      "Hinge at your hips with a flat back and grip the handle with both hands.",
      "Hike the kettlebell back between your legs.",
      "Drive your hips forward hard to stand tall, letting the kettlebell float up to chest height.",
      "Let it swing back down between your legs as you hinge again, and repeat.",
    ],
    breathing: ["Breathe out sharply as your hips drive forward; breathe in on the way down."],
    tips: ["The power comes from your hips. Your arms only guide the kettlebell."],
    mistakes: ["Squatting instead of hinging.", "Lifting the kettlebell with your arms.", "Rounding your back at the bottom."],
    alternatives: ["cable-pull-through"],
    demo: { kind: "coming-soon" },
    review: "draft",
    coachReview: {
      status: "changed",
      changes: [
        "Alternative is now the Cable pull-through, the same hip hinge (were the thruster and farmer's carry).",
      ],
      check: [
        "Hinge technique and the starting kettlebell weight.",
      ],
    },
  },

  /* --------------------------------------------- Cardio and conditioning */
];
