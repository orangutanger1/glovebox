# RESOLVED — Wrenchy 1.1.0 launch crash, sessions of 2026-08-28/29

## The bug, in one sentence

`app/_layout.tsx` returned `null` until `useFonts` resolved — on every cold
launch — and a root layout that renders no navigator makes expo-router's root
slot re-dispatch navigation state until React throws
`Maximum update depth exceeded`, which under expo-updates aborts the process.

Build 20's probe returned it verbatim from the expo-updates persistent log:

```
ErrorRecovery fatal exception: Fatal error: Time: 1788017430344.647949
Domain: RCTErrorDomain
Code: 0
Description: Unhandled JS Exception: Error: Maximum update depth exceeded. This
can happen when a component repeatedly calls setState inside
componentWillUpdate or componentDidUpdate. React limits the number of nested
updates to prevent infinite loops.

This error is located at:
    at Content (main.jsbundle:151220:43)
    at RNCSafeAreaProvider
    at SafeAreaProvider
    at LinkPreviewContextProvider
    at ThemeProvider
    at EnsureSingleNavigator
    at BaseNavigationContainer
    at NavigationContainerInner
    at ContextNavigator
    at ExpoRoot
    at App
```

`Content` is expo-router's own root slot navigator
(`node_modules/expo-router/build/ExpoRoot.js:137`), whose single screen renders
`store.rootComponent` — the app's root layout. **No app component appears below
it in the owner stack**, which is the tell: at the moment the loop tripped, the
root layout was rendering `null`, so there was no navigator for the route the
router was holding.

Why it read as a native crash with no JavaScript anywhere in it: React's
update-depth invariant is thrown inside the commit, which on this stack is
driven from `RuntimeScheduler_Modern::runEventLoopTick` on the JS thread. RN
wraps every JS-thread work unit in `tryAndReturnError`
(`React/CxxModule/RCTCxxUtils.mm:63-81`), which converts the throw to an
`NSError` and hands it to `RCTFatal` — past `ErrorUtils.setGlobalHandler`, past
every JS `try`/`catch`, past every error boundary. expo-updates' `ErrorRecovery`
then waited for a remote update, found none it could use, and re-raised the
error from its own dispatch queue, which is the only frame Apple's report ever
showed.

Why 1.0.2 was fine: it has no `useFonts` and no early return. `git diff
beaa190..HEAD -- package.json` is empty; nothing native ever changed. The
`if (fatal)` early return existed in 1.0.2 too, but only fires when the
database dies, which is why it never showed.

## The fix

OTA `01a04e95-4756-7cdc-b26f-6452095da1bd`, runtime 1.1.0 / production,
published 2026-08-29 ~17:40Z and verified being served. `app/_layout.tsx` now
always renders `ThemeProvider > Chrome`, and `Chrome` always mounts `<Stack>`.
The two states that used to replace the tree are drawn over it instead: an
opaque `c.base` curtain while the fonts load, and `FatalNotice` when the
database is unusable. `tests/design-tokens.test.tsx` asserts the navigator is
mounted on the first commit while the fonts are unresolved — the test that used
to assert the opposite is what encoded the bug.

Standing rule for this app: **nothing may return early from `RootLayout`, and
no `<Stack.Screen>` may be conditionally rendered.** Gate pixels, never the
navigator.

---

# Original handoff (superseded, kept for the trail)

App: Wrenchy, `com.idea6.carmaintenancelog`, Expo SDK 57, RN 0.86.2 (New
Architecture), expo-updates ~57.0.11, version 1.1.0. Branch
`warm-garage-redesign`. TestFlight-only; nothing submitted for review. Working
reference: build 15 (1.0.2, App Store) runs fine on the same phone (iPhone 14,5,
iOS 26.6), including fresh installs on 08-28 23:15 and 08-29 00:07 PDT.

## State at handoff — superseded, see "Session 3" below

## What the crash is

Every crash report is the same signature: SIGABRT ~0.5–1.3 s after launch,
crashed thread inside expo-updates:
`ErrorRecovery.notify(newRemoteLoadStatus:) → runNextTask() → crash()` →
NSException. No JavaScript frames anywhere. expo-updates only reaches `crash()`
after a fatal error routed through the RCT fatal handler, and when the
update check is already cached-idle the notify→abort gap is milliseconds —
which is why no JS-side report ever escapes (see below).

Three reports pulled via `asc testflight crashes log --submission-id …`
(copies in the session scratchpad as b17-crash.log / b18-crash.log /
b19-crash.log):

