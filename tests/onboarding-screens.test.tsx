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
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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
      runSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).all(...params),
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
import { addRecord } from "../src/db/records";
import {
  getOnboardingVehicleId,
  resetOnboarding,
  setAnswers,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { formatDate, formatDueIn, setLanguage } from "../src/i18n";
import { nextReminder, nextReminders } from "../src/notify";
import { serviceName } from "../src/schedule/names";
import { setDistanceUnit } from "../src/units";
import {
  AVERAGE_DISTANCE_PER_YEAR,
  estimateOdometer,
} from "../src/onboarding/estimate";
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
    .flatMap((n) =>
      n.children.filter((c): c is string => typeof c === "string"),
    );
}

/** Every string the screen actually puts on the glass. */
function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return stringsIn(tree.root);
}

/** Every `value` prop, which is how the fields report their state. */
function values(tree: TestRenderer.ReactTestRenderer): unknown[] {
  return tree.root
    .findAll((n) => n.props.value !== undefined)
    .map((n) => n.props.value);
}

/** Every selected set on the screen, which is how the chip rows report theirs. */
function selections(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => Array.isArray(n.props.selected))
    .flatMap((n) => n.props.selected as string[]);
}

/** Taps the chip or the button carrying this label. */
function press(tree: TestRenderer.ReactTestRenderer, label: string): void {
  const target = tree.root.findAll(
    (n) => n.props.label === label && !n.props.disabled,
  );
  if (target.length === 0)
    throw new Error(`nothing live is labelled "${label}"`);
  act(() => target[0].props.onPress());
}

/** Types into the field carrying this label. */
function type(
  tree: TestRenderer.ReactTestRenderer,
  label: string,
  text: string,
): void {
  const target = tree.root.findAll(
    (n) => n.props.label === label && n.props.onChangeText,
  );
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
    }),
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
  const car = createVehicle({
    name: "2014 Ford F-150",
    year: 2014,
    odometer: 96500,
  });
  setOnboardingVehicleId(car.id);

  // The paywall used to carry a "Start with the free app" link under its
  // button, and the flow used to end on a whole screen of what costs nothing.
  // Both handed a free start to a user who was one tap from a trial.
  const paywall = texts(render(OnboardingPaywall)).join(" ");
  expect(paywall).not.toMatch(/free app/i);
  expect(paywall).not.toMatch(/free forever/i);
  // The trial's decline still names the free app, because that is where it
  // sends the user: the garage, with no screen in between selling free mode.
  expect(texts(render(OnboardingOffer)).join(" ")).not.toMatch(
    /free mode|free forever/i,
  );
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
  setAnswers({
    drive: "average",
    tracking: "dealer",
    worries: ["records", "upsell"],
  });

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
  type(tree, "Make (optional)", "Toyota");
  press(tree, "Continue");

  expect(navigated).toContain("/onboarding/odometer");
  const saved = getVehicle(getOnboardingVehicleId()!)!;
  expect(saved.year).toBe(DEFAULT_YEAR);
  expect(saved.name).toBe(`${DEFAULT_YEAR} Toyota`);
  expect(saved.model).toBeUndefined();
});

test("the car screen refuses nothing, because it was refusing installs", () => {
  // Three of the first eight installs died on this screen, every one of them
  // having tapped a Continue that answered "Required." and stayed put. The
  // year drum always has an answer, so the screen always has enough to build a
  // schedule from and never has grounds to refuse.
  const tree = render(OnboardingVehicle);
  press(tree, "Continue");

  expect(navigated).toContain("/onboarding/odometer");
  expect(texts(tree)).not.toContain("Required.");

  // Named, not blank, and not the bare model year: "2019" is a number standing
  // where a car should be in a garage list.
  const saved = getVehicle(getOnboardingVehicleId()!)!;
  expect(saved.name).toBe("My car");
  expect(saved.year).toBe(DEFAULT_YEAR);
  expect(saved.make).toBeUndefined();
});

