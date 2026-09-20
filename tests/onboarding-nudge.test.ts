import Database from "better-sqlite3";

jest.mock("../src/db/client", () => {
  const db = new Database(":memory:");
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

// `resume` reads the flow to know where the ask begins, and the flow reads the
// experiment registry, which reaches analytics and the native SDKs behind it.
// The variants do not move the paywall, so control is the truth here.
jest.mock("../src/experiments", () => ({ getVariant: () => null }));

// Mocked rather than transformed: the real package is ESM and never loads in
// the logic project. The mock is also the assertion surface — what the app
// asked iOS to hold is the whole behaviour under test.
const scheduled: { identifier?: string; content: { title: string; body: string }; trigger: { date: Date } }[] = [];
const cancelled: string[] = [];
// What iOS is holding. Only the legacy-adoption path reads it, and it is the
// one input that distinguishes an install the old build left mid-loop from one
// that has never run at all.
let pending: { identifier: string }[] = [];
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(async (request: never) => {
    scheduled.push(request);
    return "id";
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    cancelled.push(id);
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => pending),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

import {
  scheduleOnboardingNudges,
  cancelOnboardingNudges,
  RESUME_NUDGE_IDS,
  NUDGE_KEYS,
} from "../src/notify/resume";
import {
  completeOnboarding,
  resetOnboarding,
  setOnboardingName,
  setOnboardingStep,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { createVehicle } from "../src/db/vehicles";
import { addRecord } from "../src/db/records";
import { setState } from "../src/db/state";
import { ONBOARDING_NAME_KEY } from "../src/onboarding/state";
import { t } from "../src/i18n";

const NOW = new Date("2026-09-09T12:00:00.000Z").getTime();

beforeEach(() => {
  scheduled.length = 0;
  cancelled.length = 0;
  pending = [];
  resetOnboarding();
});

/** The schedule, in hours after the drop-off. */
const OFFSETS = [1, 3, 24, 72, 168, 504, 720];

test("an unfinished flow is nudged seven times, from an hour out to a month", () => {
  return scheduleOnboardingNudges(NOW).then(() => {
    expect(scheduled).toHaveLength(7);
    expect(scheduled.map((s) => s.identifier)).toEqual(RESUME_NUDGE_IDS);
    expect(scheduled.map((s) => s.trigger.date.getTime() - NOW)).toEqual(
      OFFSETS.map((h) => h * 60 * 60 * 1000),
    );
  });
});

test("the nudge names the car the half-written flow was about", async () => {
  const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
  setOnboardingVehicleId(car.id);

  await scheduleOnboardingNudges(NOW);

  // In the body, which iOS gives two lines. The title carries the message and
  // nothing of variable length, because the title is the line that truncates.
  expect(scheduled[0].content.body).toContain("2016 Subaru Outback");
  // Not a template with a placeholder left in it, which is the failure mode a
  // notification has no screen to show it on.
  expect(scheduled[0].content.body).not.toContain("{vehicle}");
  expect(scheduled[0].content.title).toBe(t("system.resume.first.title"));
});

test("a car that was never named still gets an honest sentence", async () => {
  await scheduleOnboardingNudges(NOW);
  expect(scheduled[0].content.body).not.toContain("{vehicle}");
  expect(scheduled[0].content.title.length).toBeGreaterThan(0);
});

/**
 * The budget iOS actually enforces. A collapsed banner gives the title roughly
 * forty characters, and the old copy spent them on a name, a user-typed vehicle
 * and a service name in one line — so the service, which is the whole point of
 * the notification, was what fell off the end.
 */
test("the title stays inside what iOS will show of it", async () => {
  const car = createVehicle({
    name: "2016 Subaru Outback Limited 3.6R",
    year: 2016,
    odometer: 112000,
  });
  setOnboardingVehicleId(car.id);
  setOnboardingName("Bartholomew");

  await scheduleOnboardingNudges(NOW);

  expect(scheduled[0].content.title.length).toBeLessThanOrEqual(40);
});

test("a finished flow is nudged about nothing", async () => {
  completeOnboarding();
  await scheduleOnboardingNudges(NOW);
  expect(scheduled).toHaveLength(0);
  // Still cleared, because the flow may have been finished since the last one
  // was scheduled.
  expect(cancelled).toEqual(RESUME_NUDGE_IDS);
});

const HOUR = 60 * 60 * 1000;

test("moving a step clears the previous set rather than stacking a second", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 60_000);
  expect(cancelled).toEqual([...RESUME_NUDGE_IDS, ...RESUME_NUDGE_IDS]);
  expect(scheduled).toHaveLength(14);
  // Still seven pending, all counted from the second exit.
  expect(scheduled.slice(7).map((s) => s.trigger.date.getTime() - (NOW + 60_000))).toEqual(
    OFFSETS.map((h) => h * HOUR),
  );
});

/**
 * The bug this file exists to hold shut.
 *
 * `rescheduleAll` calls this on every cold start, so a user who abandons the
 * flow and then opens the app — because the first nudge told them to — used to
 * have the clock reset by that very launch, and be nudged again two hours
 * later, indefinitely. Two pending at a time, unbounded deliveries.
 */
test("relaunching on the same step leaves the pending set alone", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  expect(scheduled).toHaveLength(7);

  // Three launches, no progress. Nothing cancelled, nothing armed.
  scheduled.length = 0;
  cancelled.length = 0;
  await scheduleOnboardingNudges(NOW + 5 * 60_000);
  await scheduleOnboardingNudges(NOW + 30 * 60_000);
  await scheduleOnboardingNudges(NOW + 50 * 60_000);
  // Re-armed at the same times (the caller may have wiped them), never
  // cancelled and never moved.
  expect(cancelled).toHaveLength(0);
  expect(new Set(scheduled.map((s) => s.trigger.date.getTime()))).toEqual(
    new Set(OFFSETS.map((h) => NOW + h * HOUR))
  );
});

test("a relaunch that wiped the pending pair re-arms it at the original times", async () => {
  // `rescheduleAll` cancels every pending notification before it calls the
  // scheduler, so "leave the pair alone" has to mean "put it back exactly",
  // not "do nothing" — doing nothing left the flow with no nudges at all.
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  const armed = scheduled.map((s) => [s.identifier, s.trigger.date.getTime()]);

  scheduled.length = 0;
  await scheduleOnboardingNudges(NOW + 30 * 60_000);
  expect(scheduled.map((s) => [s.identifier, s.trigger.date.getTime()])).toEqual(armed);

  // After the first has fired, only the rest are put back, still at their
  // original times.
  scheduled.length = 0;
  await scheduleOnboardingNudges(NOW + 2 * HOUR);
  expect(scheduled.map((s) => [s.identifier, s.trigger.date.getTime()])).toEqual(armed.slice(1));
});

test("a launch after the first nudge fired is owed the rest, not a fresh set", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);

  // The first nudge fires at +1h and the user opens the app from it, then gets
  // one screen further before quitting again.
  scheduled.length = 0;
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 2 * HOUR);

  expect(scheduled.map((s) => s.identifier)).toEqual(RESUME_NUDGE_IDS.slice(1));
  expect(scheduled[0].trigger.date.getTime() - (NOW + 2 * HOUR)).toBe(3 * HOUR);
});

