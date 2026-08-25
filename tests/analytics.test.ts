import { setImmediate as yieldToEventLoop } from "node:timers/promises";
import type * as AnalyticsModule from "../src/analytics";
import type * as NavModule from "../src/onboarding/nav";

/**
 * The funnel's instrumentation, graded on the four things that would make it
 * worse than no instrumentation at all: an event that crashes a screen, an
 * event that leaks what the user typed, a step count inflated by the Back
 * button, and a completion that cannot say whether anyone paid.
 */
type Analytics = typeof AnalyticsModule;
type Nav = typeof NavModule;

// `__DEV__` is a Metro global. The analytics module reads it on the path where
// no key is configured, which is the path the first test exercises.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

// Prefixed `mock` so the hoisted module factories below are allowed to close
// over them. `unknown` rather than `void` as the return type because one test
// makes capture hand back a rejected promise.
const mockCapture = jest.fn<unknown, [string, Record<string, unknown>?]>();
const mockIdentify = jest.fn();
const mockReplace = jest.fn();

jest.mock("posthog-react-native", () => ({
  __esModule: true,
  default: class {
    capture = mockCapture;
    identify = mockIdentify;
  },
}));

// Imported by the analytics module for the RevenueCat id join; nothing here
// exercises it.
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: { getAppUserID: async () => "rc-user" },
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));

// `../src/onboarding` reaches expo-sqlite through the db client. Finishing
// onboarding is about the event and the navigation, not about the row.
jest.mock("../src/onboarding", () => ({
  completeOnboarding: jest.fn(),
  setOnboardingStep: jest.fn(),
}));

// `useFinish` is a hook only so it can reach the router; the callback it
// returns is what carries the event. Memoisation is not what is under test,
// and calling a hook outside a render needs the dispatcher stubbed.
jest.mock("react", () => ({ useCallback: <T,>(fn: T): T => fn }));

/**
 * A fresh copy of the module, because both things it remembers — the client and
 * the set of routes already seen — are module state a second test must not
 * inherit.
 */
function load(apiKey?: string): Analytics {
  if (apiKey) process.env.EXPO_PUBLIC_POSTHOG_KEY = apiKey;
  else delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  let analytics!: Analytics;
  jest.isolateModules(() => {
    analytics = require("../src/analytics") as Analytics;
  });
  analytics.initAnalytics();
  return analytics;
}

/** The one event sent, for the tests that expect exactly one. */
function onlyEvent(): { event: string; properties: Record<string, unknown> } {
  expect(mockCapture).toHaveBeenCalledTimes(1);
  const [event, properties] = mockCapture.mock.calls[0];
  expect(properties).toBeDefined();
  return { event, properties: properties ?? {} };
}

beforeEach(() => {
  mockCapture.mockReset();
  mockReplace.mockReset();
});

test("every helper is a no-op without a key rather than a crash", () => {
  const analytics = load();

  expect(() => {
    analytics.track("onboarding_step_viewed", { route: "welcome", quiz_step: null });
    analytics.trackQuizAnswer("drive", { drive: "high" });
    analytics.trackNotificationPermission("deferred");
    analytics.trackVehicleEntry("odometer", "skipped");
  }).not.toThrow();

  expect(mockCapture).not.toHaveBeenCalled();
});

test("a client that throws on capture takes nothing down with it", () => {
  const analytics = load("phc_test");
  mockCapture.mockImplementation(() => {
    throw new Error("posthog exploded");
  });

  expect(() => {
    analytics.track("onboarding_step_viewed", { route: "welcome" });
    analytics.trackQuizAnswer("drive", { drive: "high", worries: ["bills"] });
    analytics.trackNotificationPermission("granted");
    analytics.trackVehicleEntry("make", "invalid");
  }).not.toThrow();
});

