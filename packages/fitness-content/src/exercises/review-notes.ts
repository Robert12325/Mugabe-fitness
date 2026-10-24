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
};
