import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

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
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: (to: string) => navigated.push(to),
    replace: (to: string) => navigated.push(`replace:${to}`),
    back: () => navigated.push("back"),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockParams,
  // Under the test renderer a screen is focused for as long as it is mounted.
  useFocusEffect: (effect: () => void | (() => void)) => {
    require("react").useEffect(effect, [effect]);
  },
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
}));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
// The money screens read the price list through this hook. Fixture plans
// keep the test off the store and make the printed prices assertable.
const mockPlans: Record<string, unknown[] | null> = {
  default: [
    { id: "$rc_annual", period: "year", package: {}, priceString: "$79.99", price: 79.99, currency: "USD", intro: null, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 },
    { id: "$rc_monthly", period: "month", package: {}, priceString: "$9.99", price: 9.99, currency: "USD", intro: null, perWeek: "$2.31", perMonth: "$9.99", savePct: 23 },
    { id: "$rc_weekly", period: "week", package: {}, priceString: "$2.99", price: 2.99, currency: "USD", intro: null, perWeek: "$2.99", perMonth: "$12.96" },
  ],
  // The exit offer: the yearly at a lower price, stamped with the standard
  // yearly it undercuts (see `markCompareAt`).
  discount: [
    { id: "$rc_annual", period: "year", package: {}, priceString: "$29.99", price: 29.99, currency: "USD", intro: null, perWeek: "$0.58", perMonth: "$2.50", compareAt: { priceString: "$79.99", price: 79.99, pct: 63 } },
  ],
};
const mockBuy = jest.fn(async (_plan: unknown, _offering: string) => "dismissed" as "dismissed" | "purchased" | "unavailable");
jest.mock("../src/purchases/plans", () => ({
  usePlans: (offering: string) => ({ plans: mockPlans[offering] ?? null, loading: false, retry: () => {} }),
  buy: (plan: unknown, offering: string) => mockBuy(plan, offering),
  prefetchPlans: () => {},
}));
jest.mock("expo-linking", () => ({ openURL: async () => {} }));
// The notify screen fires the iOS permission prompt on its own button now, and
// the year drum clicks. Neither native module exists under the test renderer.
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

import { createVehicle, getVehicle, listVehicles } from "../src/db/vehicles";
import { addRecord, listRecords } from "../src/db/records";
import {
  getOnboardingName,
  getOnboardingVehicleId,
  resetOnboarding,
  setAnswers,
  setOnboardingName,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { setLanguage, t } from "../src/i18n";
import { serviceName } from "../src/schedule/names";
import { setDistanceUnit } from "../src/units";
import { OVERDUE } from "../src/onboarding/cost";
import { getDb } from "../src/db/client";
import { setState } from "../src/db/state";
import { GRANDFATHERED_KEY } from "../src/paywall/state";
import { ONBOARDING_NAME_KEY } from "../src/onboarding/state";
import {
  AVERAGE_DISTANCE_PER_YEAR,
  estimateOdometer,
} from "../src/onboarding/estimate";
import OnboardingName from "../app/onboarding/name";
import OnboardingVehicle from "../app/onboarding/vehicle";
import OnboardingOdometer from "../app/onboarding/odometer";
import OnboardingDrive from "../app/onboarding/drive";
import OnboardingReviews from "../app/onboarding/reviews";
import OnboardingAnalyzing from "../app/onboarding/analyzing";
import OnboardingService from "../app/onboarding/service";
import OnboardingTracking from "../app/onboarding/tracking";
import OnboardingWorry from "../app/onboarding/worry";
import OnboardingSchedule from "../app/onboarding/schedule";
import OnboardingCost from "../app/onboarding/cost";
import OnboardingCompare from "../app/onboarding/compare";
import OnboardingSymptoms from "../app/onboarding/symptoms";
import OnboardingHelp from "../app/onboarding/help";
import OnboardingNotify from "../app/onboarding/notify";
import OnboardingPaywall from "../app/onboarding/paywall";
import OnboardingOffer from "../app/onboarding/offer";
import Subscribed from "../app/subscribed";

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
  expect(texts(render(OnboardingPaywall))).toContain(t("paywall.cta.year"));
});

