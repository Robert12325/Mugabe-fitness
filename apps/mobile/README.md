# Mugabe Fitness — mobile app

The standalone iOS and Android app for Mugabe Fitness, built with Expo
(SDK 58), React Native and TypeScript, using Expo Router for navigation.

It lives beside the website and has its own `package.json`, lockfile and
`node_modules`; the website's type check and lint skip `apps/`. The one
thing it shares is the exercise catalogue in `../../packages/fitness-content`
(see Workouts below).

It has branding, navigation, sign-in against the existing backend, the two
workout modes, and **Daily Tracking** on the Progress tab. The full program
view is a placeholder for a later phase.

## Requirements

- Node.js 24 (the version the website uses) and npm
- For iOS: a Mac with Xcode and its iOS Simulator, **or** the Expo Go app
  on an iPhone
- For Android: Android Studio with an emulator, **or** Expo Go on an
  Android phone

No Expo account is needed to run the app in development.

## Setup (from a clean checkout)

```sh
cd apps/mobile
npm ci
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` if you want the app to talk to a backend other than the live
website. `EXPO_PUBLIC_API_URL` is the only setting:

| Backend | Value |
| --- | --- |
| Live website (real accounts; use a test account) | `https://mugabe-fitness.vercel.app` |
| Website on your computer (`npm run dev` at the repo root) from a phone | `http://<your computer's LAN IP>:3000` |
| …from the Android emulator | `http://10.0.2.2:3000` |
| …from the iOS Simulator | `http://localhost:3000` |

Plain `http` is accepted only for a local address in a development build;
anything else must be `https`. Everything starting `EXPO_PUBLIC_` is built
into the app in plain text, so **never put a secret in `.env`**. The app
holds no keys at all: users sign in with their own email and password.

## Running

```sh
npm start              # Metro dev server with a QR code
```

- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS).
- **iOS Simulator** (Mac only): press `i` in the terminal, or `npm run ios`.
- **Android emulator:** start an emulator from Android Studio's Device
  Manager, then press `a`, or `npm run android`.

Restart with `npx expo start --clear` after changing `.env`.

## Checks

```sh
npm run typecheck      # TypeScript
npm run lint           # ESLint (eslint-config-expo)
npm test               # Jest (jest-expo): config, API client, sessions, navigation, workouts, catalogue, daily tracking
npm run doctor         # Expo's dependency and config health check
```

## Building

Builds use EAS Build (`npx eas-cli@latest build`) and updates use EAS
Update. The build profiles (`staging`, `production-apk`, `production`),
their update channels, the separate staging app, signing, the publish
script and the approval steps are all in [RELEASING.md](RELEASING.md).
The store identifier is `com.mugabefitness.app` (staging:
`com.mugabefitness.app.staging`), permanent once published.

To check the JavaScript bundles build without a device:

```sh
npx expo export --platform ios
npx expo export --platform android
```

## How sign-in works

The app uses the website's existing account routes, unchanged:

| Action | Route |
| --- | --- |
| Create account | `POST /api/account` → `{ user, token }` |
| Sign in | `POST /api/account/session` → `{ user, token }` |
| Sign out | `DELETE /api/account/session` (Bearer token) |
| Who am I | `GET /api/account` (Bearer token) → `{ user, bookings, membership }` |

- The session token is stored with **Expo SecureStore** (iOS Keychain,
  Android Keystore), readable only while the device is unlocked and never
  restored onto another device. Nothing goes in AsyncStorage.
- A stored token is only a claim. On launch the app asks `GET /api/account`;
  only a successful answer counts as signed in. A `401` clears the token and
  tells the user their session ended. If the server can't be reached, the
  app says so and offers a retry instead of guessing.
- Sign-out forgets the token on the device first, then ends the session on
  the server. Server sessions also expire on their own after 30 days.
- The coaching membership shown on **My Program** is information only. It
  does not unlock premium app content; that will need its own server-side
  entitlement check.

## Workouts

The Workouts tab shows two modes, **Workouts with Equipment** and
**Workouts without Equipment**, each with eight body-part categories, then
a category's exercises and each exercise's instructions:

| Screen | Route |
| --- | --- |
| Choose a mode | `/workouts` |
| A mode's body parts | `/workouts/[mode]` |
| A body part's exercises | `/workouts/[mode]/[category]` |
| One exercise | `/workouts/[mode]/exercises/[slug]` |

- The content comes from `packages/fitness-content`, which the website's
  `/workouts` pages also use. Metro reads it through `watchFolders` (and
  finds Babel's helpers for it through `resolver.nodeModulesPaths`) in
  `metro.config.js`; the `@mugabe/fitness-content` alias is in
  `tsconfig.json` and in Jest's `moduleNameMapper`.
- **Only coach-approved exercises appear.** The written drafts aren't in
  the app's bundle at all (see the package's README), so until the coach
  approves some, every category says "No exercises published here yet". A
  link to a draft shows "Exercise not found".
- `__tests__/workout-exercises.test.tsx` checks the exercise screens with a
  few drafts marked approved, since the real catalogue shows none yet.
- The catalogue is free and needs no sign-in. Premium content, if it comes,
  needs its own server-side subscription. A coaching membership does not
  unlock it.

## Daily Tracking

The Progress tab uses the website's existing daily-tracking routes,
unchanged. Only a signed-in client with an open trial or paid month can use
them; the server checks that on every request.

| Action | Route |
| --- | --- |
| Load the log, targets and weigh-ins | `GET /api/account/daily` → `{ log, targets, progress }` |
| Save one day (weight optional) | `POST /api/account/daily` → `{ log, progress }` |
| Delete one day | `DELETE /api/account/daily?on=YYYY-MM-DD` → `{ log, progress }` |

- Clients log calories, protein, water, steps, waist, sleep, workout,
  energy, notes and weight. Every field is optional. Weight goes into the
  website's existing weigh-in log (`weightGrams`; `null` removes that day's
  weigh-in). Saving a day with everything empty removes it, so the app
  confirms first.
- Targets are only what the coach set on the website. The app never
  suggests one.
- The screen shows only what the server returned. 401 re-checks the
  session (and signs out if it ended), 403 shows "access ended" with no
  form, 429 (60 changes an hour) and 400 show the server's message and keep
  the form, and offline shows a retry.
- The rules (limits, units, summaries) are copied from the website's
  `src/lib/daily.ts` into `src/lib/daily.ts` here and pinned by
  `__tests__/daily-rules.test.ts`. If the website's rules change, change
  both.

## Project layout

```
src/
  app/            Expo Router routes (every file here is a screen)
    (tabs)/       Home, Workouts, My Program, Progress, Profile
      workouts/   stack: mode → body part → exercise
    sign-in.tsx   modal
    register.tsx  modal
    log-day.tsx   modal: log or edit one day
  api/            backend client, account and daily routes
  auth/           session state and secure token storage
  daily/          shared daily-tracking state
  lib/daily.ts    daily rules (mirrors the website's)
  components/     Text, Button, Card, TextField, Screen, …
    progress/     meters, summary, trends, workout row, history row
  config/env.ts   EXPO_PUBLIC_API_URL handling
  theme/          colours, spacing, radii, typography
__tests__/        Jest tests (kept out of src/app, which is routes only)
assets/           icon, splash, brand mark, coach photo
scripts/          render-brand-assets.py (regenerates the icons from the
                  website's "M" monogram)
```
