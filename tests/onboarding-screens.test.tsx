import { createElement, type ReactElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

/**
 * The onboarding screens, rendered.
 *
 * `onboarding-run` walks the data path and asserts the numbers; this walks the
 * JSX and asserts the things only a render can prove: that a screen re-entered
 * from Back comes back filled in, that the evidence screen will not let you
 * past until you have scrolled it, and that the loader draws a bar and takes
 * as long as it says it does. All three were bugs a pure test cannot see.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const navigated: string[] = [];
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: (to: string) => navigated.push(to),
    replace: (to: string) => navigated.push(`replace:${to}`),
    back: () => navigated.push("back"),
    canGoBack: () => true,
  }),
}));

jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

jest.mock("react-native-purchases-ui", () => ({
  __esModule: true,
  default: {},
  PAYWALL_RESULT: {},
}));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
// The plan screen fires the iOS permission prompt on its own button now, and
// the year drum clicks. Neither native module exists under the test renderer.
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => {}) }));

import { createVehicle, getVehicle, listVehicles } from "../src/db/vehicles";
import {
  getOnboardingVehicleId,
  resetOnboarding,
  setAnswers,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";
import OnboardingVehicle from "../app/onboarding/vehicle";
import OnboardingOdometer from "../app/onboarding/odometer";
import OnboardingDrive from "../app/onboarding/drive";
import OnboardingReviews from "../app/onboarding/reviews";
import OnboardingAnalyzing from "../app/onboarding/analyzing";
import OnboardingService from "../app/onboarding/service";
import OnboardingTracking from "../app/onboarding/tracking";
import OnboardingWorry from "../app/onboarding/worry";
import OnboardingResults from "../app/onboarding/results";
import OnboardingSymptoms from "../app/onboarding/symptoms";
import OnboardingHelp from "../app/onboarding/help";
import OnboardingFeatures from "../app/onboarding/features";
import OnboardingPlan from "../app/onboarding/plan";
import OnboardingPaywall from "../app/onboarding/paywall";
import OnboardingOffer from "../app/onboarding/offer";

/** Where the year drum opens, which is `app/onboarding/vehicle.tsx`'s own
 *  default: the average car on the road is about twelve years old. */
const DEFAULT_YEAR = new Date().getFullYear() + 1 - 12;

/**
 * Every screen below renders catalog copy and formatted distances, so the
 * English sentences and the "mi" readings asserted here are only what the
 * glass says once the language and the unit are the ones being asserted. A
 * test worker inherits neither from a phone.
 */
beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

const mounted: TestRenderer.ReactTestRenderer[] = [];

function render(Component: () => ReactElement): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Component));
  });
  mounted.push(tree);
  return tree;
}

/** Every string a subtree actually puts on the glass. */
function stringsIn(node: TestRenderer.ReactTestInstance): string[] {
  return node
    .findAll((n) => typeof n.type === "string")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"));
}

/** Every string the screen actually puts on the glass. */
function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return stringsIn(tree.root);
}

/** Every `value` prop, which is how the fields report their state. */
function values(tree: TestRenderer.ReactTestRenderer): unknown[] {
  return tree.root.findAll((n) => n.props.value !== undefined).map((n) => n.props.value);
}

/** Every selected set on the screen, which is how the chip rows report theirs. */
function selections(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => Array.isArray(n.props.selected))
    .flatMap((n) => n.props.selected as string[]);
}

/** Taps the chip or the button carrying this label. */
function press(tree: TestRenderer.ReactTestRenderer, label: string): void {
  const target = tree.root.findAll((n) => n.props.label === label && !n.props.disabled);
  if (target.length === 0) throw new Error(`nothing live is labelled "${label}"`);
  act(() => target[0].props.onPress());
}

