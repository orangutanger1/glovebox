import PostHog, { type PostHogCustomAppProperties } from "posthog-react-native";
import Purchases from "react-native-purchases";
import type * as UpdatesModule from "expo-updates";

/**
 * Product analytics, which exists here for exactly one question: where in
 * fifteen onboarding screens does a paid install stop walking?
 *
 * RevenueCat answers "did they pay" and Apple answers "did they install".
 * Neither can say which screen lost them, so a paywall with no subscribers and
 * a flow that drops half its users at the odometer prompt look identical from
 * the outside. That ambiguity is what made the last round of ad analysis
 * unfalsifiable.
 *
 * The client is created lazily and every call is a no-op without a key, so a
 * dev build, a simulator run and a test never post anything and never throw.
 * Nothing in the app should be able to fail because a telemetry call failed.
 *
 * Before reading any of what it emits: the flow these events describe has been
 * rebuilt repeatedly, and the event names did not change when it did, so the
 * stream looks continuous across changes that make it uncomparable. Every such
 * break is recorded in
 * docs/superpowers/specs/2026-08-26-funnel-comparability-register.md, newest
 * last, and anything that moves, merges or removes a screen belongs in it in
 * the same commit.
 */
let client: PostHog | null = null;
let warned = false;

/** Where events go. Overridable for the EU cloud or a self-hosted instance. */
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function initAnalytics(): void {
  if (client) return;
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    if (!warned && __DEV__) console.warn("EXPO_PUBLIC_POSTHOG_KEY missing, analytics disabled");
    warned = true;
    return;
  }
  client = new PostHog(apiKey, {
    host: HOST,
    // The funnel is the point; page/tap autocapture would bury it in noise and
    // needs the provider component wrapped around the tree.
    captureAppLifecycleEvents: true,
    customAppProperties: (native) => ({ ...native, ...bundleIdentity() }),
  });
}

/**
 * Which code bundle the events that follow came from.
 *
 * A native build carries a version and a build number, and PostHog sends both
 * as `$app_version` / `$app_build`. An OTA update replaces the JavaScript
 * inside that same binary and changes neither, so two devices running JS a week
 * and several flow changes apart report identical values. That is why the
 * register's own instruction — segment by update, because the OTA id is the
 * only thing separating two populations on one binary — could not be followed:
 * nothing was sending an OTA id.
 *
 * Passed as app properties rather than registered as super properties, which is
 * what this first shipped as and was wrong. `register` writes through the
 * persisted `props` key, and the SDK fills that same key from disk a moment
 * later when its storage preload resolves (`populateMemoryCache`, per key) —
 * so a value registered in the constructor's tick is overwritten by the
 * previous session's copy, and `Application Opened`, which the SDK captures
 * after that preload, reports the bundle the phone was running last launch.
 * App properties are read off the client on every event, lifecycle ones
 * included, with no storage anywhere in the path.
 *
 * `updateId` is null for the bundle shipped inside the binary, and a null in
 * PostHog cannot be told apart from a property that was never sent — so the
 * embedded case gets a value of its own. `expo-updates` is a native module, so
 * it is read through a guarded require: it is absent under ts-jest, on web, and
 * in a dev client built without it, and none of those may throw here.
 *
 * The cast is the one dishonest line in the file: `PostHogCustomAppProperties`
 * is a closed interface of `$`-prefixed device fields, and these five are not
 * among them. The SDK spreads whatever it is given into every event's
 * properties, so the runtime contract is exactly right and only the published
 * type is narrower than the behaviour.
 */
function bundleIdentity(): PostHogCustomAppProperties {
  try {
    const Updates = require("expo-updates") as typeof UpdatesModule;
    return {
      ota_update_id: Updates.updateId ?? "embedded",
      ota_is_embedded: Updates.isEmbeddedLaunch,
      ota_channel: Updates.channel,
      ota_runtime_version: Updates.runtimeVersion,
      ota_created_at: Updates.createdAt?.toISOString() ?? null,
    } as PostHogCustomAppProperties;
  } catch {
    return {};
  }
}

/** The property bag PostHog accepts: flat JSON, one level deep. */
type Props = Parameters<PostHog["capture"]>[1];

const STEP_VIEWED = "onboarding_step_viewed";

