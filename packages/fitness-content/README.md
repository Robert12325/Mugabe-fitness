# @mugabe/fitness-content

The exercise catalogue shared by the website (`src/`) and the mobile app
(`apps/mobile/`), so both show the same workouts.

- **Plain TypeScript, no dependencies, no build step.** Each app compiles it
  as part of its own build through a path alias:
  - website: `tsconfig.json` → `paths`
  - mobile: `apps/mobile/tsconfig.json` → `paths`; `metro.config.js` →
    `watchFolders` and `resolver.nodeModulesPaths`; Jest's
    `moduleNameMapper` and `modulePaths` in `apps/mobile/package.json`
- **Not an npm workspace.** Nothing here changes either app's lockfile or
  the Vercel build.
- Keep it free of React, platform code and imports from outside this folder.

## What's in it

| File | Contents |
| --- | --- |
| `src/index.ts` | The entry point the website and app import |
| `src/types.ts` | Modes, categories, exercises, equipment, muscles |
| `src/modes.ts` | The two modes, their eight categories each, category and equipment names |
| `src/published.ts` | **The exercises clients see:** coach-approved, or published before the coach's review |
| `src/catalogue.ts` | `CATALOGUE`: every list and lookup the pages use |
| `src/format.ts` | "3 × 8–12 reps", "1 min 30 s", difficulty and muscle names |
| `src/validate.ts` | `validateCatalogue()`: every problem as a sentence. Not in the entry point |
| `src/exercises/` | **Drafts** for the coach to review, one file per mode |
| `src/exercises/withdrawn.ts` | Exercises taken out of the proposed catalogue, kept on record only |
| `src/exercises/review-notes.ts` | Review notes for exercises published before the coach's review; never shipped |

## Drafts and publishing

Drafts are kept out of everything clients receive, not just hidden on screen:

- `src/exercises/` holds drafts (`review: "draft"`). The entry point never
  imports it, so drafts are not in the website's pages or scripts, or in
  the app's bundle. Tests and review tools import them as
  `@mugabe/fitness-content/exercises`.
- `src/published.ts` holds what clients see, in two kinds:
  - `review: "coach-approved"`: the coach approved it and confirmed its
    amounts (`amountsConfirmed: true`).
  - `review: "published-pending-review"`: published by the site owner
    before the coach's review. Every exercise page says it is not yet
    reviewed by the coach. It is not a coach approval: when the coach's
    decisions come in, these entries are updated or removed. Their review
    notes live in `src/exercises/review-notes.ts`, never on the entry.

  `CATALOGUE` only shows those two values, as a second guard. **To publish a
  draft once the coach approves it,** move its entry here with
  `review: "coach-approved"` and `amountsConfirmed: true`.
- Held back now: the 8 exercises with open safety questions stay drafts
  until the coach answers them.
- The website builds pages only for published exercises, so a draft's
  address is a 404. The app shows "Exercise not found" for it.
- `src/exercises/withdrawn.ts` holds exercises removed during review (now
  the inverted table row). They are neither drafts nor published; one comes
  back only by moving it into its mode's draft file after the coach approves
  how it should be done.
- **Sets, reps, duration and rest are draft recommendations** until the
  coach confirms them, recorded as `amountsConfirmed: true`. An exercise
  can't be approved without it.
- `scripts/check-workouts-ui.mjs` searches the website's built pages and
  scripts for draft text, coach notes and the checks' own messages, and
  fails if any is found.

## Where the checks run

`validateCatalogue()` is imported only as `@mugabe/fitness-content/validate`,
never through the entry point, so it is in neither the website's browser
scripts nor the app's bundle. One implementation, run in three places:

- **Mobile tests** (`apps/mobile/__tests__/fitness-content.test.ts`): every
  draft, withdrawn and published exercise.
- **Website build:** `src/app/workouts/published-catalogue.ts` checks the
  published list while pages are generated; a broken published exercise
  stops the build.
- **Review sheet:** the generator refuses to write a sheet from an invalid
  catalogue.

The app has no build step that could run them, so its tests are what guard
it; the published list it ships is the same file the website build checks.

## Rules for exercises

`validateCatalogue()` enforces these.

- **Complete:** target muscles, sets and reps or a duration, rest,
  difficulty, at least 3 steps, a breathing cue and a common mistake.
- **Equipment** comes in three kinds: gym (machines, free weights), home
  (pull-up bar, resistance band, door anchor) and household (sturdy chair,
  table, towel). An equipment-mode exercise names at least one gym or home
  item. A no-equipment exercise may use household items only, and must list
  them. A door anchor must be listed with a resistance band.
- **Modes stay separate:** categories and alternatives must be from the
  exercise's own mode.
- **Real alternatives:** an alternative must share a target muscle with
  the exercise (chest and upper chest, and abs and obliques, count as one).
- **Approval:** an approved exercise needs `amountsConfirmed` and must not
  still carry review notes (`coachReview`).
- **No padding:** slugs and names are unique; a muscle is either a target
  or a secondary muscle, not both.
- **Demonstrations:** only original diagrams made for Mugabe Fitness, or
  clips the coach records. Until one exists, use `{ kind: "coming-soon" }`.
- `exercises` is reserved: it is part of the exercise addresses
  (`/workouts/<mode>/exercises/<slug>`), so no category may use it.

## Labels on the website

The English mode and category names live here (`MODES`, `CATEGORY_NAMES`),
and the website's English dictionary in `src/lib/i18n.ts` points at them.
Hindi and Hinglish are written in that file, keyed in
`src/components/workouts/labels.ts`; a new category won't type-check on the
website until it has all three. Exercise instructions are English only
for now.