test("a capture that rejects never surfaces as an unhandled rejection", async () => {
  const analytics = load("phc_test");
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);
  process.on("unhandledRejection", onUnhandled);
  mockCapture.mockImplementation(() => Promise.reject(new Error("network down")));

  expect(() => analytics.trackNotificationPermission("denied")).not.toThrow();
  await yieldToEventLoop();
  process.off("unhandledRejection", onUnhandled);

  expect(unhandled).toEqual([]);
});

test("the second view of a route is marked as a repeat instead of vanishing", () => {
  const analytics = load("phc_test");

  analytics.track("onboarding_step_viewed", { route: "vehicle", quiz_step: 3 });
  analytics.track("onboarding_step_viewed", { route: "odometer", quiz_step: 4 });
  // Back, then forward again.
  analytics.track("onboarding_step_viewed", { route: "vehicle", quiz_step: 3 });

  expect(mockCapture.mock.calls).toEqual([
    ["onboarding_step_viewed", { route: "vehicle", quiz_step: 3, first_view: true }],
    ["onboarding_step_viewed", { route: "odometer", quiz_step: 4, first_view: true }],
    ["onboarding_step_viewed", { route: "vehicle", quiz_step: 3, first_view: false }],
  ]);
});

test("the repeat flag covers an app session, so a relaunch starts clean", () => {
  load("phc_test").track("onboarding_step_viewed", { route: "welcome" });
  expect(onlyEvent().properties.first_view).toBe(true);

  mockCapture.mockReset();
  load("phc_test").track("onboarding_step_viewed", { route: "welcome" });
  expect(onlyEvent().properties.first_view).toBe(true);
});

test("other events are not given a first_view flag", () => {
  load("phc_test").track("paywall_shown", { offering: "current" });
  expect(onlyEvent()).toEqual({ event: "paywall_shown", properties: { offering: "current" } });
});

test("a quiz answer goes out as the choices it was tapped from", () => {
  load("phc_test").trackQuizAnswer("quiz-worries", {
    drive: "high",
    worries: ["upsell", "bills"],
    reminders: true,
    cars: 2,
  });

  expect(onlyEvent()).toEqual({
    event: "quiz_answered",
    properties: {
      route: "quiz-worries",
      answer_drive: "high",
      // Sorted, so the same pair tapped in either order is one value a funnel
      // query can group by.
      answer_worries: "bills|upsell",
      answer_worries_count: 2,
      answer_reminders: true,
      answer_cars: 2,
    },
  });
});

test("an answer long enough to have been typed is replaced, not sent", () => {
  const typed = "my 2012 Honda Civic with the dented bumper";
  load("phc_test").trackQuizAnswer("quiz-service", { service: typed, worries: [typed] });

  const { properties } = onlyEvent();
  expect(properties).toEqual({
    route: "quiz-service",
    answer_service: "other",
    answer_worries: "other",
    answer_worries_count: 1,
  });
  expect(JSON.stringify(properties)).not.toContain("Honda");
});

test("the notification outcome is the whole event", () => {
  load("phc_test").trackNotificationPermission("deferred");
  expect(onlyEvent()).toEqual({
    event: "notification_permission",
    properties: { outcome: "deferred" },
  });
});

test("a vehicle entry event carries the field and what happened, never a value", () => {
  const analytics = load("phc_test");
  analytics.trackVehicleEntry("make", "focused");
  analytics.trackVehicleEntry("odometer", "skipped");

  expect(mockCapture.mock.calls).toEqual([
    ["vehicle_entry", { field: "make", event: "focused" }],
    ["vehicle_entry", { field: "odometer", event: "skipped" }],
  ]);
});

/** The exit reason is the addition the revenue question depends on. */
describe("finishing onboarding", () => {
  test.each(["paid", "trial", "free"] as const)("%s is reported as the exit", (exit) => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = "phc_test";
    jest.isolateModules(() => {
      const analytics = require("../src/analytics") as Analytics;
      analytics.initAnalytics();
      const nav = require("../src/onboarding/nav") as Nav;
      nav.useFinish()(exit);
    });

    expect(onlyEvent()).toEqual({ event: "onboarding_completed", properties: { exit } });
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