test("the second nudge survives launches between the first firing and its own time", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  // First fired at +1h; the user moved one step and quit at +2h, so the
  // three-hour nudge is pending, due at +5h, with the later five behind it.
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 2 * HOUR);

  // Opened again at +2.5h on the same step. Nothing has fired since the
  // re-arm, so the pending nudges are put back at the times they were promised
  // for — not cancelled because the one-hour offset of a nudge that was never
  // re-armed has "passed".
  scheduled.length = 0;
  cancelled.length = 0;
  await scheduleOnboardingNudges(NOW + 2.5 * HOUR);
  expect(cancelled).toEqual([]);
  expect(scheduled.map((s) => s.identifier)).toEqual(RESUME_NUDGE_IDS.slice(1));
  expect(scheduled[0].trigger.date.getTime()).toBe(NOW + 5 * HOUR);

  // And on a further step change, still owed the remaining six and nothing more.
  scheduled.length = 0;
  setOnboardingStep("service");
  await scheduleOnboardingNudges(NOW + 2.75 * HOUR);
  expect(scheduled.map((s) => s.identifier)).toEqual(RESUME_NUDGE_IDS.slice(1));
});

test("seven is the lifetime cap, however many times the app is opened", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);

  scheduled.length = 0;
  // A month on, all seven have fired. The user keeps opening the app and
  // keeps moving through the flow without finishing it; nothing more is sent.
  for (const [i, at] of [721, 740, 800, 1000].entries()) {
    setOnboardingStep(`step-${i}`);
    await scheduleOnboardingNudges(NOW + at * HOUR);
  }
  expect(scheduled).toHaveLength(0);
});

test("a replay starts the quota over", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  await scheduleOnboardingNudges(NOW + 800 * HOUR);
  completeOnboarding();
  await scheduleOnboardingNudges(NOW + 801 * HOUR);

  scheduled.length = 0;
  resetOnboarding();
  await scheduleOnboardingNudges(NOW + 802 * HOUR);
  expect(scheduled).toHaveLength(7);
});

