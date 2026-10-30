# Releasing the Android app

How new versions of the app reach phones, and the checks before each step.
**Nothing on this page reaches members without the owner's explicit
approval**: every step that touches production says so.

## Three ways the app changes

| What changed | How it reaches people | Needs |
|---|---|---|
| The website, or the web app at `/app` | Deploying the website | A website deploy (the web app is re-exported with `npm run export:web`) |
| JavaScript only: screens, text, the exercise catalogue, bug fixes | An **over-the-air (OTA) update** (EAS Update). Phones download it in the background and use it on the next start | A tested staging update, promoted with approval |
| Anything native: a new package with native code, a permission, the icon or splash, the Expo SDK, `app.json` plugins | A **new build** (APK and/or Play bundle) | A new build, installed by each member |

The runtime version is a **fingerprint** of the native code
(`runtimeVersion: { policy: "fingerprint" }` in `app.json`). An update only
reaches builds with the same fingerprint, so a JavaScript update can never
land on a build whose native code it doesn't match. A native change gives a
new fingerprint; older builds just keep running what they have.

Check what an update would need before deciding:

```sh
npx expo-updates fingerprint:generate --platform android   # compare with the build's runtime version
```

Builds from before this set-up (the two `preview` APKs, versionCode 1) have
no expo-updates and **cannot receive OTA updates**. Members on them need
the first production APK.

## Builds and channels

| Profile (`eas.json`) | App | Output | Channel → branch | Who gets it |
|---|---|---|---|---|
| `staging` | **Mugabe Fitness Staging** (`com.mugabefitness.app.staging`) | APK | `staging` → `staging` | Testers only, from the EAS build page |
| `production-apk` | Mugabe Fitness (`com.mugabefitness.app`) | APK | `production-apk` → `production` | Members, from the website's `/download` page |
| `production` | Mugabe Fitness (`com.mugabefitness.app`) | Play bundle (AAB) | `production-play` → `production` | Members, from Google Play |

- The staging app is a separate app: it installs **beside** the production
  app and never replaces it. Its name differs so testers can tell them apart.
- Both production channels read the one `production` branch, so one
  tested update reaches APK and Play members alike. The channel is built
  into each app, and the app uses it to send people to the right place for
  a new version (website or Play).
- Version codes are kept by EAS (`appVersionSource: "remote"`, one counter
  per app ID) and go up by one on every build (`autoIncrement`). The
  production APK and Play bundle share a counter, so they never collide.
- `base` only holds shared settings. Never build it: it has no channel.
- Staging and production differ **only** in name and app ID.
  `fingerprint.config.js` skips exactly those fields, so both get the same
  runtime version and a tested update can be promoted unchanged.
  `__tests__/app-config.test.ts` and the fingerprint check below hold this.

## Signing and Google Play

Android installs a new APK over an existing app only if the **package
name** and the **signing certificate** match and the **versionCode** is
not lower.

- All builds of `com.mugabefitness.app` are signed with the keystore EAS
  keeps for the project ("Build Credentials 8wNG-5PAUh"). Its certificate
  SHA-256 is
  `77d1427076c0b2664100c864d1136112e3376d959d76c30ab2f67a6f4c5a3d2e`
  (read from both existing APKs with `scripts/inspect-apk.mjs`, and
  confirmed with OpenSSL).
- The staging app gets its own keystore the first time it is built. It is
  a different app, so that is expected.

**The Google Play App Signing limitation.** On Play, the key that signs what
reaches phones (the *app signing key*) is not necessarily the key we
upload with (the *upload key*). By default Google **generates** a new app
signing key for a new app. If that happens, Play installs and website-APK
installs are signed differently: a member can't move between them without
uninstalling (their account and log are on the server, so nothing is lost
except the sign-in on that phone).