test("the paywall names what is bought, and leaves the schedule to the ask", () => {
  const car = createVehicle({
    name: "2014 Ford F-150",
    year: 2014,
    odometer: 96500,
  });
  setOnboardingVehicleId(car.id);

  const printed = texts(render(OnboardingPaywall));
  // The headline is the promise; the three rows evidence it against this car;
  // the price list is on the same screen, not a sheet away.
  expect(printed).toContain(t("offer.paywall.title"));
  expect(printed.join(" ")).toContain("2014 Ford F-150");
  expect(printed.join(" ")).toContain(t("offer.paywall.point.reminders.title"));
  expect(printed.join(" ")).toContain("$79.99");
  expect(printed.join(" ")).toContain("$1.54");
  expect(printed).toContain(t("paywall.cta.year"));
  // A fresh install has nothing overdue, and the row says something the app
  // does rather than congratulating an empty record.
  expect(printed.join(" ")).toContain(t("offer.paywall.point.history.title"));
  expect(printed.join(" ")).not.toMatch(/nothing overdue/i);
  // No decline under the button, and no close until it has been read a while.
  expect(printed).not.toContain("Not now");
  expect(printed).not.toContain("✕");
  // The car's dated schedule still belongs to the reminder ask.
  expect(printed).not.toContain(serviceName("Air Filter"));
  expect(printed).not.toContain("Nothing on file");
});

test("the paywall's close arrives after a pause, goes to the trial, and a buy ends the flow paid", async () => {
  const car = createVehicle({ name: "2014 Ford F-150", year: 2014, odometer: 96500 });
  setOnboardingVehicleId(car.id);

  jest.useFakeTimers();
  try {
    const tree = render(OnboardingPaywall);
    const findClose = () =>
      tree.root.findAll((n) => n.props.accessibilityLabel === t("paywall.close") && typeof n.props.onPress === "function");
    expect(findClose()).toHaveLength(0);
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    const close = findClose();
    expect(close).toHaveLength(1);
    act(() => close[0].props.onPress());
    expect(navigated).toEqual(["/onboarding/offer"]);
  } finally {
    jest.useRealTimers();
  }

  navigated.length = 0;
  mockBuy.mockResolvedValueOnce("purchased");
  const again = render(OnboardingPaywall);
  const cta = again.root.findAll(
    (n) => typeof n.props.onPress === "function" && stringsIn(n).includes(t("paywall.cta.year"))
  );
  await act(async () => {
    await cta[cta.length - 1].props.onPress();
  });
  expect(mockBuy).toHaveBeenCalledWith(expect.objectContaining({ id: "$rc_annual" }), "default");
  expect(navigated.some((to) => to.includes("subscribed") || to.startsWith("replace:"))).toBe(true);
});

test("the second offer does not open with the way out", () => {
  // "Cancel in Settings before it ends and you pay nothing." was the last line
  // read before the ask, in the app's own voice. RevenueCat renders the
  // renewal terms and Apple's required disclosure on the sheet one tap away.
  const printed = texts(render(OnboardingOffer)).join(" ");
  expect(printed).not.toMatch(/cancel in settings/i);
  expect(texts(render(OnboardingOffer))).toContain("The same Pro, for less.");
});

test("the second offer promises nothing free and no free app to fall back on", () => {
  // The app has no free tier and this screen sells a paid yearly plan.
  // A screen that still says "free" is a promise the sheet behind it breaks,
  // and a decline link offering "the free app" points at a wall.
  const printed = texts(render(OnboardingOffer)).join(" ");
  expect(printed).not.toMatch(/\bfree\b/i);
  expect(texts(render(OnboardingOffer))).toContain(t("offer.trial.decline"));
});

test("declining the second offer goes back to the paywall that sells full price", () => {
  const tree = render(OnboardingOffer);
  expect(texts(tree)).toContain(t("offer.trial.decline"));
  expect(texts(tree)).toContain("‹ Back");
  const printed = texts(tree).join(" ");
  // The standard yearly struck once (the card), the offer price once (the
  // footer's renewal line), the saving beside them. Nothing about a week.
  expect(printed.split("$79.99").length - 1).toBe(1);
  expect(printed.split("$29.99").length - 1).toBe(1);
  expect(printed).toContain(t("paywall.save", { pct: 63 }));
  expect(printed).toContain(t("paywall.legal.year", { price: "$29.99" }));
  expect(printed).not.toMatch(/first (7 )?days?|first week/i);

  const link = tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && stringsIn(n).includes(t("offer.trial.decline")),
  );
  act(() => link[link.length - 1].props.onPress());

  expect(navigated).toEqual(["back"]);
});