- Build 17 — submission `AG9NWw7j8HqZpDmXk1LNtOY`, abort at 472 ms.
- Build 18 — `AM5mMSD_1AYT7hn33Pqn1_k`, 531 ms, **plus six threads blocked** in
  `AdServices -[AAAttributionRequester attributionTokenWithError:]`, all from
  `AttributionFetcher.realAdServicesToken` (RevenueCat PurchasesHybridCommon
  Swift tasks). App binary UUID identical to build 17's (`ca6a064e…`): the
  native code did not change between 17 and 18.
- Build 19 — `AJonIjAfIezJtHgB7VrIxJI`, **1260 ms**, and **the JS thread was
  alive and executing** at abort (RuntimeScheduler_Modern event loop, microtask
  drain, generators) while the six AdServices threads stayed blocked. A JS
  exception on the JS thread cannot evade `ErrorUtils.setGlobalHandler` and the
  error boundary — so the fatal most likely surfaces from native code called
  from JS, not from an ordinary JS throw.

## What was ruled out (with evidence)

- **Native config drift**: build 17/18 IPAs diffed — framework byte-sizes
  identical, Expo.plist identical (`EXUpdatesEnabled ALWAYS`, runtime 1.1.0,
  channel production), only Info.plist buildNumber + signature + main.jsbundle
  (+2 KB = the instrumentation diff) differ.