/**
 * Routes whose first view has already been counted, for this process.
 *
 * `onboarding_step_viewed` comes from the shared frame's effect, which re-runs
 * when Back returns the user to a screen they have already seen. Left alone
 * that inflates every step's denominator: one user who walks forward, backs up
 * and walks forward again contributes two views to one screen and makes its
 * drop-off rate look better than it is.
 *
 * The correction lives here and not in the frame because the frame only knows
 * about itself, while the question is about the session. Repeat views are
 * flagged, never dropped: a hesitation is the single most interesting thing a
 * user does in the funnel, and deleting it would leave a hole in the timeline
 * exactly where the answer is.
 */
const viewedRoutes = new Set<string>();

function withFirstView(properties?: Props): Props {
  const route = properties?.route;
  const key = typeof route === "string" ? route : "unknown";
  const first = !viewedRoutes.has(key);
  if (first) viewedRoutes.add(key);
  return { ...properties, first_view: first };
}

/**
 * One event. Never throws, never awaits: a screen must not render a spinner
 * because a POST is slow.
 */
export function track(event: string, properties?: Props): void {
  try {
    const props = event === STEP_VIEWED ? withFirstView(properties) : properties;
    // `capture` is declared to return void, but it has handed back a promise
    // across SDK versions. An unhandled rejection from telemetry is still a
    // red box in a dev build and a logged crash report in a release one.
    const pending: unknown = client?.capture(event, props);
    if (pending instanceof Promise) pending.catch(() => {});
  } catch {
    /* telemetry is never load-bearing */
  }
}

/**
 * Every crash the JavaScript side can still describe.
 *
 * In a release build an unhandled JS exception is not a red box, it is
 * `RCTFatal`: the process is killed and the user sees the app close on a tap
 * with no message, which is indistinguishable from a native crash and equally
 * undebuggable from the outside.
 *
 * The event is flushed rather than left in the queue. A queued event is
 * persisted and sent on the next launch, which is enough for a crash the user
 * can walk away from — and worth nothing for a crash at launch, because there
 * is no next launch that gets far enough to flush. Under `expo-updates` a
 * launch-time fatal is worse than a termination: error recovery waits for a
 * remote update, finds none for this runtime version, and calls
 * `ErrorRecovery.crash()`, so the process aborts in under a second with the
 * JavaScript message nowhere in the iOS crash report.
 *
 * The previous handler is called afterwards, always. Swallowing the fatal would
 * leave the app running on a broken state it has already lost track of, which
 * is worse than the crash.
 */
export function reportFatals(): void {
  const utils = globalErrorUtils();
  if (!utils || installed) return;
  installed = true;
  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    track("js_error", {
      message: errorField(error, "message") ?? String(error),
      // Truncated: the frames near the throw are the ones that name the bug,
      // and PostHog rejects properties past a size no stack needs.
      stack: (errorField(error, "stack") ?? "").slice(0, 4000),
      fatal: isFatal === true,
    });
    flushNow();
    previous?.(error, isFatal);
  });
}

/**
 * Starts the POST now instead of on the queue's own schedule. There is no
 * awaiting it: the caller is on the way to a terminated process, and the
 * network call either wins that race or does not.
 */
export function flushNow(): void {
  try {
    const pending: unknown = client?.flush();
    if (pending instanceof Promise) pending.catch(() => {});
  } catch {
    /* telemetry is never load-bearing */
  }
}

type ErrorUtilsLike = {
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
  setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

/**
 * React Native's own crash hook, which is a global rather than a module and is
 * absent under the test renderer and on web. Narrowed rather than asserted:
 * what is thrown at this boundary is by definition whatever went wrong.
 */
function globalErrorUtils(): ErrorUtilsLike | null {
  const utils: unknown = Reflect.get(globalThis, "ErrorUtils");
  if (!utils || typeof utils !== "object") return null;
  const set: unknown = Reflect.get(utils, "setGlobalHandler");
  if (typeof set !== "function") return null;
  const get: unknown = Reflect.get(utils, "getGlobalHandler");
  return {
    setGlobalHandler: (handler) => void set.call(utils, handler),
    getGlobalHandler:
      typeof get === "function"
        ? () => {
            const previous: unknown = get.call(utils);
            // Checked as callable; its parameter list is React Native's, not
            // something this file can prove.
            return typeof previous === "function"
              ? (previous as (error: unknown, isFatal?: boolean) => void)
              : undefined;
          }
        : undefined,
  };
}

/** A string field off a thrown value, when the thrown value has one. */
function errorField(error: unknown, field: "message" | "stack"): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value: unknown = Reflect.get(error, field);
  return typeof value === "string" ? value : undefined;
}