test("finishing cancels by identifier, leaving the service reminders alone", async () => {
  await cancelOnboardingNudges();
  expect(cancelled).toEqual(RESUME_NUDGE_IDS);
  expect(scheduled).toHaveLength(0);
});

/**
 * The cohort the fix cannot count, seeded rather than guessed.
 *
 * An install already mid-flow under the build with no lifetime count has no
 * record of its own, so the ordinary path would read it as new and hand it a
 * fresh pair — two more notifications to the users who had the most.
 */
test("an install the old build left mid-loop is adopted as spent", async () => {
  setOnboardingStep("drive");
  pending = RESUME_NUDGE_IDS.map((identifier) => ({ identifier }));

  await scheduleOnboardingNudges(NOW);

  expect(scheduled).toHaveLength(0);
  // And the pair the old build left behind is taken out of the queue with it.
  expect(cancelled).toEqual(RESUME_NUDGE_IDS);

  // Spent for the rest of the run, however far the user gets.
  setOnboardingStep("worry");
  await scheduleOnboardingNudges(NOW + 6 * HOUR);
  expect(scheduled).toHaveLength(0);
});

test("a fresh install is not mistaken for one of them", async () => {
  // Nothing pending, which is the whole difference: the old build armed its
  // pair on every launch, so an install still mid-flow under it always has one.
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  expect(scheduled).toHaveLength(7);
});

test("adoption does not re-fire on the launch after it", async () => {
  setOnboardingStep("drive");
  pending = RESUME_NUDGE_IDS.map((identifier) => ({ identifier }));
  await scheduleOnboardingNudges(NOW);

  // The record now exists, so the pending check is never consulted again — and
  // would not match anyway, since the adoption cancelled the pair.
  cancelled.length = 0;
  await scheduleOnboardingNudges(NOW + HOUR);
  expect(scheduled).toHaveLength(0);
});

/**
 * The tail of the flow is a different message. A user parked on the paywall
 * or the exit offer has answered every question and been asked for money —
 * "setup is half done" is a lie to them, and the thing that brings them back
 * is the plan their own answers built, not the promise of building it.
 */
describe("past the quiz, the nudge sells the plan rather than the setup", () => {
  // A replay keeps the name on purpose, so `resetOnboarding` leaves the one an
  // earlier test typed. These assert the unnamed titles, so it is set aside.
  beforeEach(() => setState(ONBOARDING_NAME_KEY, ""));

  test.each(["paywall", "offer"])("on %s the copy is the ask's", async (step) => {
    const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
    setOnboardingVehicleId(car.id);
    setOnboardingStep(step);

    await scheduleOnboardingNudges(NOW);

    expect(scheduled).toHaveLength(7);
    expect(scheduled.map((s) => s.content.title)).toEqual(
      NUDGE_KEYS.map((k) => t(`system.resume.ask.${k}.title`)),
    );
    for (const s of scheduled) {
      expect(s.content.body).toContain("2016 Subaru Outback");
      expect(s.content.body).not.toMatch(/\{\w+\}/);
    }
  });

  test("the first nudge counts the services this car is actually behind on", async () => {
    const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
    setOnboardingVehicleId(car.id);
    // One service on file, two years and sixty thousand miles ago: past due by
    // any interval. Everything else has no record, which is unknown, not late.
    addRecord({ vehicle_id: car.id, service_type: "Oil Change", performed_at: "2024-06-01", odometer: 52000 });
    setOnboardingStep("offer");

    await scheduleOnboardingNudges(NOW);

    expect(scheduled[0].content.body).toBe(
      t("system.resume.ask.first.body", { vehicle: "2016 Subaru Outback", count: 1 }),
    );
    expect(scheduled[0].content.body).toContain("1 service ");
  });

  test("a car with nothing behind on it is sold the schedule, not a zero", async () => {
    const car = createVehicle({ name: "2016 Subaru Outback", year: 2016, odometer: 112000 });
    setOnboardingVehicleId(car.id);
    setOnboardingStep("offer");

    await scheduleOnboardingNudges(NOW);

    expect(scheduled[0].content.body).toBe(
      t("system.resume.ask.first.body.zero", { vehicle: "2016 Subaru Outback" }),
    );
    expect(scheduled[0].content.body).not.toContain("0 ");
  });

  test("a step in the quiz still gets the setup copy", async () => {
    setOnboardingStep("drive");
    await scheduleOnboardingNudges(NOW);
    expect(scheduled[0].content.title).toBe(t("system.resume.first.title"));
  });

  test("the ask's titles stay inside iOS's line with a long name in front", async () => {
    setOnboardingName("Bartholomew");
    setOnboardingStep("offer");
    await scheduleOnboardingNudges(NOW);
    for (const s of scheduled) expect(s.content.title.length).toBeLessThanOrEqual(48);
  });
});