test("with no standard price to beat, the second offer gets the plain title and no strike-through", () => {
  // The gap is the argument. A store that returned the discount offering but
  // not the standard one has no gap to show, and the screen must not claim
  // one: plain title, plain price, no saving.
  const original = mockPlans.discount;
  mockPlans.discount = [
    { id: "$rc_annual", period: "year", package: {}, priceString: "$29.99", price: 29.99, currency: "USD", intro: null, perWeek: "$0.58", perMonth: "$2.50" },
  ];
  try {
    const printed = texts(render(OnboardingOffer));
    expect(printed).toContain(t("offer.paywall.title"));
    expect(printed).not.toContain("The same Pro, for less.");
    expect(printed.join(" ")).not.toContain("$79.99");
    expect(printed.join(" ")).not.toMatch(/Save \d+%/);
  } finally {
    mockPlans.discount = original;
  }
});

test("the second offer sells the yearly alone when the store returns more than one plan", () => {
  // The old weekly stays on the offering while the yearly waits on review, so
  // the installed bundle keeps a button. This bundle shows one card.
  const original = mockPlans.discount;
  mockPlans.discount = [
    ...(original as unknown[]),
    { id: "$rc_weekly", period: "week", package: {}, priceString: "$3.99", price: 3.99, currency: "USD", intro: { priceString: "$0.99", price: 0.99, periods: 1 }, perWeek: "$3.99", perMonth: "$17.29" },
  ];
  try {
    const printed = texts(render(OnboardingOffer)).join(" ");
    expect(printed).toContain("$29.99");
    expect(printed).not.toContain("$0.99");
    expect(printed).not.toContain(t("paywall.period.week"));
  } finally {
    mockPlans.discount = original;
  }
});

test("relaunched with no entitlement, the offer is the wall: no back, restore in the link's place", () => {
  mockParams = { walled: "1" };
  try {
    const tree = render(OnboardingOffer);
    const printed = texts(tree);
    expect(printed).not.toContain(t("offer.trial.decline"));
    expect(printed).not.toContain("‹ Back");
    expect(printed).toContain(t("paywall.restore"));
    expect(printed).toContain(t("offer.trial.cta"));
    expect(printed.join(" ")).toContain("The same Pro, for less.");
  } finally {
    mockParams = {};
  }
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
    OnboardingName,
    OnboardingVehicle,
    OnboardingOdometer,
    OnboardingDrive,
    OnboardingService,
    OnboardingTracking,
    OnboardingWorry,
    OnboardingSchedule,
    OnboardingSymptoms,
    OnboardingCost,
    OnboardingCompare,
    OnboardingHelp,
    OnboardingReviews,
    OnboardingNotify,
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
  // off the fields themselves: the caption that used to print all three is
  // gone, because "What are you driving?" needs no explaining.
  const vehicle = render(OnboardingVehicle);
  expect(values(vehicle)).toEqual(expect.arrayContaining(["Honda", "Civic"]));

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

test("the quiz costs one typed number, and still yields a populated payoff", () => {
  // Every screen in the flow is mandatory now, so the odometer is the one
  // keystroke the walk cannot avoid: the make is still optional and the year
  // is still a drum. This walks it the way a thumb does, plus that one number.
  press(render(OnboardingVehicle), "Continue");
  const odometer = render(OnboardingOdometer);
  type(odometer, "Odometer (mi)", "84210");
  press(odometer, "Continue");
  // The chip selects; Continue is what commits the band, which is exactly the
  // two-tap shape the other quiz screens have.
  const drive = render(OnboardingDrive);
  press(drive, "Under 5,000");
  press(drive, "Continue");

  const car = getVehicle(getOnboardingVehicleId()!)!;
  // The reading is the user's, so nothing about it is flagged as arithmetic.
  expect(car.odometer).toBe(84210);
  expect(car.odometer_estimated).toBeUndefined();

  // The payoff screen is the whole argument for the paywall, so the walk has
  // to arrive at a populated one rather than an empty state.
  const printed = texts(render(OnboardingSchedule)).join(" ");
  // A car with no make is named "My car" on a garage row, and a sentence that
  // already says "Your" needs the common noun instead — "Your My car" was the
  // string bug this asserts against.
  expect(printed).toMatch(/Your car,/);
  expect(printed).not.toMatch(/Your My car/);
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
  type(tree, "Make", "Toyota");
  press(tree, "Continue");
  expect(getVehicle(getOnboardingVehicleId()!)!.year).toBe(DEFAULT_YEAR - 3);
});

test("the service question replaces only the record it wrote", () => {
  // It used to clear every record of the chosen type on the car. On a replay
  // over a car with a history, that was the history.
  const car = createVehicle({ name: "2014 Ford", odometer: 90_000 });
  setOnboardingVehicleId(car.id);
  const kept = addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: "2025-06-01T12:00:00.000Z",
  });

  let tree = render(OnboardingService);
  press(tree, "Oil Change");
  press(tree, "Last month");
  press(tree, "Continue");
  let records = listRecords(car.id);
  expect(records).toHaveLength(2);
  expect(records.some((r) => r.id === kept.id)).toBe(true);

  // Back, and answered again: the quiz's own row is swapped, the old one stays.
  tree = render(OnboardingService);
  press(tree, "Tire Rotation");
  press(tree, "3 months ago");
  press(tree, "Continue");
  records = listRecords(car.id);
  expect(records.map((r) => r.service_type).sort()).toEqual(["Oil Change", "Tire Rotation"]);
  expect(records.some((r) => r.id === kept.id)).toBe(true);
});

test("a replay adds a car, as the settings screen promises", () => {
  // It used to adopt the newest car in the garage and overwrite its identity
  // with a blank form — a Pro user replaying the flow lost a car's name.
  const before = listVehicles().length;
  const car = createVehicle({ name: "2014 Ford", year: 2014, make: "Ford" });

  const tree = render(OnboardingVehicle);
  type(tree, "Make", "Honda");
  press(tree, "Continue");

  expect(listVehicles()).toHaveLength(before + 2);
  expect(getVehicle(car.id)!.make).toBe("Ford");
  expect(getOnboardingVehicleId()).not.toBe(car.id);
});

test("a grandfathered free garage re-describes its one car, prefilled", () => {
  // The free garage holds one car, and walking the flow again was the way
  // past that. That user gets the car they have — with its details already
  // in the form, so a Continue that changes nothing changes nothing.
  getDb().runSync("DELETE FROM vehicles");
  setState(GRANDFATHERED_KEY, "true");
  try {
    const car = createVehicle({ name: "2014 Ford", year: 2014, make: "Ford", model: "Focus" });

    const tree = render(OnboardingVehicle);
    press(tree, "Continue");

    expect(listVehicles()).toHaveLength(1);
    expect(getVehicle(car.id)).toMatchObject({ year: 2014, make: "Ford", model: "Focus" });
    expect(getOnboardingVehicleId()).toBe(car.id);
  } finally {
    setState(GRANDFATHERED_KEY, "false");
  }
});

test("the odometer question starts empty on a car that has no reading yet", () => {
  // The column is NULL for a vehicle created by the question before this one,
  // and the field used to open with the literal text "null" in it.
  const car = createVehicle({ name: "2019 Honda Civic", year: 2019 });
  setOnboardingVehicleId(car.id);
  expect(values(render(OnboardingOdometer))).toContain("");
  expect(values(render(OnboardingOdometer))).not.toContain("null");
});