test("the whole quiz is answerable without a keystroke, and still yields a plan", () => {
  // The spec this flow was built to claims "0 mandatory text fields, 0
  // keystrokes". Two required text fields had crept back in — the make and the
  // odometer — and between them they took half the install base before anyone
  // saw what the app does. This walks the flow the way a thumb does.
  press(render(OnboardingVehicle), "Continue");
  press(render(OnboardingOdometer), "I'll add it later");
  // The chip selects; Continue is what commits the band and refines the
  // estimate, which is exactly the two-tap shape the other quiz screens have.
  const drive = render(OnboardingDrive);
  press(drive, "Under 5,000");
  press(drive, "Continue");

  const car = getVehicle(getOnboardingVehicleId()!)!;
  // Still an estimate, and now the low band's estimate rather than the
  // national average: `drive` refined the guess on the way past.
  expect(car.odometer_estimated).toBe(1);
  expect(car.odometer).toBeLessThan(
    estimateOdometer(car.year, AVERAGE_DISTANCE_PER_YEAR.mi)!,
  );

  // The payoff screen is the whole argument for the paywall, so a keyboardless
  // walk has to arrive at a populated one rather than an empty state.
  const printed = texts(render(OnboardingResults)).join(" ");
  expect(printed).toMatch(/My car/);
  expect(printed.length).toBeGreaterThan(80);
});

test("the year comes off a drum, and never off a keyboard", () => {
  const tree = render(OnboardingVehicle);
  // The chip row of twenty-six years, and before it the numeric field with
  // four error messages behind it, are both gone.
  expect(
    tree.root.findAll((n) => n.props.keyboardType === "numeric"),
  ).toHaveLength(0);

  // Three detents down the drum is three model years older than the default.
  spin(tree, 3);
  type(tree, "Make (optional)", "Toyota");
  press(tree, "Continue");
  expect(getVehicle(getOnboardingVehicleId()!)!.year).toBe(DEFAULT_YEAR - 3);
});

test("a replay re-describes the car in the garage instead of adding one", () => {
  // Walking onboarding again was the way past the one-car limit: the garage's
  // Add button gated on Pro, and this screen wrote a row without asking.
  const before = listVehicles().length;
  const car = createVehicle({ name: "2014 Ford", year: 2014, make: "Ford" });

  const tree = render(OnboardingVehicle);
  type(tree, "Make (optional)", "Honda");
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

test("the odometer can be deferred again, and says so on the screen", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    make: "Toyota",
  });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // Four of the five people who ever reached this screen while the hatch
  // existed took it. Removing it turned the fifth question of the flow into a
  // numeric keyboard with a dead button under it.
  press(tree, "I'll add it later");

  expect(navigated).toContain("/onboarding/drive");
  const saved = getVehicle(car.id)!;
  // Arithmetic, stored as arithmetic: the flag is what every gauge in the app
  // reads to label the number "(est.)", and what `drive` reads to refine it.
  expect(saved.odometer).toBe(
    estimateOdometer(2019, AVERAGE_DISTANCE_PER_YEAR.mi),
  );
  expect(saved.odometer_estimated).toBe(1);
});

test("a typed reading is still the answer the screen wants", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    make: "Toyota",
  });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // Continue stays gated on a real number. The hatch is the way past an empty
  // field, so a disabled Continue is no longer a dead end. Re-queried after
  // the keystroke rather than held in a variable: the press re-renders, and
  // the node captured before it is not the node carrying the new prop.
  const disabled = () =>
    tree.root.findAll((n) => n.props.label === "Continue")[0].props.disabled;
  expect(disabled()).toBe(true);

  type(tree, "Odometer (mi)", "84210");
  expect(disabled()).toBe(false);
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