- **Module-evaluation throw in the bundle**: build 19's PostHog `Application
  Installed` + `$identify` events prove the boot effect ran through analytics,
  database (v6 migration), language, units, purchases (RevenueCat configured)
  and identify. The 006f23f diff is eval-inert (every change inside function
  bodies — read line by line). The 1.1.0 train added **zero new dependencies**
  (`git diff beaa190..HEAD -- package.json` is empty).
- **Hermes Intl gaps**: the app's own history (build 1.0(11) rejected for
  `Intl.PluralRules`, see tests/hermes-runtime.js) suggested this class; swept
  every `Intl.`/`toLocale*` call — the i18n core is hand-rolled Hermes-safe,
  DateWheel is old and not on the boot path.
- **Corrupt embedded bundle**: main.jsbundle has valid Hermes magic; the
  embedded manifests of 17 and 18 are structurally identical (`launchAsset:
  null` is the normal SDK-57 embedded format — 17's JS ran against it).
- **The 59 test failures**: environment, not regressions — identical failures
  at e504dc2; root causes were React 19 removing `react-test-renderer.act`
  and the shell exporting `NODE_ENV=production` (React's production build has
  no `act`). Fixed; 408/408 green.

## Why the instrumentation stayed silent (important for the next attempt)

1. posthog-react-native flushes on a ~30 s timer, on background, or on
   identify/flushNow. Every launch dies sub-second, so the timer never fires
   and captures stay trapped in on-device storage forever.
2. When the update check is already cached-idle, the recovery pipeline's
   notify→crash gap is milliseconds, so even `flushNow()`'s POST loses the
   race against the abort on the failing launches themselves.
3. A fatal raised off the JS thread (native) never passes through
   `ErrorUtils.setGlobalHandler` or any error boundary at all.

Consequence: **the fastest diagnostic loop is OTA bisection, not crash reports**
— the recovery pipeline waits up to 5 s and relaunches a downloaded update, and
build 19's launches live ~1.3 s, so a published OTA that removes the fatal
should self-apply on the crashed phone within a few opens. That was the bet of
OTA `01a04e5c` (AdServices disabled). Whether it applied is the open question.

## Prime suspect

`Purchases.enableAdServicesAttributionTokenCollection()`
(src/purchases/index.ts:50, now commented out in the working tree): on iOS
26.6 it fans out six concurrent `AAAttributionRequester` fetches, all wedged on
the framework's own semaphore at abort time. Caveat kept honest: 1.0.2 calls
the same line and does not crash on this phone — so it is either one trigger
among several, timing-dependent, or innocent. The OTA tests it directly.

## Changes made (all uncommitted)

- `tests/{design-tokens,garage-card,onboarding-screens,theme.provider,useIsPro}.test.tsx`:
  `act` now imported from `react`.
- `jest.config.js`: `process.env.NODE_ENV = "test"` (shell had `production`).
- `src/purchases/index.ts`: AdServices collection disabled, rationale comment.
- `index.js`: bootstrap entry with raw-fetch reporting (correct endpoint now:
  `POST $HOST/batch/` with `distinct_id`) — currently UNUSED (package.json
  `main` reverted to `expo-router/entry` because the fingerprint gate refused
  the config change); wire it into a build 20 by setting `"main":
  "./index.js"`.
- `.asc/native-lock.json`: buildNumber refreshed 17→19 (the `eas build`
  autoIncrement bypassed ship's ledger; the OTA gate refused until this was
  honest).
- `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md`: dated
  correction entry (the "zero events for 1.1.0" claim lost an ingestion race;
  on device `ota_update_id` is never the `"embedded"` sentinel — use
  `ota_is_embedded`).

## Tooling facts

- Crash logs: `asc testflight crashes list --app 6797103341` / `asc testflight
  crashes log --submission-id …` (auth profile "tour" works).
- PostHog read API: project 574255, credentials at `~/.omp/posthog/car.json`
  (`personalApiKey`, HogQL via `POST https://us.posthog.com/api/projects/
  {id}/query/`). **Never print the key.** `.posthog.env` holds only the
  write-only ingestion key.
- `jq` is NOT installed — use python3.
- The shell exports `NODE_ENV=production`.
- OTA publish: `npm run ota -- --message "…"` (self-gating: fingerprint check,
  `--clear` export, key-inlining verification, served-manifest verification).
- IPAs for 17/18 are extracted in the session scratchpad (`b17/`, `b18/`).

## Suggested next steps, in order

1. Determine whether OTA `01a04e5c` applied to the phone (PostHog since
   16:30Z: any event with `ota_update_id 01a04e5c…` or `$app_build 19` past
   16:05; and/or a shared crash report).
2. If applied and still crashing: AdServices is exonerated as the sole cause.
   Bisect via OTA — publish variants that additionally no-op
   `rescheduleAll()` (expo-notifications), then RevenueCat `configure`, then
   quick-actions. Each publish is minutes, no TestFlight build.
3. If a native build is cut anyway (build 20): wire `index.js` as entry (raw
   reports + `app_graph_loaded` bracket), set the PostHog SDK to flush
   immediately (`flushAt: 1` or ~1 s interval) so captures escape sub-second
   launches, and consider an AppDelegate/os_log timestamp probe.
4. Standup constraint reminders: nothing submitted for App Review, no
   `ship submit`, version stays 1.1.0, TestFlight-only.

## Session 3 (2026-08-29 16:40–17:30Z) — what is now known

### The OTA never applied, and could not have

PostHog, last event before the fix build: `Application Opened` at 16:32:48Z,
`$app_build 19`, `ota_is_embedded true`, `ota_update_id c18c00a3…` (build 19's
*embedded* id). A fresh crash report followed at 16:33:12Z (submission
`AK7jEbxmiad6czxdsnOHcnk`, 923 ms, same `ErrorRecovery.crash()` signature). The
phone was still running the embedded bundle two minutes after `01a04e5c` was
published, so nothing about that OTA — AdServices included — was ever tested.

The server side is fine: `GET https://u.expo.dev/<project>` with
`expo-runtime-version: 1.1.0` / `expo-channel-name: production` returns
`expo-update-id: 01a04e5c…`. The client side cannot finish. `ErrorRecovery`
aborts the moment `notify(newRemoteLoadStatus:)` arrives with anything other
than `NewUpdateLoaded`, and on this phone that arrives in under a second — so
every launch gave the downloader ~500–900 ms and then killed the process.
**An OTA cannot be a diagnostic loop for this bug while the abort wins the
race.** That is what build 20 fixes (below), and it is the single most
important change of this session.

### The fatal is a native throw on the JS thread. Proven, not inferred.

`ErrorRecovery.crash()` re-raises the *original* error (ErrorRecovery.swift:277
→ `throwException` → `NSException.raise()`), and Apple keeps no reason string
for it, which is why four crash reports contain no message. expo-updates
installs `RCTSetFatalHandler`/`RCTSetFatalExceptionHandler`, so the original
error came through `RCTFatal`.

RN 0.86 wraps every block dispatched to the JS thread in
`facebook::react::tryAndReturnError` (React/CxxModule/RCTCxxUtils.mm:63-81),
which catches `NSException` **and** `std::exception`, converts it to an
`NSError`, and hands it to `RCTFatal`
(ReactCommon/…/RCTJSThreadManager.mm:110-113). That path bypasses
`ErrorUtils.setGlobalHandler`, every JS `try`/`catch`, and every React error
boundary — which is exactly why build 19's instrumentation
(`boot_failed`, `render_error`, `entry_fatal`) never emitted a single event
while `Application Installed`/`$identify` from the same launches arrived
normally. The crash is an ObjC/C++ exception escaping a synchronous native call
on the JS thread. It is not a JS throw, and no amount of JS `try`/`catch` will
catch it.

