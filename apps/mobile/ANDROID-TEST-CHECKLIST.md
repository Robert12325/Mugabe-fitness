# Android manual test pass

For a release candidate APK on a real Android phone. Tick each item; note
the phone model, Android version and APK build ID at the top.

- Phone / Android version:
- Screen width (Settings → Display, or a "what is my screen size" site):
- APK build (EAS build link):
- Tester / date:

Use a **test account**: the APK talks to the live website.

## 1. Install and first launch
- [ ] Install from the EAS link (allow "install unknown apps" for the browser).
- [ ] App icon and name show as "Mugabe Fitness"; splash is black with the gold mark.
- [ ] First launch lands on Home, signed out: "Welcome to Mugabe Fitness", Sign in and Join.

## 2. Authentication
- [ ] Join with a new email: fields show their icons; password show/hide works; the privacy policy link opens the website.
- [ ] Wrong password on sign-in shows "Email or password is incorrect." and stays on the form.
- [ ] Sign in: Home greets you by first name with your initials.
- [ ] Close the app fully and reopen: still signed in.
- [ ] Sign in on the website with the same account and sign out there: the app stays signed in (sessions are per device).
- [ ] Profile → Sign out → confirm: back to signed out; reopening the app stays signed out.
- [ ] Expired session: sign in, then (with the coach) clear the session or wait for expiry; reopening shows the "signed out" notice, not an error loop.

## 3. Home
- [ ] Today card (signed in, tracking open): "Not logged yet" / "Training not logged yet" on a new day.
- [ ] Today card → Log today opens today's form; after saving, Home shows "Today is logged" and the training line you chose.
- [ ] Today card → Start workout opens Workouts.
- [ ] With tracking locked (trial/payment lapsed), Home shows no Today card and no stats, and nothing errors.
- [ ] Stats strip (streak, workouts this week, latest weight) matches Progress.
- [ ] Quick tiles: four across on a normal phone; two by two on a narrow phone (about 360 dp or less) or with large text (Settings → Display → Font size at maximum). No label is cut off.

## 4. Workouts
- [ ] Search "chest", "squat", "dumbbell": results make sense; clearing returns to the modes.
- [ ] Each mode → body part → exercise opens; Back returns step by step.
- [ ] Body part with mixed equipment: equipment chips appear with counts; choosing one shows only exercises that list it; "Any equipment" restores all.
- [ ] Equipment chip + difficulty filter with no matches shows "No exercises match these filters"; Clear filters restores the list.
- [ ] Exercise page: rest timer shows the exercise's rest time (e.g. 1:30).
- [ ] Rest timer: Start counts down; Restart goes back to the full time; Stop resets; at 0:00 it says "Rest over" and the phone vibrates (or silently skips if vibration is off).
- [ ] Rest timer: start it, press Back before it ends: no vibration later. Start it, switch to another app for longer than the rest, return: it shows "Rest over".
- [ ] Demonstration panel says "Demonstration coming soon"; no fake video plays.

## 5. Tracking (Progress and Log a day)
- [ ] Log today with calories, protein, water, steps, sleep, workout, energy, notes and weight; save; values show on Progress and Home.
- [ ] Keyboard: every field can be reached and seen while typing (scroll if needed); Save is reachable with the keyboard open.
- [ ] Invalid weight "84.2.3" shows "Weight: enter a number, like 72.4." and doesn't save.
- [ ] Edit a past day from Recent days; changes are saved.
- [ ] Clear every field of a logged day and Save: it asks to delete; Cancel keeps it, Delete removes it.
- [ ] Delete a day from its form: it disappears from history and stats.
- [ ] 7 days / 30 days toggle changes the summary and charts.
- [ ] Pull down on Progress to refresh.

## 6. Offline (airplane mode)
- [ ] Airplane mode, open the app fresh: Workouts and exercises still work; Progress shows "Couldn't load your log" with Try again; nothing crashes.
- [ ] Airplane mode with Progress already loaded: refreshing shows "Couldn't refresh — showing your last saved log".
- [ ] Airplane mode, try to save a day: an error shows and the form keeps what you typed; turn airplane mode off and save again: it saves once.
- [ ] Airplane mode, try to sign in: a clear "can't reach" message, no crash.

## 7. Android Back button and gestures
- [ ] Back from an exercise → body part → mode → Workouts list.
- [ ] Back from Log a day closes it without saving (nothing changed on the server).
- [ ] Back on Sign in / Join / Delete account closes the sheet.
- [ ] Back on Home (root) leaves the app, and reopening keeps you signed in.
- [ ] Tab bar: pressing the open tab again returns its stack to the top (Workouts).

## 8. Account deletion (only once the website change is live)
- [ ] Profile → Delete my account: lists what is deleted and kept.
- [ ] Wrong password: "That password isn't right.", still signed in.
- [ ] Right password: signed out, "Account deleted"; signing in again fails.

## 9. Small screens and accessibility
- [ ] On a narrow phone (≤ 360 dp): Home, Workouts filters, exercise page, Progress and the tab bar have no cut-off text or sideways scrolling.
- [ ] Largest font size: screens still usable; quick tiles switch to two by two.
- [ ] TalkBack: tabs, tiles, filters, the rest timer and Today card are announced with sensible names; "Rest over" is announced.

## Result
- [ ] Pass  - [ ] Pass with notes  - [ ] Fail
- Notes / screenshots of issues:
