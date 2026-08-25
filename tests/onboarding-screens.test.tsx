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

import { createVehicle, getVehicle } from "../src/db/vehicles";
import {
  getOnboardingVehicleId,
  resetOnboarding,
  setAnswers,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { AVERAGE_DISTANCE_PER_YEAR, estimateOdometer } from "../src/onboarding/estimate";
import { setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";
import OnboardingFree from "../app/onboarding/free";
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

/**
 * Taps the innermost pressable whose own text is `label`.
 *
 * The flow's secondary actions ("I'll add it later", "Not now") are text in a
 * Pressable rather than a Button, so they carry no label prop to find them by.
 * Innermost, because an enclosing pressable contains the same string.
 */
function pressText(tree: TestRenderer.ReactTestRenderer, label: string): void {
  const matches = tree.root
    .findAll((n) => typeof n.props.onPress === "function")
    .filter((n) => stringsIn(n).includes(label));
  if (matches.length === 0) throw new Error(`nothing pressable says "${label}"`);
  act(() => matches[matches.length - 1].props.onPress());
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

test("the last screen offers the free start, and nothing before it does", () => {
  const car = createVehicle({ name: "2014 Ford F-150", year: 2014, odometer: 96500 });
  setOnboardingVehicleId(car.id);

  const free = texts(render(OnboardingFree));
  expect(free).toContain("Start with the free app");

  // The paywall used to carry the same link under its button, which handed a
  // free start to every user who had not yet seen a price.
  const paywall = texts(render(OnboardingPaywall)).join(" ");
  expect(paywall).not.toMatch(/free app/i);
  expect(texts(render(OnboardingPaywall))).toContain("See Wrenchy Pro");
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
    OnboardingFree,
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

  // Year and make are chips now, so they come back as selections rather than
  // as field values. The model is the one part still typed.
  const vehicle = render(OnboardingVehicle);
  expect(selections(vehicle)).toEqual(expect.arrayContaining(["2019", "Honda"]));
  expect(values(vehicle)).toContain("Civic");

  expect(values(render(OnboardingOdometer))).toContain("84210");
  expect(selections(render(OnboardingDrive))).toContain("high");
});

test("the car can be answered without touching the keyboard", () => {
  // The whole point of the rewrite: a year off the chip row, a make off the
  // chip row, no model, and the screen moves on.
  const tree = render(OnboardingVehicle);
  press(tree, "2019");
  press(tree, "Toyota");
  press(tree, "Continue");

  expect(navigated).toContain("/onboarding/odometer");
  const saved = getVehicle(getOnboardingVehicleId()!)!;
  expect(saved.name).toBe("2019 Toyota");
  expect(saved.model).toBeUndefined();
});

test("an unnamed model does not block the car, but an unnamed make does", () => {
  const tree = render(OnboardingVehicle);
  press(tree, "Continue");
  // Continue is always pressable and answers with the reason, rather than
  // sitting there dead the way the make and model fields used to make it.
  expect(texts(tree)).toContain("Enter the model year.");
  expect(navigated).not.toContain("/onboarding/odometer");

  press(tree, "2019");
  press(tree, "Continue");
  expect(texts(tree)).toContain("Required.");
  expect(navigated).not.toContain("/onboarding/odometer");
});

test("the make list can be filtered, and has a door out of itself", () => {
  const tree = render(OnboardingVehicle);
  const filter = tree.root.findAll((n) => n.props.label === "Search makes")[0];

  // Substring, not prefix: somebody typing "benz" means Mercedes-Benz.
  act(() => filter.props.onChangeText("benz"));
  expect(texts(tree)).toContain("Mercedes-Benz");
  expect(texts(tree)).not.toContain("Toyota");

  act(() => filter.props.onChangeText("Rolls"));
  expect(texts(tree)).toContain("No match. Tap Other to type it in.");
  press(tree, "Other");
  // "Other" reveals the free-text field the chips replaced.
  expect(tree.root.findAll((n) => n.props.label === "Make").length).toBe(1);
});

test("the odometer question starts empty on a car that has no reading yet", () => {
  // The column is NULL for a vehicle created by the question before this one,
  // and the field used to open with the literal text "null" in it.
  const car = createVehicle({ name: "2019 Honda Civic", year: 2019 });
  setOnboardingVehicleId(car.id);
  expect(values(render(OnboardingOdometer))).toContain("");
  expect(values(render(OnboardingOdometer))).not.toContain("null");
});

test("the odometer can be deferred, and what it stores is marked as a guess", () => {
  const car = createVehicle({ name: "2019 Toyota", year: 2019, make: "Toyota" });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // The estimate is offered before it is accepted.
  expect(texts(tree).join(" ")).toMatch(/marked as an estimate/);
  pressText(tree, "I'll add it later");

  expect(navigated).toContain("/onboarding/drive");
  const saved = getVehicle(car.id)!;
  const expected = estimateOdometer(2019, AVERAGE_DISTANCE_PER_YEAR.mi)!;
  expect(saved.odometer).toBe(expected);
  expect(saved.odometer_estimated).toBe(1);
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

test("a tap anywhere on the loader goes straight to the findings", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);
  expect(texts(tree)).toContain("Tap anywhere to skip.");

  // The body pressable is the one carrying the readout; the header's is Back.
  pressText(tree, "Working out the schedule.");
  expect(navigated).toContain("replace:/onboarding/results");

  // And the timer that was already running must not replace the route twice.
  const replacements = navigated.filter((n) => n === "replace:/onboarding/results").length;
  act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(navigated.filter((n) => n === "replace:/onboarding/results")).toHaveLength(replacements);
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