test("each symptoms card holds Continue briefly, and holds it again on the next card", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingSymptoms);
  const button = () => tree.root.findAll((n) => n.props.label !== undefined)[0];
  const headline = () => texts(tree).join(" ");

  // The whole point: three fast taps used to skip two of the three findings,
  // because all three share one route and one button position. `disabled` is
  // asserted rather than a bypassed `onPress`, which Pressable would refuse to
  // deliver but a direct props call happily fires.
  expect(button().props.disabled).toBe(true);
  const first = headline();

  act(() => {
    jest.advanceTimersByTime(1200);
  });
  expect(button().props.disabled).toBe(false);

  act(() => {
    button().props.onPress();
  });
  expect(headline()).not.toBe(first);
  // The dwell restarts per card rather than per mount.
  expect(button().props.disabled).toBe(true);
  jest.useRealTimers();
});

test("the loader draws a bar and holds the screen for the whole readout", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);
  expect(
    tree.root.findAll((n) => n.props.accessibilityRole === "progressbar")
      .length,
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
      .filter((n) => stringsIn(n).includes("Working out the schedule.")),
  ).toHaveLength(0);
  expect(navigated).not.toContain("replace:/onboarding/results");
  jest.useRealTimers();
});

test("the last question takes no answer at all", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    odometer: 84210,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({ tracking: "memory" });

  const tree = render(OnboardingWorry);
  // It used to open on a dead Continue, which is the worst possible last
  // impression of the quiz.
  expect(texts(tree)).toContain(
    "All optional. Skip it and the next screen is built from your car alone.",
  );
  press(tree, "Continue");
  expect(navigated).toContain("/onboarding/analyzing");

  // And the screens that read the answer still have three true cards to draw.
  const symptoms = texts(render(OnboardingSymptoms)).join(" ");
  expect(symptoms.length).toBeGreaterThan(0);
  expect(texts(render(OnboardingHelp)).join(" ").length).toBeGreaterThan(0);
});