Supporting detail from build 19's 16:08Z report: the JS thread was inside
`RuntimeScheduler_Modern::runEventLoopTick` → `drainMicrotasks` → generator
resume → `FileSystemFile.write` → `FileSystemPath.validatePermission`. That is
posthog-react-native's storage `setItem` (`native-deps.js`,
`buildOptimisticAsyncStorage`: `await new File(Paths.document, key).write(value)`
— a *synchronous* host function awaited inside an async function). Caught
mid-flight, not proven to be the thrower.

### Three parallel audits, three negative results

Recorded so nobody re-runs them:

- **Reanimated / worklets / expo-blur / expo-linear-gradient / gesture-handler
  / safe-area-context**: clean, and `react-native-reanimated` and
  `react-native-worklets` have **zero** usage anywhere in `app/` or `src/`.
  expo-blur and expo-linear-gradient are Expo Modules views: their props are an
  opaque `folly::dynamic` on the JS thread and are only coerced on the main
  thread inside `updateProps`, where Expo catches failures — structurally
  incapable of producing this signature.
- **NaN/Infinity/malformed style values**: none exist in the diff (three
  divisions in the whole design system, all with constant non-zero
  denominators). More usefully, falsified against vendored RN 0.86: iOS Fabric
  prop conversion casts numbers with a bare `static_cast<float>` and treats NaN
  as Yoga-undefined; every unsupported-value branch in
  `components/view/conversions.h` is `LOG(ERROR)` + `react_native_expect`, not
  `LOG(FATAL)`. The `folly::toJson: NaN or INF` crash class is the Android
  route, not this one.
- **Synchronous native calls on the boot path**: the v6 migration
  (`ALTER TABLE vehicles ADD COLUMN body_style TEXT`) cannot fail on either a
  1.0.2 database or an empty one, and `$identify` proves `getDb()` returned
  anyway. Two real findings worth keeping: (a) `MIGRATIONS.length` 5 → 6 makes
  `src/db/client.ts:46` true for the first time on device, so the
  backup/copy/rollback block at :47-72 — eight unguarded synchronous
  expo-file-system calls including `live.copy(backup)` on an open WAL database
  — runs for the first time ever on an *upgrade* install; (b)
  `isOnboarded()`, `getOnboardingStep()` and `getWinbackShownAt()` are the
  three SQLite calls in the boot effect that sit **outside** `boot()`, so their
  failures emit neither `boot_failed` nor `render_error`.

### Build 20 — on TestFlight, VALID, uploaded 17:19Z

EAS build `bca25060-e78f-4235-8978-6a4b90fb6c58`, submission
`2ab1f987-234c-44c4-93d3-8deed88a9d95`. Three changes, no guesswork:

1. `app.json` — `updates.fallbackToCacheTimeout: 10000` and
   `checkAutomatically: "ON_LOAD"`. expo-updates now downloads and launches the
   newest update **before** starting JS, so a published fix lands even if the
   JS still aborts in 900 ms. This converts the feedback loop from a ~25-minute
   native build to a ~3-minute OTA. Revert before any App Store submission: it
   blocks cold launch on the splash for up to 10 s on the first launch after a
   publish.
2. `package.json` `main` → `./index.js`, wiring the bootstrap entry that was
   written last session and left unused. It reports `entry_reached`,
   `module_eval_fatal` and `app_graph_loaded` by raw `fetch` (no SDK, no
   queue), and now also reads
   `Updates.readLogEntriesAsync(24 h)` and POSTs every non-info entry as
   `previous_launch_error`. That is the payload that names the crash:
   `ErrorRecovery.writeErrorOrExceptionToLog` serialises the original
   `NSError`/`NSException` (domain, code, localizedDescription, failure reason)
   into the expo-updates persistent log *before* aborting, and that log
   outlives the process. **The launch after a crash is the one that can say
   what the crash was.**
3. `index.js` also hangs that raw reporter on `globalThis.__wrenchyReport`, and
   `boot()` / `ErrorBoundary` / the database catch in `app/_layout.tsx` now
   report through it as well as through PostHog — two channels that fail
   differently.

`Purchases.enableAdServicesAttributionTokenCollection()` stays commented out in
build 20. It is neither implicated nor exonerated (the 16:34Z report has no
AdServices threads at all and still crashed, but that binary still had the call
in it, so their absence is timing). One fewer concurrent native subsystem in
the crash window, at the cost of Apple Search Ads attribution.