test("the odometer has no way past it", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    make: "Toyota",
  });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // Every screen in the flow is mandatory, so the "I'll add it later" hatch is
  // gone: it bought a completed flow whose findings were the app's own
  // arithmetic presented back to the user as their car. One control, one
  // caption, and nothing on the screen that advances without the reading.
  const printed = texts(tree).join(" ");
  expect(printed).not.toMatch(/later|skip/i);
  const controls = tree.root.findAll(
    (n) =>
      typeof n.props.label === "string" && typeof n.props.onPress === "function",
  );
  expect(controls.map((n) => n.props.label)).toEqual(["Continue"]);
  // And it is shut until the reading is in, so an empty field cannot leave.
  expect(controls[0].props.disabled).toBe(true);
  expect(navigated).toHaveLength(0);
  expect(getVehicle(car.id)!.odometer).toBeUndefined();
});

test("a typed reading is still the answer the screen wants", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    make: "Toyota",
  });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingOdometer);
  // Continue is gated on a real number, and it is the only way off this
  // screen. Re-queried after the keystroke rather than held in a variable: the
  // press re-renders, and the node captured before it is not the node
  // carrying the new prop.
  const disabled = () =>
    tree.root.findAll((n) => n.props.label === "Continue")[0].props.disabled;
  expect(disabled()).toBe(true);

  type(tree, "Odometer (mi)", "84210");
  expect(disabled()).toBe(false);
  press(tree, "Continue");

  // The notification ask sits between the odometer and the mileage rate.
  expect(navigated).toContain("/onboarding/notify");
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
  const gate = () => tree.root.findAll((n) => n.props.label !== undefined)[0];
  expect(gate().props.disabled).toBe(true);

  act(() => {
    scroll.props.onScroll({
      nativeEvent: {
        contentOffset: { y: 900 },
        contentSize: { height: 1400 },
        layoutMeasurement: { height: 500 },
      },
    });
  });
  expect(gate().props.disabled).toBe(false);
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
  // Live, and labelled the way it always was: the refusal goes away without
  // the control ever having renamed itself.
  expect(button().props.disabled).toBe(false);
  expect(texts(tree)).toContain("Continue");
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
  expect(navigated).not.toContain("replace:/onboarding/schedule");

  step(700);
  expect(navigated).toContain("replace:/onboarding/schedule");
  jest.useRealTimers();
});

test("the loader prints its own bar as a percentage, and ticks what it has read", () => {
  jest.useFakeTimers();
  const tree = render(OnboardingAnalyzing);

  // The percentage is the bar's value, not a second counter, so at mount it is
  // the bar's starting value and nothing else. The gray box used to close on a
  // "Reading 1 of 4" line under the bar, which is the answer to "how much
  // longer" printed below everything it applies to.
  expect(texts(tree).join(" ")).toContain("0%");

  const step = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  step(650);
  step(650);
  step(650);
  step(650);

  // One tick per checkpoint. The lamp is allowed to take the last one when
  // something is genuinely past due; nothing here is, so all four are ticks.
  expect(texts(tree).filter((line) => line === "\u2713")).toHaveLength(4);
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
  expect(navigated).not.toContain("replace:/onboarding/schedule");
  jest.useRealTimers();
});

