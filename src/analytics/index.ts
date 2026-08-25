import PostHog from "posthog-react-native";
import Purchases from "react-native-purchases";

/**
 * Product analytics, which exists here for exactly one question: where in
 * eighteen onboarding screens does a paid install stop walking?
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
  });
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