### What to do next, in order

1. Install build 20 from TestFlight and open it **twice**. The first launch
   writes the error log; the second reports it.
2. Read the answer:
   ```
   select timestamp, event, properties.entries, properties.message,
          properties.step, properties.$app_build
   from events
   where event in ('previous_launch_error','boot_failed','render_error',
                   'entry_fatal','module_eval_fatal','entry_reached',
                   'app_graph_loaded')
     and timestamp > now() - interval 2 hour
   order by timestamp desc
   ```
   `previous_launch_error.entries` contains the serialised original error.
3. Fix it in JS, `npm run ota -- --message "…"`, and it lands on the phone on
   the next launch — no build needed. If the fix must be native, build again
   with the credential recipe below.
4. If build 20 does **not** crash, the delta that fixed it is the entry file
   plus the updates config; bisect from there.

### Build credentials — RESOLVED 2026-08-29 ~17:55Z

Both halves are fixed. The old diagnosis ("Apple intermittently rejects the
1200 s JWT") was wrong in one important way: the rejection is not intermittent
and not eas-cli's fault. It is this machine's clock.

**Apple's ceiling is `exp - Apple's now <= 1200`, evaluated strictly.** eas-cli
mints `exp = now + 1200` from the *local* clock, so a clock even one second fast
produces a token Apple sees as 1201 s and answers 401 NOT_AUTHORIZED; eas-cli
reports that as an Apple auth failure and offers the password prompt. Measured
with the live key against `/v1/certificates`:

| token | result |
| --- | --- |
| ttl 1199 | 200 |
| ttl 1200 | 401 |
| ttl 1200, backdated 2 s | 200 |

This WSL clock was 1.1 s ahead of Apple's `Date` header at the time and drifted
to 3.2 s within twenty minutes. So the npx `jwtDurationSeconds` patch was
treating a symptom and is no longer needed; ignore it. The fix is
`w32tm /resync` (Windows, admin) or `sudo hwclock -s` (WSL).

`scripts/asc-auth.mjs` now measures that offset before any build and refuses to
queue one when it would break the token — a named error with the remedy instead
of a password prompt 20 minutes in. `--no-clock-check` overrides it, which is
safe whenever the build needs no local Apple auth (see below).

**Key `V7S2585B32` and EAS-stored key `Z2QAJDJTXQ` are both gone.** Live key:
`JU3FJKM83R`, Admin role, issuer `06130c95-276e-4817-bc39-53abadf44e67`, stored
at `~/.config/asc/AuthKey_JU3FJKM83R.p8` (mode 600). It is registered two ways:

- **On EAS** as `glovebox admin JU3FJKM83R`
  (`83e31a9b-8a11-490e-b4e9-61c430e6bc32`, account `nakodan-capital`), set as
  both `appStoreConnectApiKeyForSubmissions` and `…ForBuilds` on
  `com.idea6.carmaintenancelog` and `.dev`. The dead `Z2QAJDJTXQ` was deleted so
  a future failure cannot silently fall back to it.
- **Locally** via gitignored `.asc.env` (`EXPO_ASC_API_KEY_PATH`,
  `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID`), layered into
  every eas-cli child by `envFor` in `scripts/eas-build.mjs`. Any one of the
  three `EXPO_ASC_*` vars switches eas-cli to API-key auth
  (`credentials/ios/appstore/resolveCredentials.js`); the team id is then
  prompted for, hence the fourth.

**Most builds need no Apple auth at all.** EAS already holds a complete
APP_STORE credential set for both bundles — distribution certificate
`63A8A070CA569B13EFD11381392D5E06` and an active provisioning profile, both
valid to **2027-01-17**, team `X36WU56Z39`. `eas.json` sets no
`credentialsSource`, so the default remote credentials are used and eas-cli only
talks to Apple when it has to create or repair something. The stale
`tashany@gmail.com` cookie under `~/.app-store/auth/` was deleted; the ambient
`eas login` session is `mayfield`, which has access to both accounts.

`.asc/native-lock.json` was refreshed by hand (buildNumber 20, `builtAt`
2026-08-29T17:12:52.525Z) because `ship build` was bypassed; `ship ota --check`
now reports **OTA SAFE**, so the OTA channel is open. Note the lock does not
track the `expo.updates` block, so the `fallbackToCacheTimeout` change is
invisible to that gate.