test("the last question requires an answer, like every other one", () => {
  const car = createVehicle({
    name: "2019 Toyota",
    year: 2019,
    odometer: 84210,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({ tracking: "memory" });

  const tree = render(OnboardingWorry);
  // It decides which three findings the flow shows next, so an empty answer
  // was the weakest version of the argument available. Multi-select, so the
  // whole cost of the requirement is one tap.
  // Re-queried after the tap rather than held in a variable: the press
  // re-renders, and the node captured before it is not the node carrying the
  // new prop.
  expect(
    tree.root.findAll((n) => n.props.label === "Continue")[0].props.disabled,
  ).toBe(true);

  press(tree, "Surprise repair bills");
  expect(
    tree.root.findAll((n) => n.props.label === "Continue")[0].props.disabled,
  ).toBe(false);
  press(tree, "Continue");
  expect(navigated).toContain("/onboarding/analyzing");

  // And the screens that read the answer still have three true cards to draw.
  const symptoms = texts(render(OnboardingSymptoms)).join(" ");
  expect(symptoms.length).toBeGreaterThan(0);
  expect(texts(render(OnboardingHelp)).join(" ").length).toBeGreaterThan(0);
});

test("the price boundary is never drawn before the paywall", () => {
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

  // The Free/Pro grid used to live here, and this test used to require it. It
  // was removed on purpose: a user who has not yet seen a price learns from
  // that grid that there is one to avoid, and reads the free column as a place
  // to settle. The split belongs to the paywall, so the assertion is inverted
  // rather than deleted — the screen is the reply to the three complaints and
  // nothing else, and a badge reappearing here is the regression.
  const printed = texts(render(OnboardingHelp));
  expect(printed.length).toBeGreaterThan(0);
  expect(printed).not.toContain("Free");
  expect(printed).not.toContain("Pro");
  expect(printed.join(" ")).not.toContain("What you are getting.");
});

test("the notify screen asks over a picture of the reminder itself", () => {
  const car = createVehicle({
    name: "2016 Subaru Outback",
    make: "Subaru",
    model: "Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);
  // A car with a dated service has a next notification, which is what the
  // banner is a picture of. Without one the screen shows the schedule instead,
  // and that fallback has its own test below.
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  });

  const tree = render(OnboardingNotify);
  const printed = texts(tree);
  // The promise, and the count behind it, over this car by name.
  expect(printed).toContain("Never miss a service.");
  expect(printed).toContain(
    "12 services on a schedule for your 2016 Subaru Outback.",
  );

  // The evidence is a picture of the reminder. In English it is the still,
  // sized from its own pixel dimensions and seated between two dimmed
  // neighbours so it reads as a notification and not as a feature card; the
  // drawn banner is what every other language gets (tested below). The
  // schedule list both replaced was six service names between the promise
  // and the only control on the screen, and none of them come back here.
  const stills = tree.root.findAll(
    (n) => typeof n.type === "string" && n.props.resizeMode === "contain",
  );
  expect(stills).toHaveLength(1);
  expect(stills[0].props.accessibilityLabel).toBe("Never miss a service.");
  expect(printed).not.toContain("Oil Change");
  expect(printed.join(" ")).not.toMatch(/\{\w+\}/);

  // One control, and one line of grey under the heading. The "Do it later"
  // deferral is gone: iOS's own alert carries the decline this screen used to
  // print above it.
  expect(printed).toContain("Turn on reminders");
  expect(printed.join(" ")).not.toMatch(/later/i);
  expect(
    tree.root
      .findAll(
        (n) =>
          typeof n.props.label === "string" &&
          typeof n.props.onPress === "function",
      )
      .map((n) => n.props.label),
  ).toEqual(["Turn on reminders"]);
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

test("the banner is drawn in the reader's own language, from their own car", () => {
  const car = createVehicle({
    name: "2016 Subaru Outback",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  });

  setLanguage("fr");
  try {
    const tree = render(OnboardingNotify);
    // Never a still, in any language: the banner is rendered from this car's
    // own record, through the keys the scheduler actually sends. An English
    // picture on a French screen was the reason the drawn path existed, and a
    // picture of superseded copy is why it is now the only path.
    expect(
      tree.root.findAll(
        (n) => typeof n.type === "string" && n.props.resizeMode === "contain",
      ),
    ).toHaveLength(0);
    const french = texts(tree).join(" ");
    expect(french).toContain("2016 Subaru Outback");
    expect(french).toContain("\u00e0 faire");
    expect(french).not.toContain("is due");
  } finally {
    setLanguage("en");
  }
});

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

  await pressAndSettle(render(OnboardingNotify), "Turn on reminders");

  expect(requestPermissionsAsync).toHaveBeenCalled();
  expect(navigated).toContain("/onboarding/drive");
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

  await pressAndSettle(render(OnboardingNotify), "Turn on reminders");

  expect(requestPermissionsAsync).not.toHaveBeenCalled();
  expect(navigated).toContain("/onboarding/drive");

  getPermissionsAsync.mockResolvedValue({
    status: "granted",
    canAskAgain: false,
  });
});

// The body-style step was cut on 2026-08-29. Nothing downstream read
// `body_style`, so there was no behaviour left to test once the screen went;
// the column and its helpers stay covered by tests/body-style.test.ts.

/**
 * The screen that exists because onboarding used to end at Apple's receipt.
 *
 * `finish("paid")` completed the flow and replaced the stack with the garage,
 * so a new subscriber's first screen was a list holding one car, with nothing
 * naming what they had just bought and nothing to do next. These assertions
 * are about that gap: the car is named, the numbers the paywall argued from are
 * restated, and the single action goes to the car rather than to the list.
 */
describe("the screen after a purchase", () => {
  test("names the car and restates what was scheduled", () => {
    const id = createVehicle({ name: "2019 Toyota", year: 2019, odometer: 90_000 }).id;
    setOnboardingVehicleId(id);

    const shown = texts(render(Subscribed)).join(" ");
    expect(shown).toContain("Pro is on.");
    expect(shown).toContain("2019 Toyota");
    // Everything the subscription carries, in the same short lines the trial
    // screen offered them in. With no free tier left there is no half of the
    // list to leave out, and a receipt that named two of seven would be
    // claiming the money bought less than it did.
    //
    // Read through `t` rather than pasted in: the claim is that this screen
    // shows the same lines the offer did, not that they are phrased any
    // particular way, and the pasted version went stale the first time the
    // copy was edited.
    for (const id of ["history", "due", "reminders", "export", "costs", "garage", "intervals"]) {
      expect(shown).toContain(t(`offer.trial.gets.${id}`));
    }
  });

  test("the one action opens the car, not the garage", () => {
    const id = createVehicle({ name: "2019 Toyota", year: 2019, odometer: 90_000 }).id;
    setOnboardingVehicleId(id);

    press(render(Subscribed), "See the schedule");
    // The garage underneath, the car on top: a stack of only the car had no
    // back chevron, and the settings button lives on the garage.
    expect(navigated.slice(-2)).toEqual(["replace:/", `/vehicle/${id}`]);
  });

  test("a car deleted out from under the flow still lands somewhere", () => {
    // The vehicle row is looked up rather than trusted, so this is the state a
    // resumed-and-deleted install reaches. It must not be a dead button.
    press(render(Subscribed), "See the schedule");
    expect(navigated.at(-1)).toBe("replace:/");
  });
});

test("the drums show the reading being typed, not a second invented one", () => {
  // The screen rolled a random six-figure demo above a field holding the user's
  // own number: two odometer readings on the one screen whose entire job is to
  // collect a single reading.
  const tree = render(OnboardingOdometer);
  const roll = () =>
    tree.root.findAll(
      (n) => typeof n.type === "function" && n.type.name === "OdometerRoll",
    )[0].props as { value: number; live?: boolean };

  expect(roll().live).toBeFalsy();
  type(tree, "Odometer (mi)", "84210");
  expect(roll()).toMatchObject({ value: 84210, live: true });
});

/**
 * The three screens added on 2026-09-10: the introduction, the twelve-month
 * projection, and the one screen in the flow carrying figures that are not the
 * user's own.
 */

test("the name screen will not let an empty answer through", () => {
  const tree = render(OnboardingName);

  // Gated on the field, not on the tap. `press` refuses a disabled control, so
  // this is the assertion that Continue is actually dead rather than merely
  // ignored.
  expect(() => press(tree, t("onboardingA.name.continue"))).toThrow();

  // Three spaces is not an answer either, and this is the one that a naive
  // `value.length > 0` would have let past.
  type(tree, t("onboardingA.name.label"), "   ");
  expect(() => press(tree, t("onboardingA.name.continue"))).toThrow();

  type(tree, t("onboardingA.name.label"), "  Alex ");
  press(tree, t("onboardingA.name.continue"));
  expect(getOnboardingName()).toBe("Alex");
  expect(navigated).toContain("/onboarding/vehicle");
});

test("the name screen comes back filled in", () => {
  setOnboardingName("Alex");
  // A replay keeps the name — it re-asks about the car, not about the driver —
  // so the one user who has already answered taps Continue rather than typing
  // their own name a second time.
  expect(values(render(OnboardingName))).toContain("Alex");
});

test("both asks address the driver by name, and neither breaks without one", () => {
  const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
  setOnboardingVehicleId(car.id);
  setAnswers({ drive: "average" });

  // The name outlives `resetOnboarding` by design, so the unnamed half of this
  // test has to clear it explicitly. This is the state every install that
  // predates the name screen is in.
  getDb().runSync("DELETE FROM app_state WHERE key = ?", [ONBOARDING_NAME_KEY]);

  const unnamed = texts(render(OnboardingPaywall)).join(" ");
  expect(unnamed).toBe(unnamed.replace(/\{name\}/g, ""));
  expect(unnamed).toContain(t("offer.paywall.title"));

  setOnboardingName("Alex");
  for (const Screen of [OnboardingPaywall, OnboardingOffer]) {
    const printed = texts(render(Screen)).join(" ");
    expect(printed).toContain("Alex");
    expect(printed).not.toMatch(/\{\w+\}/);
  }
});

test("the schedule page says what is watched, not what is missing", () => {
  // A fresh install: one record, eleven services with none. The old results
  // screen headlined "11 services have no record yet" and stamped "No record"
  // down the list, which is the app telling the user what they just did not
  // type. The page now leads on what it watches from today.
  const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
  setOnboardingVehicleId(car.id);
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: new Date().toISOString(),
    odometer: 112000,
  });
  setAnswers({ drive: "high" });

  const printed = texts(render(OnboardingSchedule)).join(" ");
  expect(printed).toMatch(/on watch from today/);
  expect(printed).not.toMatch(/no record/i);
  expect(printed).not.toMatch(/nothing on file/i);
  expect(printed).toContain(t("onboardingC.schedule.onWatch"));
  expect(printed).toContain(t("onboardingC.schedule.status.fresh"));
  // The one projection, and it is a distance off the user's own reading, not
  // a score: a stray percentage here would be the only invented figure in the
  // flow.
  expect(printed).toContain(t("onboardingC.outlook.projected"));
  expect(printed).not.toMatch(/\d+\s*%/);
  expect(printed).not.toMatch(/\{\w+\}/);
});

