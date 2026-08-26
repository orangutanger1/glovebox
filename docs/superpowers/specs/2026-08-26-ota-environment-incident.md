# The OTA that closed the app on the paywall button

**2026-08-26.** An over-the-air update published at 23:51 UTC on 25 August left
every install that took it unable to reach the paywall: pressing "Keep my car on
record" on the last onboarding screen terminated the app. Product analytics went
silent at the same moment. Both were the same defect, and neither was in the code
the update changed.

## What the update actually changed

Nothing that runs on that screen. The bundle's JavaScript was equivalent to the
one already embedded in build 15; the difference was the environment it was
compiled with.

`EXPO_PUBLIC_*` values are not read at runtime. Metro inlines them into the
bundle at export time, so the bundle a phone downloads carries its own frozen
copy of every one of them. `eas update` takes `--environment` to decide which
set of server-side values that is. Without the flag it publishes with whatever
the publishing shell held, which was nothing:

- `EXPO_PUBLIC_RC_IOS_KEY` was absent, so `initPurchases` returned early and
  `Purchases.configure` was never called.
- `EXPO_PUBLIC_POSTHOG_KEY` was absent, so `initAnalytics` returned early and no
  event was ever sent again.

`ship ota` is what publishes here, and it runs

```
eas update --branch production --message … --non-interactive
```

with no `--environment` at all. The command's own help calls the flag "required
for projects using Expo SDK 55 or greater"; it is not enforced, and the update
published cleanly.

## Why an unconfigured SDK is a crash and not an error

`RevenueCatUI.presentPaywall` crosses into `PaywallsHelper` on the iOS side,
which reads `Purchases.shared`. Reading that singleton before `configure` is a
Swift `fatalError`: the process is killed. No Objective-C exception, no promise
rejection, nothing for the `try/catch` around `presentOffering` to catch. From
outside it is indistinguishable from the user closing the app themselves, which
is why the report was "the app straight up closes".

The same is true of `presentPaywallIfNeeded` and `presentCustomerCenter`. The
data-side calls — `getOfferings`, `getCustomerInfo`, `restorePurchases` — reject
their promises instead, which is why launch survived and only the sheet killed
the app.

## The evidence

PostHog answered the whole question, once the funnel instrumentation from
2026-08-24 was there to be read.

| Time (UTC) | What the timeline shows |
| --- | --- |
| 23:35 | `paywall_shown` → `paywall_presented result=CANCELLED ms=2005` on build 15's embedded bundle. The paywall worked. |
| 23:51 | The update is published. |
| 00:27 | Launch: `Application Opened`, one step view, `Application Backgrounded`. The update downloads here and applies on the next launch. |
| 00:27–00:54 | Nothing at all, through repeated crashing sessions. A bundle with no ingestion key cannot report its own failure. |
| 00:54 | After the corrected republish: `paywall_shown` → `paywall_presented` → `paywall_closed`, and `onboarding_completed`. |

The blackout is the fingerprint. An app that stops reporting at the exact instant
an update applies has lost its keys, and the paywall key travels in the same
bundle by the same mechanism.

## What was changed

1. **`src/purchases` never hands an unconfigured SDK to RevenueCat UI.**
   `presentOffering`, `presentPaywall` and `presentCustomerCenter` all gate on
   `Purchases.isConfigured()`. The crash case is now one `paywall_unconfigured`
   event and a trip to the garage. `tests/purchases-guard.test.ts` holds the line.
2. **`src/analytics/reportFatals()`** installs React Native's global error
   handler and captures `js_error` with message and stack. In a release build an
   unhandled JS exception is `RCTFatal`, which looks exactly like a native crash
   from the outside; PostHog persists its queue, so the event survives the
   termination and arrives on the next launch. A crash on someone else's phone is
   now a stack trace.
3. **`npm run ota` is the only way to publish.** `scripts/ota.mjs` reuses
   `ship ota --check` for the native-graph verdict, then exports under
   `eas env:exec production`, greps the built bundle for the *value* of every key
   in `REQUIRED`, and refuses to publish if any of them failed to inline. After
   publishing it fetches the manifest the phones will fetch and confirms the
   channel serves the update it just made.

`REQUIRED` is a publish gate, not an inventory: a key belongs in it when its
absence is a crash rather than a degradation.

## The rule

Never run `eas update` or `ship ota` by hand. `npm run ota -- --message "…"`.

An `EXPO_PUBLIC_*` value is part of the bundle, so every publish path that can
omit one can ship an app that boots and then dies on the first feature that
needed it — and, if the missing key is the telemetry key, dies without saying so.
