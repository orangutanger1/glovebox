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
} from "../src/notify/resume";
import {
  completeOnboarding,
  resetOnboarding,
  setOnboardingName,
  setOnboardingStep,
  setOnboardingVehicleId,
} from "../src/onboarding";
import { createVehicle } from "../src/db/vehicles";
import { t } from "../src/i18n";

const NOW = new Date("2026-09-09T12:00:00.000Z").getTime();

beforeEach(() => {
  scheduled.length = 0;
  cancelled.length = 0;
  pending = [];
  resetOnboarding();
});

test("an unfinished flow is nudged twice, two hours and a day out", () => {
  return scheduleOnboardingNudges(NOW).then(() => {
    expect(scheduled).toHaveLength(2);
    expect(scheduled.map((s) => s.identifier)).toEqual(RESUME_NUDGE_IDS);
    expect(scheduled.map((s) => s.trigger.date.getTime() - NOW)).toEqual([
      2 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000,
    ]);
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

test("moving a step clears the previous pair rather than stacking a second", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 60_000);
  expect(cancelled).toEqual([...RESUME_NUDGE_IDS, ...RESUME_NUDGE_IDS]);
  expect(scheduled).toHaveLength(4);
  // Still two pending, and both counted from the second exit.
  expect(scheduled.slice(2).map((s) => s.trigger.date.getTime() - (NOW + 60_000))).toEqual([
    2 * HOUR,
    24 * HOUR,
  ]);
});

/**
 * The bug this file exists to hold shut.
 *
 * `rescheduleAll` calls this on every cold start, so a user who abandons the
 * flow and then opens the app — because the first nudge told them to — used to
 * have the clock reset by that very launch, and be nudged again two hours
 * later, indefinitely. Two pending at a time, unbounded deliveries.
 */
test("relaunching on the same step leaves the pending pair alone", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  expect(scheduled).toHaveLength(2);

  // Three launches, no progress. Nothing cancelled, nothing armed.
  scheduled.length = 0;
  cancelled.length = 0;
  await scheduleOnboardingNudges(NOW + 5 * 60_000);
  await scheduleOnboardingNudges(NOW + 30 * 60_000);
  await scheduleOnboardingNudges(NOW + 90 * 60_000);
  // Re-armed at the same times (the caller may have wiped them), never
  // cancelled and never moved.
  expect(cancelled).toHaveLength(0);
  expect(new Set(scheduled.map((s) => s.trigger.date.getTime()))).toEqual(
    new Set([NOW + 2 * HOUR, NOW + 24 * HOUR])
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

  // After the first has fired, only the second is put back, still at its
  // original time.
  scheduled.length = 0;
  await scheduleOnboardingNudges(NOW + 3 * HOUR);
  expect(scheduled.map((s) => [s.identifier, s.trigger.date.getTime()])).toEqual([armed[1]]);
});

test("a launch after the first nudge fired is owed the second, not a fresh pair", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);

  // The first nudge fires at +2h and the user opens the app from it, then gets
  // one screen further before quitting again.
  scheduled.length = 0;
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 3 * HOUR);

  expect(scheduled).toHaveLength(1);
  expect(scheduled[0].identifier).toBe(RESUME_NUDGE_IDS[1]);
  expect(scheduled[0].trigger.date.getTime() - (NOW + 3 * HOUR)).toBe(24 * HOUR);
});

test("the second nudge survives launches between the first firing and its own time", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  // First fired at +2h; the user moved one step and quit at +3h, so only the
  // day-out nudge is pending, due at +27h.
  setOnboardingStep("drive");
  await scheduleOnboardingNudges(NOW + 3 * HOUR);

  // Opened again at +6h on the same step. Nothing has fired since the re-arm,
  // so the pending nudge is put back at the time it was promised for — not
  // cancelled because the two-hour offset of a nudge that was never re-armed
  // has "passed".
  scheduled.length = 0;
  cancelled.length = 0;
  await scheduleOnboardingNudges(NOW + 6 * HOUR);
  expect(cancelled).toEqual([]);
  expect(scheduled.map((s) => s.identifier)).toEqual([RESUME_NUDGE_IDS[1]]);
  expect(scheduled[0].trigger.date.getTime()).toBe(NOW + 27 * HOUR);

  // And on a further step change, still owed the second and nothing more.
  scheduled.length = 0;
  setOnboardingStep("service");
  await scheduleOnboardingNudges(NOW + 8 * HOUR);
  expect(scheduled.map((s) => s.identifier)).toEqual([RESUME_NUDGE_IDS[1]]);
});

test("two is the lifetime cap, however many times the app is opened", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);

  scheduled.length = 0;
  // A day and a half later both have fired. The user keeps opening the app and
  // keeps moving through the flow without finishing it; nothing more is sent.
  for (const [i, at] of [36, 48, 72, 96].entries()) {
    setOnboardingStep(`step-${i}`);
    await scheduleOnboardingNudges(NOW + at * HOUR);
  }
  expect(scheduled).toHaveLength(0);
});

test("a replay starts the quota over", async () => {
  setOnboardingStep("notify");
  await scheduleOnboardingNudges(NOW);
  await scheduleOnboardingNudges(NOW + 48 * HOUR);
  completeOnboarding();
  await scheduleOnboardingNudges(NOW + 49 * HOUR);

  scheduled.length = 0;
  resetOnboarding();
  await scheduleOnboardingNudges(NOW + 50 * HOUR);
  expect(scheduled).toHaveLength(2);
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
  expect(scheduled).toHaveLength(2);
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