test("the schedule page still leads on the overdue count when there is one", () => {
  const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
  setOnboardingVehicleId(car.id);
  // Logged long ago and far back: genuinely past its interval.
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 400 * 86400000).toISOString(),
    odometer: 60000,
  });
  setAnswers({ drive: "high" });

  const printed = texts(render(OnboardingSchedule)).join(" ");
  expect(printed).toContain(t("onboardingC.results.overdue", { count: 1 }));
});

test("the cited screen leads on the overdue figure and says whose it is", () => {
  const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
  setOnboardingVehicleId(car.id);
  setAnswers({ drive: "high" });

  const printed = texts(render(OnboardingCost)).join(" ");

  // The headline, and the two services under it. This screen used to price the
  // user's own mileage at AAA's rate; the money said nothing a cheaper car
  // would not have said better, so the only figure left is the one about being
  // behind on the work — which is what the app is for.
  expect(printed).toContain(`${OVERDUE.behindPct}%`);
  expect(printed).toContain(`${OVERDUE.tireRotationPct}%`);
  expect(printed).toContain(`${OVERDUE.oilChangePct}%`);
  // Nothing on this screen is priced any more, in any currency.
  expect(printed).not.toMatch(/[$€£¥]/);
  // Attribution, on the screen, in the reader's language. A statistic nobody
  // can chase is indistinguishable from one we invented.
  expect(printed).toContain(OVERDUE.source);
  expect(printed).toContain(String(OVERDUE.year));
  expect(printed).not.toMatch(/\{\w+\}/);
});

test("the comparison screen counts the car, and never prices it", () => {
  const car = createVehicle({
    name: "2016 Subaru Outback",
    year: 2016,
    make: "Subaru",
    model: "Outback",
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);
  setAnswers({ drive: "average" });

  const tree = render(OnboardingCompare);
  const printed = texts(tree).join(" ");

  // Four bars, two pairs. The component draws a track per row, so the count of
  // tracks is the count of rows.
  expect(printed).toContain("On your own");
  expect(printed).toContain("With Wrenchy");

  // The screen the conversion structure asks for here says "you will save
  // $400 a year". There is no published figure behind that sentence, so this
  // screen may not print money at all: every number on it is a count of this
  // car's own tracked services.
  expect(printed).not.toMatch(/[$\u20ac\u00a3\u00a5]/);
  expect(printed).toContain("Counted from your own answers.");
});