let installed = false;

/**
 * The longest string the quiz's chips can produce. Anything longer did not
 * come from a chip, so it is not an enum and must not be sent.
 */
const MAX_ENUM_LENGTH = 32;

/**
 * A quiz answer, as the closed set of choices it was tapped from.
 *
 * The quiz is the only part of onboarding whose content is worth correlating
 * with revenue: whether the users who pay are the ones who said they track
 * receipts, or the ones worried about surprise bills, decides which promise
 * the paywall should lead with. So the chip values themselves go out — they
 * are a fixed vocabulary, not text.
 *
 * What does not go out is anything long enough to be typed. Multi-select
 * arrives sorted and joined so a combination is one comparable value instead
 * of an array that no funnel query can group by, with the count alongside it
 * because "how many worries did they pick" is a different question from
 * "which ones".
 */
export function trackQuizAnswer(
  route: string,
  answer: Record<string, string | number | boolean | string[]>
): void {
  const properties: NonNullable<Props> = { route };
  for (const [key, value] of Object.entries(answer)) {
    if (typeof value === "number" || typeof value === "boolean") {
      properties[`answer_${key}`] = value;
      continue;
    }
    // Single-select goes through the same path as multi-select: one value
    // sorted and joined is itself, so there is one place where a string can
    // be too long to have come from a chip and one place that shortens it.
    const chosen = typeof value === "string" ? [value] : value;
    properties[`answer_${key}`] = chosen
      .map((choice) => (choice.length > MAX_ENUM_LENGTH ? "other" : choice))
      .sort()
      .join("|");
    if (typeof value !== "string") properties[`answer_${key}_count`] = value.length;
  }
  track("quiz_answered", properties);
}

/**
 * What the user did with the notification prompt.
 *
 * `deferred` is the one that matters and the one the OS cannot report: a user
 * who backed past the ask without answering it never reaches the system
 * dialog, so iOS records nothing and the reminder feature — the whole reason
 * the app is worth paying for — is silently off for them.
 */
export function trackNotificationPermission(outcome: "granted" | "denied" | "deferred"): void {
  track("notification_permission", { outcome });
}

/**
 * A moment in the vehicle form, with no trace of what was typed.
 *
 * Year, make, model and odometer are four free-text fields in the middle of
 * the flow and the most likely place to lose someone. `focused` says the field
 * was reached, `invalid` that what they wrote was rejected, `skipped` that
 * they moved on without it — enough to find the field that stops people
 * without ever learning that they drive a 2012 Civic.
 */
export function trackVehicleEntry(
  field: "year" | "make" | "model" | "odometer",
  event: "focused" | "invalid" | "skipped"
): void {
  track("vehicle_entry", { field, event });
}

/**
 * A Continue the flow refused, and why.
 *
 * Every gated screen in onboarding greys its button out until the question is
 * answered, and a greyed button that is tapped and abandoned used to leave no
 * trace at all: the funnel saw a step view and then nothing, which is the same
 * row a user who never touched the screen produces. That blind spot is the
 * expensive one. The vehicle screen's validation loop — forty refused taps
 * from one device in 112 seconds, and no second question ever reached — was
 * only visible because that screen happened to emit `year:invalid` on every
 * refusal. Nothing else in the quiz did.
 *
 * `reason` is a fixed vocabulary owned by the screen, never user text, so the
 * question "which gate is people walking into" is one group-by. Repeats are
 * deliberately not collapsed: the count on one device in one session is the
 * signal, exactly as it was for the vehicle field.
 */
export function trackStepBlocked(route: string, reason: string): void {
  track("onboarding_step_blocked", { route, reason });
}

/**
 * Joins this device's PostHog timeline to its RevenueCat identity.
 *
 * Without it the two datasets cannot be joined at all: PostHog would key on
 * its own anonymous id while revenue, the Apple Search Ads campaign and the
 * keyword all hang off RevenueCat's app user id. Same id on both sides is what
 * makes "which keyword produced users who finished onboarding" answerable.
 */
export async function identifyFromPurchases(): Promise<void> {
  if (!client) return;
  try {
    const id = await Purchases.getAppUserID();
    if (id) client.identify(id);
  } catch {
    /* an unconfigured SDK is not an analytics failure */
  }
}
