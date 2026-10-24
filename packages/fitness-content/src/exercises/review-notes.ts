import type { CoachReview } from "../types";

/**
 * Review notes for exercises published before the coach's review: what
 * changed in the technical review, and what the coach should check. Kept
 * here, not on the published entries, so no note reaches a client. Read by
 * tests and review tools only.
 */
export const PENDING_REVIEW_NOTES: Readonly<Record<string, CoachReview>> = {
  "prone-y-t-raise": {
    status: "changed",
    changes: [
      "Alternative is now the Reverse snow angel, also upper back (was the Pike push-up, a pressing movement).",
      "Tip added: one Y lift plus one T lift counts as one rep.",
    ],
    check: [
      "The rep convention and 3 × 8–10.",
    ],
  },
  "reverse-snow-angel": {
    status: "new",
    changes: [],
    check: [
      "Technique cues, sets and reps.",
    ],
  },
  "pike-push-up": {
    status: "changed",
    changes: [
      "Alternative is now the Feet-elevated pike push-up only (the Prone Y-T raise is a pulling, upper-back movement).",
    ],
    check: [],
  },
  "diamond-push-up": {
    status: "changed",
    changes: [
      "Alternative is now the Chair dip (the Chin-up worked biceps and back, and moved to the equipment mode).",
      "The new Close-grip push-up, an easier triceps option, added as a second alternative.",
    ],
    check: [],
  },
  "close-grip-push-up": {
    status: "new",
    changes: [],
    check: [
      "Proposed as a triceps-focused option: whether it is different enough from the Diamond push-up to include.",
      "Hand width and elbow cues; sets and reps.",
    ],
  },
  "burpee": {
    status: "changed",
    changes: [
      "Alternatives removed: the three full-body exercises are different movements, not substitutes.",
    ],
    check: [],
  },
  "bear-crawl": {
    status: "changed",
    changes: [
      "Alternatives removed: the three full-body exercises are different movements, not substitutes.",
    ],
    check: [],
  },
  "inchworm": {
    status: "changed",
    changes: [
      "Alternatives removed: the three full-body exercises are different movements, not substitutes.",
    ],
    check: [],
  },
  "lat-pulldown": {
    status: "changed",
    changes: [
      "Alternatives are now the Pull-up (the same vertical pull) and the Seated cable row.",
    ],
    check: [],
  },
  "pull-up": {
    status: "changed",
    changes: [
      "Moved from Workouts without Equipment to Workouts with Equipment: a pull-up bar counts as equipment.",
      "Fitting guidance added: install to the manufacturer's instructions, check its maximum user weight, test before each session. Requires a securely fixed pull-up bar. Alternatives are now the Lat pulldown and the Chin-up.",
    ],
    check: [
      "Whether door-frame bars are acceptable at all, and whether the fitting check in step 1 and the tips is enough.",
      "No load limit is stated on purpose: each bar's own manufacturer limit applies.",
    ],
  },
  "chin-up": {
    status: "changed",
    changes: [
      "Moved from Workouts without Equipment to Workouts with Equipment, listed under Back and Biceps and triceps.",
      "Fitting guidance added: install to the manufacturer's instructions, check its maximum user weight, test before each session. Requires a securely fixed pull-up bar. Alternatives are now the Pull-up and the Lat pulldown.",
    ],
    check: [
      "Whether door-frame bars are acceptable at all, and whether the fitting check in step 1 and the tips is enough.",
      "No load limit is stated on purpose: each bar's own manufacturer limit applies.",
    ],
  },
  "seated-dumbbell-shoulder-press": {
    status: "changed",
    changes: [
      "Alternative is now the Dumbbell lateral raise only (the face pull works the rear shoulders).",
    ],
    check: [],
  },
  "dumbbell-lateral-raise": {
    status: "changed",
    changes: [
      "Alternative is now the Seated dumbbell shoulder press only (the face pull works the rear shoulders).",
    ],
    check: [],
  },
  "cable-face-pull": {
    status: "changed",
    changes: [
      "Alternative is now the Reverse dumbbell fly, which also works the rear shoulders (was the shoulder press and lateral raise).",
    ],
    check: [],
  },
  "reverse-dumbbell-fly": {
    status: "new",
    changes: [],
    check: [
      "Technique cues and the hinge angle; whether to make the chest-supported version the default.",
    ],
  },
  "dumbbell-biceps-curl": {
    status: "changed",
    changes: [
      "Alternatives are now the Hammer curl and the Chin-up, both biceps work (were two triceps exercises).",
    ],
    check: [],
  },
  "hammer-curl": {
    status: "new",
    changes: [],
    check: [
      "Technique cues, sets and reps.",
    ],
  },
  "cable-triceps-pushdown": {
    status: "changed",
    changes: [
      "Alternative is now the EZ-bar skull crusher only (the biceps curl was not a substitute).",
    ],
    check: [],
  },
  "ez-bar-skull-crusher": {
    status: "changed",
    changes: [
      "Alternative is now the Cable triceps pushdown only (the biceps curl was not a substitute).",
    ],
    check: [],
  },
  "leg-press": {
    status: "changed",
    changes: [
      "Alternative is now the Barbell back squat only.",
    ],
    check: [],
  },
  "cable-pull-through": {
    status: "new",
    changes: [],
    check: [
      "Technique cues and the load to start with.",
    ],
  },
  "pallof-press": {
    status: "changed",
    changes: [
      "Alternatives removed: the crunch and knee raise work a different movement, and there is no other anti-rotation exercise yet.",
    ],
    check: [],
  },
  "cable-crunch": {
    status: "changed",
    changes: [
      "Alternative is now the Hanging knee raise only (the Pallof press works a different movement).",
    ],
    check: [],
  },
  "dumbbell-thruster": {
    status: "changed",
    changes: [
      "Alternatives removed: the swing and carry are different movements, not substitutes.",
    ],
    check: [],
  },
  "farmers-carry": {
    status: "changed",
    changes: [
      "Alternatives removed: the swing and thruster are different movements, not substitutes.",
    ],
    check: [],
  },
  "barbell-bench-press": {
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
  "dumbbell-bench-press": {
    status: "new",
    changes: [],
    check: [
      "Getting into and out of position safely with heavier dumbbells.",
      "Sets, reps and rest.",
    ],
  },
  "incline-barbell-bench-press": {
    status: "new",
    changes: [],
    check: [
      "Safety-arm setup and bench angle.",
      "Sets, reps and rest.",
    ],
  },
  "machine-chest-press": {
    status: "new",
    changes: [],
    check: [
      "Seat-height cue and sets and reps.",
    ],
  },
  "dumbbell-fly": {
    status: "new",
    changes: [],
    check: [
      "How far to lower, given shoulder strain.",
      "Sets, reps and rest.",
    ],
  },
  "low-to-high-cable-fly": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "chest-dip": {
    status: "new",
    changes: [],
    check: [
      "Depth and who should use the assisted version first.",
      "Sets, reps and rest.",
    ],
  },
  "pec-deck-fly": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "barbell-bent-over-row": {
    status: "new",
    changes: [],
    check: [
      "Torso angle and lower-back safety.",
      "Sets, reps and rest.",
    ],
  },
  "chest-supported-dumbbell-row": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "straight-arm-pulldown": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "conventional-deadlift": {
    status: "new",
    changes: [],
    check: [
      "Technique and loading for clients new to deadlifts; whether it should be coached in person first.",
      "Sets, reps and rest.",
    ],
  },
  "rack-inverted-row": {
    status: "new",
    changes: [],
    check: [
      "Bar height and checking it is secure.",
      "Sets and reps.",
    ],
  },
  "standing-overhead-press": {
    status: "new",
    changes: [],
    check: [
      "Bracing cues and lower-back safety.",
      "Sets, reps and rest.",
    ],
  },
  "arnold-press": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "cable-lateral-raise": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "dumbbell-front-raise": {
    status: "new",
    changes: [],
    check: [
      "Whether it adds enough beside the presses to include.",
      "Sets and reps.",
    ],
  },
  "machine-shoulder-press": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "band-pull-apart": {
    status: "new",
    changes: [],
    check: [
      "Band strength guidance, sets and reps.",
    ],
  },
  "barbell-curl": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "incline-dumbbell-curl": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "cable-curl": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "overhead-dumbbell-triceps-extension": {
    status: "new",
    changes: [],
    check: [
      "Shoulder comfort in the overhead position.",
      "Sets and reps.",
    ],
  },
  "close-grip-bench-press": {
    status: "new",
    changes: [],
    check: [
      "Grip width and safety-arm setup.",
      "Sets, reps and rest.",
    ],
  },
  "barbell-back-squat": {
    status: "changed",
    changes: [
      "Alternative is now the Leg press only (the Romanian deadlift is a hinge, not a squat).",
    ],
    check: [
      "Depth, the rack and safety-arm setup.",
    ],
  },
  "romanian-deadlift": {
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
  "goblet-squat": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "dumbbell-walking-lunge": {
    status: "new",
    changes: [],
    check: [
      "Space needed and balance for beginners.",
      "Sets and reps.",
    ],
  },
  "bulgarian-split-squat": {
    status: "new",
    changes: [],
    check: [
      "Balance and progression for beginners.",
      "Sets and reps.",
    ],
  },
  "barbell-hip-thrust": {
    status: "new",
    changes: [],
    check: [
      "Setup (bench stability, bar padding).",
      "Sets and reps.",
    ],
  },
  "lying-leg-curl": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "standing-calf-raise": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "hanging-knee-raise": {
    status: "changed",
    changes: [
      "Now requires a pull-up bar or hanging station.",
      "Alternative is now the Kneeling cable crunch only (the Pallof press works a different movement).",
    ],
    check: [
      "Grip and shoulder readiness for hanging; whether beginners should use the arm-pad station.",
    ],
  },
  "ab-wheel-rollout": {
    status: "new",
    changes: [],
    check: [
      "Suitability for clients with lower-back pain.",
      "Sets and reps.",
    ],
  },
  "cable-woodchop": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "suitcase-carry": {
    status: "new",
    changes: [],
    check: [
      "Starting weight, sets and time.",
    ],
  },
  "hanging-leg-raise": {
    status: "new",
    changes: [],
    check: [
      "Who it suits; it is the progression from the hanging knee raise.",
      "Sets and reps.",
    ],
  },
  "decline-bench-crunch": {
    status: "new",
    changes: [],
    check: [
      "Decline angle and suitability for beginners.",
      "Sets and reps.",
    ],
  },
  "stability-ball-stir-the-pot": {
    status: "new",
    changes: [],
    check: [
      "Sets and time.",
    ],
  },
  "landmine-rotation": {
    status: "new",
    changes: [],
    check: [
      "Starting load and rep counting.",
      "Sets and reps.",
    ],
  },
  "kettlebell-swing": {
    status: "changed",
    changes: [
      "Alternative is now the Cable pull-through, the same hip hinge (were the thruster and farmer's carry).",
    ],
    check: [
      "Hinge technique and the starting kettlebell weight.",
    ],
  },
  "dumbbell-clean-and-press": {
    status: "new",
    changes: [],
    check: [
      "Technique cues for the clean.",
      "Sets, reps and rest.",
    ],
  },
  "renegade-row": {
    status: "new",
    changes: [],
    check: [
      "Dumbbell stability and wrist comfort.",
      "Sets and reps.",
    ],
  },
  "sled-push": {
    status: "new",
    changes: [],
    check: [
      "Load and work-to-rest for different fitness levels.",
    ],
  },
  "turkish-get-up": {
    status: "new",
    changes: [],
    check: [
      "Whether clients should learn it in person first; the no-weight progression.",
      "Sets and reps.",
    ],
  },
  "medicine-ball-slam": {
    status: "new",
    changes: [],
    check: [
      "Ball type and space needed.",
      "Sets and reps.",
    ],
  },
  "wall-ball": {
    status: "new",
    changes: [],
    check: [
      "Target height and ball weight.",
      "Sets and reps.",
    ],
  },
  "trap-bar-deadlift": {
    status: "new",
    changes: [],
    check: [
      "Loading and technique for beginners.",
      "Sets, reps and rest.",
    ],
  },
  "treadmill-intervals": {
    status: "new",
    changes: [],
    check: [
      "Interval speed guidance and who should start with walking intervals.",
    ],
  },
  "incline-treadmill-walk": {
    status: "new",
    changes: [],
    check: [
      "Duration (20 minutes as one set) and incline guidance.",
    ],
  },
  "exercise-bike-steady-ride": {
    status: "new",
    changes: [],
    check: [
      "Duration and intensity guidance.",
    ],
  },
  "stair-climber": {
    status: "new",
    changes: [],
    check: [
      "Duration and speed guidance.",
    ],
  },
  "ski-erg-intervals": {
    status: "new",
    changes: [],
    check: [
      "Interval length and intensity.",
    ],
  },
  "jump-rope": {
    status: "new",
    changes: [],
    check: [
      "Rope length cue and impact for beginners.",
    ],
  },
  "elliptical-intervals": {
    status: "new",
    changes: [],
    check: [
      "Interval intensity guidance.",
    ],
  },
  "knee-push-up": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "wide-push-up": {
    status: "new",
    changes: [],
    check: [
      "Whether it differs enough from the standard push-up to include.",
    ],
  },
  "archer-push-up": {
    status: "new",
    changes: [],
    check: [
      "Who it suits, and sets and reps.",
    ],
  },
  "hand-release-push-up": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "plyometric-push-up": {
    status: "new",
    changes: [],
    check: [
      "Wrist and elbow safety; who should try it.",
      "Sets and reps.",
    ],
  },
  "superman": {
    status: "new",
    changes: [],
    check: [
      "Suitability for clients with lower-back pain; hold time and reps.",
    ],
  },
  "back-widow": {
    status: "new",
    changes: [],
    check: [
      "Whether it is effective enough to include.",
      "Sets and reps.",
    ],
  },
  "bird-dog": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "elevated-pike-push-up": {
    status: "changed",
    changes: [
      "Alternative is now the Pike push-up only (the Prone Y-T raise is a pulling, upper-back movement).",
    ],
    check: [
      "An advanced, head-towards-the-floor exercise: whether clients should see it without supervision.",
    ],
  },
  "plank-shoulder-tap": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "dolphin-push-up": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "wall-handstand-hold": {
    status: "new",
    changes: [],
    check: [
      "Whether clients should try it unsupervised; the exit technique.",
      "Sets and hold time.",
    ],
  },
  "chair-dip": {
    status: "changed",
    changes: [
      "Alternative is now the Diamond push-up only (the Chin-up worked biceps and back, and moved to the equipment mode).",
    ],
    check: [
      "Depth and shoulder comfort; whether to allow it for beginners.",
    ],
  },
  "sphinx-push-up": {
    status: "new",
    changes: [],
    check: [
      "Elbow comfort and sets and reps.",
    ],
  },
  "chair-split-squat": {
    status: "new",
    changes: [],
    check: [
      "Chair stability and balance for beginners.",
      "Sets and reps.",
    ],
  },
  "wall-sit": {
    status: "new",
    changes: [],
    check: [
      "Hold time.",
    ],
  },
  "step-up": {
    status: "new",
    changes: [],
    check: [
      "Step height and chair safety.",
      "Sets and reps.",
    ],
  },
  "bodyweight-calf-raise": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "jump-squat": {
    status: "new",
    changes: [],
    check: [
      "Impact and knee safety; who should try it.",
      "Sets and reps.",
    ],
  },
  "lateral-lunge": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "single-leg-rdl": {
    status: "new",
    changes: [],
    check: [
      "Balance support for beginners.",
      "Sets and reps.",
    ],
  },
  "hollow-body-hold": {
    status: "new",
    changes: [],
    check: [
      "Hold time and the easier version.",
    ],
  },
  "reverse-crunch": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "bicycle-crunch": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "lying-leg-raise": {
    status: "new",
    changes: [],
    check: [
      "Suitability for clients with lower-back pain.",
      "Sets and reps.",
    ],
  },
  "crunch": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "crab-walk": {
    status: "new",
    changes: [],
    check: [
      "Wrist comfort and time.",
    ],
  },
  "squat-thrust": {
    status: "new",
    changes: [],
    check: [
      "Sets and reps.",
    ],
  },
  "sit-through": {
    status: "new",
    changes: [],
    check: [
      "Whether it suits the catalogue; technique cues.",
      "Sets and reps.",
    ],
  },
  "butt-kicks": {
    status: "new",
    changes: [],
    check: [
      "Time and rest.",
    ],
  },
  "skater-hops": {
    status: "new",
    changes: [],
    check: [
      "Impact and space needed.",
      "Time and rest.",
    ],
  },
  "shadow-boxing": {
    status: "new",
    changes: [],
    check: [
      "Time and technique cues.",
    ],
  },
  "plank-jacks": {
    status: "new",
    changes: [],
    check: [
      "Time and rest.",
    ],
  },
  "fast-feet": {
    status: "new",
    changes: [],
    check: [
      "Time and rest.",
    ],
  },
  "squat-jacks": {
    status: "new",
    changes: [],
    check: [
      "Impact; time and rest.",
    ],
  },
  "lateral-shuffle": {
    status: "new",
    changes: [],
    check: [
      "Space needed; time and rest.",
    ],
  },
};