To keep one signing identity for both, set Play App Signing up, when the
Play app is first created, to **use the existing key** (Play Console → Test
and release → App integrity → App signing → use the existing app signing
key, exported from EAS with Google's encryption tool) instead of letting
Google generate one. Then:

1. Check in Play Console that the **app signing key certificate** SHA-256
   equals the one above.
2. The upload key can stay the EAS keystore (EAS signs the Play bundle with
   it), or a separate upload key can be registered in Play Console.
   Either way, devices only ever see the app signing key.
3. This choice is effectively permanent: Play allows a later key upgrade,
   but upgraded keys apply only to new installs. Decide before the first
   Play upload.

Keep a backup of the EAS keystore (`npx eas-cli@latest credentials` →
Android → production → download) **offline**, never in the repo
(`.gitignore` already excludes `*.jks`) and never in chat or email. Losing
it means no further APK updates for installed members.

## One-time set-up (owner's approval needed: these change the Expo project)

```sh
cd apps/mobile
npx eas-cli@latest channel:create staging
npx eas-cli@latest channel:create production-apk
npx eas-cli@latest channel:create production-play
npx eas-cli@latest branch:create production
npx eas-cli@latest channel:edit production-apk --branch production
npx eas-cli@latest channel:edit production-play --branch production
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://mugabe-fitness.vercel.app --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value https://mugabe-fitness.vercel.app --visibility plaintext
```

(`eas build` creates a channel the first time a profile names it, but
creating them first lets the production channels share the `production`
branch from the start.)

The EAS environment variables are there for completeness: builds take the
address from `eas.json` and updates from `scripts/publish-update.mjs`, which
both pin it. Only ever put **public** values here.

## Publishing an update

Always through the wrapper, never plain `eas update`:

```sh
cd apps/mobile
node scripts/publish-update.mjs staging --message "What changed" --dry-run   # bundles and checks, publishes nothing
node scripts/publish-update.mjs staging --message "What changed"             # publishes to the staging branch only
```

The wrapper refuses uncommitted changes, bundles with the production
website address and the staging variant explicitly (ignoring any local
`.env`), refuses a bundle containing a development address, and uploads
exactly that bundle. Staging builds pick it up on their next start or the
one after (it downloads in the background, then applies on the next
start, or straight away with the "Restart now" notice on Home).

**Test it on an installed staging build** (see the checklist below), then
find its update group ID:

```sh
npx eas-cli@latest update:list --branch staging
```

### Promoting to production (owner's approval needed)

```sh
node scripts/publish-update.mjs promote --group <tested-group-id> --rollout 10 \
  --message "What changed" --owner-approved
```

This republishes the **exact** tested update to the `production` branch,
for 10% of members first. Watch for problems (crash reports from testers,
`npx eas-cli@latest update:insights`), then widen it:

```sh
npx eas-cli@latest update:edit            # raise the rollout percentage, up to 100
```

### Rolling back

```sh
npx eas-cli@latest update:revert-update-rollout   # during a rollout: everyone goes back to the previous update
npx eas-cli@latest update:rollback                # after: republish the previous update, or go back to the code built into the app
```

expo-updates also protects members by itself: if an update crashes on
launch, the app falls back to the last version that worked.

Practise both rollbacks on staging before the first production update.

## Releasing a new build

### Production APK (owner's approval needed to publish)

1. Build from a clean, pushed commit:
   `npx eas-cli@latest build --platform android --profile production-apk`
2. Download the APK and check it is publishable:
   ```sh
   node scripts/inspect-apk.mjs app.apk --release \
     --expect-cert 77d1427076c0b2664100c864d1136112e3376d959d76c30ab2f67a6f4c5a3d2e \
     --previous <versionCode of the current public APK, or 1>
   ```
   It refuses anything that isn't the production package on the
   `production-apk` channel, signed with the expected certificate, with a
   higher versionCode. **A staging or test APK can't pass.**
3. Install it over the previous public APK on a test phone and run
   `ANDROID-TEST-CHECKLIST.md` (the sign-in must survive the upgrade).
4. Host the APK somewhere permanent over https (EAS build links are
   meant for testing, not for a public download; GitHub Releases works).
5. Fill `android.apk.latest` in `public/app-release/production.json` with
   the entry `inspect-apk.mjs` printed (add the real URL and release notes),
   and deploy the website. The `/download` page offers the APK only if every
   field checks out; until then it says "Coming soon".

Members on the previous APK see "New version available" on Home.

### Making a new build mandatory (owner's approval needed)

Only when old builds must stop, e.g. after an API change they can't
handle: raise `android.apk.minimumVersionCode` (and/or
`android.play.minimumVersionCode`) in `public/app-release/production.json`.
Builds below it show a full-screen "Update required" with a link to the
download page or Play. Check it on staging first with `staging.json`.

The check runs once per launch. If the website can't be reached it never
blocks anyone: the app carries on and checks next time.

### Google Play (when the Play account exists)

```sh
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform android --profile production
```

`submit` uploads a **draft** to the **internal testing** track
(`eas.json`). Promoting it to production happens in Play Console, with
approval. Once the app is live on Play, set `android.play.storeUrl` in
`production.json` to `https://play.google.com/store/apps/details?id=com.mugabefitness.app`
so `/download` links to it. The first Play upload must be done by hand
in Play Console (a Play requirement), and Play App Signing must be set up
as described above **before** it.

## Update test checklist

On a phone with the **staging** app installed (and the production app
beside it, if possible):

- [ ] Profile shows "Version … (build N) · Staging · built-in code".
- [ ] Publish a harmless visible change to staging. Close and reopen the
      app (once or twice): Home shows "Update ready"; "Restart now" applies
      it, and Profile then shows "update xxxxxxxx".
- [ ] The production app on the same phone does **not** get it.
- [ ] Airplane mode: the app opens normally on its current version, with
      no "Update required" and no error.
- [ ] `update:rollback` on staging: after a restart or two the app is back
      on the previous version. Also try rolling back to the built-in code.
- [ ] Set `minimumVersionCode` in `staging.json` above the installed build
      and deploy: "Update required" appears with no public download link;
      lower it again and "Check again" lets you back in.
- [ ] Set `apk.latest.versionCode` in `staging.json` above the installed
      build: "New version available" appears on Home; "Later" hides it.
- [ ] After a native change, a new staging build has a new runtime
      version and the old staging build no longer receives updates.
- [ ] Production APK: install build N, then N+1 over it; still signed in.