/** Types into the field carrying this label. */
function type(tree: TestRenderer.ReactTestRenderer, label: string, text: string): void {
  const target = tree.root.findAll((n) => n.props.label === label && n.props.onChangeText);
  if (target.length === 0) throw new Error(`no field is labelled "${label}"`);
  act(() => target[0].props.onChangeText(text));
}

/**
 * Turns the year drum `detents` rows down from where it opened.
 *
 * The drum is a snapping ScrollView, so the only thing a test can do to it is
 * what a finger does: land it on an offset and let it commit. 40 is the row
 * height the wheel is laid out on.
 */
function spin(tree: TestRenderer.ReactTestRenderer, detents: number): void {
  const drum = tree.root.findAll((n) => n.props.snapToInterval === 40)[0];
  const from = drum.props.contentOffset.y as number;
  act(() =>
    drum.props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { y: from + detents * 40 } },
    })
  );
}

afterEach(() => {
  // Unmounted rather than left running: the odometer drums are a native-driver
  // animation, and one still ticking when the environment is torn down takes
  // the worker down with it.
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  // Emptied per test, so that "this screen did not navigate" means this screen
  // rather than "no screen in this file ever navigated there".
  navigated.length = 0;
});

// Every test in this file shares one in-memory database, and the flags this
// clears are the ones the screens read at mount: the car this run owns and the
// answers given so far. Without it a screen rendered here opens on the previous
// test's car, which is how "the model was left blank" came to assert against a
// Civic typed three tests earlier.
beforeEach(() => {
  resetOnboarding();
});

test("nothing in the flow sells the free tier", () => {
  const car = createVehicle({ name: "2014 Ford F-150", year: 2014, odometer: 96500 });
  setOnboardingVehicleId(car.id);

  // The paywall used to carry a "Start with the free app" link under its
  // button, and the flow used to end on a whole screen of what costs nothing.
  // Both handed a free start to a user who was one tap from a trial.
  const paywall = texts(render(OnboardingPaywall)).join(" ");
  expect(paywall).not.toMatch(/free app/i);
  expect(paywall).not.toMatch(/free forever/i);
  // The trial's decline still names the free app, because that is where it
  // sends the user: the garage, with no screen in between selling free mode.
  expect(texts(render(OnboardingOffer)).join(" ")).not.toMatch(/free mode|free forever/i);
  // The button names an outcome. "See Wrenchy Pro" described navigation, which
  // is the one thing a paywall CTA must never spend itself on.
  expect(texts(render(OnboardingPaywall))).toContain("Keep my car on record");
});

