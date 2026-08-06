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

import { createVehicle } from "../src/db/vehicles";
import { setAnswers, setOnboardingVehicleId } from "../src/onboarding";
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

/** Every string the screen actually puts on the glass. */
function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.type === "string")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"));
}

/** Every `value` prop, which is how the fields and chips report their state. */
function values(tree: TestRenderer.ReactTestRenderer): unknown[] {
  return tree.root.findAll((n) => n.props.value !== undefined).map((n) => n.props.value);
}

afterEach(() => {
  // Unmounted rather than left running: the odometer drums are a native-driver
  // animation, and one still ticking when the environment is torn down takes
  // the worker down with it.
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
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
  expect(texts(render(OnboardingPaywall))).toContain("See Glovebox Pro");
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

  expect(values(render(OnboardingVehicle))).toEqual(
    expect.arrayContaining(["2019", "Honda", "Civic"])
  );
  expect(values(render(OnboardingOdometer))).toContain("84210");

  const drive = render(OnboardingDrive);
  const selected = drive.root
    .findAll((n) => Array.isArray(n.props.selected))
    .map((n) => n.props.selected as string[]);
  expect(selected.some((s) => s.includes("high"))).toBe(true);
});

test("the odometer question starts empty on a car that has no reading yet", () => {
  // The column is NULL for a vehicle created by the question before this one,
  // and the field used to open with the literal text "null" in it.
  const car = createVehicle({ name: "2019 Honda Civic", year: 2019 });
  setOnboardingVehicleId(car.id);
  expect(values(render(OnboardingOdometer))).toContain("");
  expect(values(render(OnboardingOdometer))).not.toContain("null");
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

test("the loader draws a bar and holds the screen for the whole readout", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);
  expect(
    tree.root.findAll((n) => n.props.accessibilityRole === "progressbar").length
  ).toBeGreaterThan(0);

  // One `act` flushes one timer, because the next one is only scheduled by the
  // re-render this one causes. A second of the wait per step, then.
  const second = () =>
    act(() => {
      jest.advanceTimersByTime(1000);
    });

  // Four readings at 950ms plus a 1400ms handoff, so a little over five
  // seconds. Three seconds in the flow has not moved on; the screen this
  // replaced was gone inside two.
  second();
  second();
  second();
  expect(navigated).not.toContain("replace:/onboarding/results");

  second();
  second();
  second();
  expect(navigated).toContain("replace:/onboarding/results");
  jest.useRealTimers();
});