test("the free and paid halves are named on the same screen as the answer", () => {
  const car = createVehicle({
    name: "2014 Ford F-150",
    year: 2014,
    odometer: 96500,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({
    drive: "average",
    tracking: "dealer",
    worries: ["records", "upsell"],
  });

  // The boundary was its own screen between the evidence and the plan. Folding
  // it here is only safe if every row it carried still prints, badge included:
  // a user who reaches the paywall having never seen "Pro" against a row is
  // the review this screen exists to prevent.
  const printed = texts(render(OnboardingHelp));
  expect(printed).toContain("What you are getting.");
  expect(printed.filter((s) => s === "Free")).toHaveLength(4);
  expect(printed.filter((s) => s === "Pro")).toHaveLength(2);
});

test("the plan screen animates the notification it is asking permission to send", () => {
  const car = createVehicle({
    name: "2016 Subaru Outback",
    make: "Subaru",
    model: "Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);

  // A car the flow is not about, with a reminder that comes first. Onboarding
  // is replayable from Settings, so the garage around it is rarely empty, and
  // the soonest reminder in the whole garage is not this screen's argument.
  const other = createVehicle({
    name: "2009 Volvo V70",
    year: 2009,
    odometer: 210000,
  });
  addRecord({
    vehicle_id: other.id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
  });

  // Nothing logged against this car, so nothing would ever be scheduled for
  // it. The preview is absent rather than invented: a specimen notification on
  // a car the app has no reminder for is a promise of a message it has no
  // intention of sending, and the Volvo's is not this car's.
  expect(texts(render(OnboardingPlan)).join(" ")).not.toMatch(
    /Outback: |Volvo/,
  );

  const performedAt = new Date(
    Date.now() - 30 * 24 * 3600 * 1000,
  ).toISOString();
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: performedAt,
  });

  const printed = texts(render(OnboardingPlan));
  // The same strings the scheduler passes to iOS, against this user's own car
  // by year, make and model: the ask is "may we send you this", and "this" has
  // to be the message.
  expect(printed).toContain("2016 Subaru Outback: Oil Change due");
  expect(printed).toContain(`Last done ${formatDate(performedAt)}.`);
  // Labelled with when it will actually arrive, in the words a person uses,
  // and never with a bare "now": the whole claim of the screen is that the
  // message comes on a day the user is not thinking about their car.
  const due = nextReminder(car.id);
  expect(printed).toContain(formatDueIn(due!.dueAt));
  expect(printed).not.toContain(formatDate(due!.dueAt));
});

test("the banner cycles through several of the car's own reminders", () => {
  const car = createVehicle({
    name: "2016 Subaru Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);

  // Recent enough that all three are still ahead: a service already overdue
  // has no notification to schedule and is dropped before the banner sees it.
  const recent = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const older = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: older,
  });
  addRecord({
    vehicle_id: car.id,
    service_type: "Tire Rotation",
    performed_at: recent,
  });
  addRecord({
    vehicle_id: car.id,
    service_type: "Air Filter",
    performed_at: recent,
  });
  // Only one message is on the glass at a time — the point of the animation is
  // that a notification is an event, not a stack — so the screen is asked for
  // what it would cycle instead of what a single frame prints.
  const messages = nextReminders(car.id, 3);
  expect(messages).toHaveLength(3);

  const printed = texts(render(OnboardingPlan));
  const first = messages[0];
  expect(printed).toContain(
    `2016 Subaru Outback: ${serviceName(first.serviceType)} due`,
  );
  // Soonest first. A demo that opened on the furthest reminder would argue the
  // opposite of the screen it is on.
  for (const later of messages.slice(1)) {
    expect(new Date(later.dueAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.dueAt).getTime(),
    );
  }
});

/** The mocked native notification module, as this file installed it. */
function notifications(): {
  requestPermissionsAsync: jest.Mock;
  getPermissionsAsync: jest.Mock;
} {
  const mocked = jest.requireMock("expo-notifications");
  const { requestPermissionsAsync, getPermissionsAsync } = mocked as {
    requestPermissionsAsync: jest.Mock;
    getPermissionsAsync: jest.Mock;
  };
  return { requestPermissionsAsync, getPermissionsAsync };
}

/**
 * Taps a button whose handler is asynchronous and waits for all of it.
 *
 * `press` commits the tap and returns; a handler that asks iOS for permission
 * before it navigates is still mid-flight at that point, and asserting on the
 * navigation would be asserting on a race.
 */
async function pressAndSettle(
  tree: TestRenderer.ReactTestRenderer,
  label: string,
): Promise<void> {
  const target = tree.root.findAll(
    (n) => n.props.label === label && !n.props.disabled,
  );
  if (target.length === 0)
    throw new Error(`nothing live is labelled "${label}"`);
  await act(async () => {
    await target[0].props.onPress();
  });
}

test("the reminders button raises the iOS prompt on the tap that promises it", async () => {
  const { requestPermissionsAsync, getPermissionsAsync } = notifications();
  const car = createVehicle({
    name: "2016 Subaru Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);

  // What iOS says about an install it has never asked. The app used to consult
  // a flag of its own here, and a flag stamped by an earlier build that only
  // recorded the intention left this button doing nothing visible at all.
  getPermissionsAsync.mockResolvedValue({
    status: "undetermined",
    canAskAgain: true,
  });
  requestPermissionsAsync.mockClear();

  await pressAndSettle(render(OnboardingPlan), "Turn on reminders");

  expect(requestPermissionsAsync).toHaveBeenCalled();
  expect(navigated).toContain("/onboarding/paywall");
});

test("a permission iOS will not re-ask is not asked for, and does not block the flow", async () => {
  const { requestPermissionsAsync, getPermissionsAsync } = notifications();
  const car = createVehicle({
    name: "2016 Subaru Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);

  getPermissionsAsync.mockResolvedValue({
    status: "denied",
    canAskAgain: false,
  });
  requestPermissionsAsync.mockClear();

  await pressAndSettle(render(OnboardingPlan), "Turn on reminders");

  expect(requestPermissionsAsync).not.toHaveBeenCalled();
  expect(navigated).toContain("/onboarding/paywall");

  getPermissionsAsync.mockResolvedValue({
    status: "granted",
    canAskAgain: false,
  });
});