test("no screen in the flow prints an em or en dash", () => {
  const car = createVehicle({
    name: "2014 Ford F-150",
    year: 2014,
    make: "Ford",
    model: "F-150",
    odometer: 96500,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({ drive: "average", tracking: "dealer", worries: ["records", "upsell"] });

  const screens = [
    OnboardingVehicle,
    OnboardingOdometer,
    OnboardingDrive,
    OnboardingService,
    OnboardingTracking,
    OnboardingWorry,
    OnboardingResults,
    OnboardingSymptoms,
    OnboardingHelp,
    OnboardingReviews,
    OnboardingFeatures,
    OnboardingPlan,
    OnboardingPaywall,
    OnboardingOffer,
  ];

  for (const Screen of screens) {
    const printed = texts(render(Screen)).join(" ");
    expect(printed).not.toMatch(/[\u2013\u2014]/);
  }
});

test("a question stepped back into comes back filled in", () => {
  const car = createVehicle({
    name: "2019 Honda Civic",
    year: 2019,
    make: "Honda",
    model: "Civic",
    odometer: 84210,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({ drive: "high" });

  // The year is a drum and the two words are fields, so the round trip is read
  // off the caption the screen prints from all three.
  const vehicle = render(OnboardingVehicle);
  expect(values(vehicle)).toEqual(expect.arrayContaining(["Honda", "Civic"]));
  expect(texts(vehicle).join(" ")).toContain('Saved as "2019 Honda Civic"');

  expect(values(render(OnboardingOdometer))).toContain("84210");
  expect(selections(render(OnboardingDrive))).toContain("high");
});

test("the car is one typed word away from answered", () => {
  // The year is already on the drum, the model is optional, so a make is the
  // whole remaining cost of this screen.
  const tree = render(OnboardingVehicle);
  type(tree, "Make", "Toyota");
  press(tree, "Continue");

  expect(navigated).toContain("/onboarding/odometer");
  const saved = getVehicle(getOnboardingVehicleId()!)!;
  expect(saved.year).toBe(DEFAULT_YEAR);
  expect(saved.name).toBe(`${DEFAULT_YEAR} Toyota`);
  expect(saved.model).toBeUndefined();
});

test("the make is the one answer the car cannot go without", () => {
  const tree = render(OnboardingVehicle);
  press(tree, "Continue");
  // Continue is always pressable and answers with the reason, rather than
  // sitting there dead the way the three required fields used to make it.
  expect(texts(tree)).toContain("Required.");
  expect(navigated).not.toContain("/onboarding/odometer");

  type(tree, "Make", "Honda");
  press(tree, "Continue");
  expect(navigated).toContain("/onboarding/odometer");
});

test("the year comes off a drum, and never off a keyboard", () => {
  const tree = render(OnboardingVehicle);
  // The chip row of twenty-six years, and before it the numeric field with
  // four error messages behind it, are both gone.
  expect(tree.root.findAll((n) => n.props.keyboardType === "numeric")).toHaveLength(0);

  // Three detents down the drum is three model years older than the default.
  spin(tree, 3);
  type(tree, "Make", "Toyota");
  press(tree, "Continue");
  expect(getVehicle(getOnboardingVehicleId()!)!.year).toBe(DEFAULT_YEAR - 3);
});

test("a replay re-describes the car in the garage instead of adding one", () => {
  // Walking onboarding again was the way past the one-car limit: the garage's
  // Add button gated on Pro, and this screen wrote a row without asking.
  const before = listVehicles().length;
  const car = createVehicle({ name: "2014 Ford", year: 2014, make: "Ford" });

  const tree = render(OnboardingVehicle);
  type(tree, "Make", "Honda");
  press(tree, "Continue");

  expect(listVehicles()).toHaveLength(before + 1);
  expect(getVehicle(car.id)!.make).toBe("Honda");
  expect(getOnboardingVehicleId()).toBe(car.id);
});

test("the odometer question starts empty on a car that has no reading yet", () => {
  // The column is NULL for a vehicle created by the question before this one,
  // and the field used to open with the literal text "null" in it.
  const car = createVehicle({ name: "2019 Honda Civic", year: 2019 });
  setOnboardingVehicleId(car.id);
  expect(values(render(OnboardingOdometer))).toContain("");
  expect(values(render(OnboardingOdometer))).not.toContain("null");
});

test("the odometer cannot be deferred, and takes a real reading", () => {
  const car = createVehicle({ name: "2019 Toyota", year: 2019, make: "Toyota" });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // The deferral stored the model year times the national average and flagged
  // it as a guess, which is the number the whole schedule is built on.
  expect(texts(tree).join(" ")).not.toMatch(/add it later/i);
  const cont = () => tree.root.findAll((n) => n.props.label === "Continue")[0];
  expect(cont().props.disabled).toBe(true);

  type(tree, "Odometer (mi)", "84210");
  expect(cont().props.disabled).toBe(false);
  press(tree, "Continue");

  expect(navigated).toContain("/onboarding/drive");
  const saved = getVehicle(car.id)!;
  expect(saved.odometer).toBe(84210);
  expect(saved.odometer_estimated).toBeUndefined();
});

test("the evidence screen will not let you continue until you have scrolled it", () => {
  const tree = render(OnboardingReviews);
  const scroll = tree.root.findAll((n) => n.props.onScroll !== undefined)[0];

  // Laid out: taller than the viewport, so there is something to read.
  act(() => {
    scroll.props.onLayout({ nativeEvent: { layout: { height: 500 } } });
    scroll.props.onContentSizeChange(390, 1400);
  });
  expect(texts(tree)).toContain("Scroll to read all four");
  expect(texts(tree)).not.toContain("Continue");

  act(() => {
    scroll.props.onScroll({
      nativeEvent: {
        contentOffset: { y: 900 },
        contentSize: { height: 1400 },
        layoutMeasurement: { height: 500 },
      },
    });
  });
  expect(texts(tree)).toContain("Continue");
});

test("a screen with nothing to scroll is not gated by the scroll it cannot do", () => {
  const tree = render(OnboardingReviews);
  const scroll = tree.root.findAll((n) => n.props.onScroll !== undefined)[0];
  act(() => {
    scroll.props.onLayout({ nativeEvent: { layout: { height: 1400 } } });
    scroll.props.onContentSizeChange(390, 1200);
  });
  expect(texts(tree)).toContain("Continue");
});

test("the evidence gate nudges rather than blocks", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingReviews);
  const scroll = tree.root.findAll((n) => n.props.onScroll !== undefined)[0];
  act(() => {
    scroll.props.onLayout({ nativeEvent: { layout: { height: 500 } } });
    scroll.props.onContentSizeChange(390, 1400);
  });

  const button = () => tree.root.findAll((n) => n.props.label !== undefined)[0];
  expect(button().props.disabled).toBe(true);

  act(() => {
    jest.advanceTimersByTime(2000);
  });
  // Live, and still asking for the scroll: the affordance survives, the
  // refusal does not.
  expect(button().props.disabled).toBe(false);
  expect(texts(tree)).toContain("Scroll to read all four");
  jest.useRealTimers();
});

test("the loader draws a bar and holds the screen for the whole readout", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);
  expect(
    tree.root.findAll((n) => n.props.accessibilityRole === "progressbar").length
  ).toBeGreaterThan(0);

  // One `act` flushes one timer, because the next one is only scheduled by the
  // re-render this one causes. Four readings at 650ms, then a 700ms handoff:
  // about 3.3 seconds in total, down from the 5.2 this used to cost.
  const step = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  step(650);
  step(650);
  step(650);
  step(650);
  expect(navigated).not.toContain("replace:/onboarding/results");

  step(700);
  expect(navigated).toContain("replace:/onboarding/results");
  jest.useRealTimers();
});

