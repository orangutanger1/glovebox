import type * as SentryModule from "@sentry/react-native";
import type * as UpdatesModule from "expo-updates";

/**
 * Crash reporting, which answers the one question the analytics stream cannot:
 * what the line of code was.
 *
 * PostHog already carries `js_error`, `boot_failed` and the entry file's raw
 * `entry_fatal`, and all three stay — they are the only crash signal that is
 * joinable to the funnel in one query, and the entry channel is the only thing
 * that has ever explained a launch crash on this app. What none of them can do
 * is read a release stack: what ships is minified Hermes bytecode, so the
 * frames in those events name a bundle offset. They also cannot see a native
 * crash at all, because a process killed by `RCTFatal` runs no JavaScript on
 * the way down.
 *
 * Sentry is here for exactly those two things: a symbolicated stack against
 * the uploaded source map, and the native side. So a crash produces a PostHog
 * row that says which user, on which OTA, at which step of the funnel, and a
 * Sentry issue that says which line — and the two are joined by the same
 * `distinct_id` this module tags every event with.
 *
 * Everything else Sentry sells is off. Tracing spends the transaction quota on
 * app-start spans nothing here is asking about, and session replay is 500
 * recordings against a flow whose shape the funnel already reports. Errors
 * only, sampled at 1.0, because an error that is dropped is the one that
 * mattered.
 *
 * The whole module is a no-op without a DSN, on the same rule as analytics: a
 * dev build, a simulator run and a test post nothing and throw nothing.
 */
let sentry: typeof SentryModule | null = null;

/**
 * The SDK, or nothing.
 *
 * `@sentry/react-native` is a native module. It is absent under ts-jest, on
 * web, and in any dev client built before it was added to the config — and a
 * missing crash reporter must never be the crash. Required through a guard for
 * the same reason `expo-updates` is in `src/analytics`.
 */
function load(): typeof SentryModule | null {
  try {
    return require("@sentry/react-native") as typeof SentryModule;
  } catch {
    return null;
  }
}

/**
 * Which build this is, in the two fields Sentry matches source maps on.
 *
 * `release` and `dist` must equal what the build uploaded its maps under or
 * every stack stays minified, which is the entire value of the integration.
 * They are the native version and build number, because that is what the
 * bundler stamps — and that pair is also what an OTA leaves unchanged, so the
 * update id is carried separately as a tag, exactly as the analytics module
 * carries it as an app property.
 */
function bundleTags(): Record<string, string> {
  try {
    const Updates = require("expo-updates") as typeof UpdatesModule;
    return {
      ota_update_id: Updates.updateId ?? "embedded",
      ota_is_embedded: String(Updates.isEmbeddedLaunch),
      ota_channel: Updates.channel ?? "none",
      ota_runtime_version: Updates.runtimeVersion ?? "none",
    };
  } catch {
    return {};
  }
}

export function initCrashReporting(): void {
  if (sentry) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const sdk = load();
  if (!sdk) return;
  try {
    sdk.init({
      dsn,
      // The channel an OTA build belongs to, so a preview crash is never read
      // as a production one. Falls back to the build type rather than to
      // "production", which is the guess that costs an hour.
      environment: process.env.EXPO_PUBLIC_SENTRY_ENV ?? bundleTags().ota_channel ?? "unknown",
      // Every error. The free tier is 50K a year against an install base in
      // the hundreds; sampling here buys nothing and loses the outlier.
      sampleRate: 1.0,
      // Off, deliberately. See the module comment: transactions and replays
      // are quota spent on questions the funnel already answers.
      tracesSampleRate: 0,
      enableAutoPerformanceTracing: false,
      // The native layer is half the reason this exists — a crash that never
      // reaches JavaScript is invisible to every other channel in the app.
      enableNative: true,
      // A console line is a breadcrumb, not an event. Without this the trail
      // in front of a crash is navigation and nothing else.
      enableCaptureFailedRequests: false,
      attachStacktrace: true,
      // The dev build is not the subject. It throws red boxes on purpose and
      // every one of them would be an issue against the production release.
      enabled: !__DEV__,
    });
    sdk.setTags(bundleTags());
    sentry = sdk;
  } catch {
    /* crash reporting is never load-bearing */
  }
}

/**
 * One error, with the name of the thing that was being done when it failed.
 *
 * `where` is the same vocabulary the PostHog events use — the boot step name,
 * `render_error`, `js_error` — so an issue here and a row there are the same
 * incident under the same label, without anybody having to remember a mapping.
 */
export function reportCrash(where: string, error: unknown, extra?: Record<string, unknown>): void {
  try {
    if (!sentry) return;
    const thrown = error instanceof Error ? error : new Error(String(error));
    sentry.captureException(thrown, { tags: { where }, extra });
  } catch {
    /* crash reporting is never load-bearing */
  }
}

/**
 * The id both systems key on.
 *
 * PostHog identifies on the RevenueCat app user id, so revenue, the campaign
 * and the funnel all hang off one value. Sentry gets the same one: a crash
 * issue and the user's funnel timeline are otherwise two datasets with no
 * column in common, and "which step were they on when it died" is the question
 * that gets asked first every time.
 */
export function identifyCrashUser(id: string): void {
  try {
    sentry?.setUser({ id });
  } catch {
    /* crash reporting is never load-bearing */
  }
}

/**
 * Sends what is queued, now.
 *
 * Called on the paths that are on the way to a terminated process, where the
 * SDK's own schedule never arrives. Not awaited, for the same reason the
 * analytics flush is not: the caller has a second at most.
 */
export function flushCrashes(): void {
  try {
    const pending: unknown = sentry?.flush();
    if (pending instanceof Promise) pending.catch(() => {});
  } catch {
    /* crash reporting is never load-bearing */
  }
}
