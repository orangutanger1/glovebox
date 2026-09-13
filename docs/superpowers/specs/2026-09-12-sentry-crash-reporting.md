# Sentry crash reporting

2026-09-12. Added alongside PostHog, not instead of it.

## Why both

PostHog already carries three crash channels and all three stay:

- `js_error` from `reportFatals` (`src/analytics`), the JS global handler.
- `boot_failed` from `boot()` and `render_error` from `ErrorBoundary`
  (`app/_layout.tsx`), each on two transports — the SDK queue and the entry
  file's raw `fetch`.
- `entry_fatal`, `module_eval_fatal` and `previous_launch_error` from
  `index.js`, before the app graph exists. This is the only channel that has
  ever explained a launch crash on this app (1.1.0, builds 17-20).

What none of them can do:

1. **Name a line.** A release bundle is minified Hermes bytecode, so every
   stack in those events is an offset. Sentry symbolicates against the source
   map uploaded by the same build.
2. **See a native crash.** A process killed by `RCTFatal` runs no JavaScript on
   the way down, so nothing in the list above fires at all.
3. **Group.** Forty rows of the same throw are forty rows in PostHog and one
   issue in Sentry, with a first-seen release attached.

So: PostHog says which user, on which OTA, at which step of the funnel. Sentry
says which line. `identifyFromPurchases` sets the RevenueCat app user id on
both, which is the column that joins them.

## What is on

Errors and native crashes only, `sampleRate` 1.0. Tracing
(`tracesSampleRate: 0`, `enableAutoPerformanceTracing: false`) and session
replay are off: the GitHub Student pack allows 100K transactions and 500
replays a year, and both would be spent on questions
`onboarding_step_advanced` already answers. `enabled: !__DEV__` — a dev build
throws red boxes on purpose and every one would be an issue against the
production release.

## Configuration

| Variable | Secret? | Read by | Effect if unset |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SENTRY_DSN` | No, write-only | `src/crash` at runtime | Module is a no-op; nothing is reported |
| `EXPO_PUBLIC_SENTRY_ENV` | No | `src/crash` at runtime | Falls back to the OTA channel |
| `SENTRY_ORG` / `SENTRY_PROJECT` | No | `app.config.js` at build | Config plugin is omitted; no map upload, stacks arrive minified |
| `SENTRY_AUTH_TOKEN` | **Yes** | `@sentry/cli` during the native build | Map upload fails; reporting still works |

Local values go in `.sentry.env` (gitignored, same convention as
`.posthog.env`). Build values go in EAS environment variables for development,
preview and production, with `SENTRY_AUTH_TOKEN` set as **secret** type.

## Native build required

`@sentry/react-native` is a native module and the config plugin edits the iOS
project. It cannot arrive over the air: an OTA update to an existing binary
loads `src/crash`, fails the guarded `require`, and reports nothing. The first
build after this commit must be a full EAS build.