test("the loader cannot be skipped", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);

  // It used to invite a tap past itself, which told the user the four readings
  // the next six screens argue from were not worth reading.
  expect(texts(tree).join(" ")).not.toMatch(/skip/i);
  expect(
    tree.root
      .findAll((n) => typeof n.props.onPress === "function")
      .filter((n) => stringsIn(n).includes("Working out the schedule."))
  ).toHaveLength(0);
  expect(navigated).not.toContain("replace:/onboarding/results");
  jest.useRealTimers();
});

test("the last question takes no answer at all", () => {
  const car = createVehicle({ name: "2019 Toyota", year: 2019, odometer: 84210 });
  setOnboardingVehicleId(car.id);
  setAnswers({ tracking: "memory" });

  const tree = render(OnboardingWorry);
  // It used to open on a dead Continue, which is the worst possible last
  // impression of the quiz.
  expect(texts(tree)).toContain("All optional. Skip it and the next screen is built from your car alone.");
  press(tree, "Continue");
  expect(navigated).toContain("/onboarding/analyzing");

  // And the screens that read the answer still have three true cards to draw.
  const symptoms = texts(render(OnboardingSymptoms)).join(" ");
  expect(symptoms.length).toBeGreaterThan(0);
  expect(texts(render(OnboardingHelp)).join(" ").length).toBeGreaterThan(0);
});
