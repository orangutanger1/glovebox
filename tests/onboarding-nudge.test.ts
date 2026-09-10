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
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(async (request: never) => {
    scheduled.push(request);
    return "id";
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    cancelled.push(id);
  }),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

import {
  scheduleOnboardingNudges,
  cancelOnboardingNudges,
  RESUME_NUDGE_IDS,
} from "../src/notify/resume";
import { completeOnboarding, resetOnboarding, setOnboardingVehicleId } from "../src/onboarding";
import { createVehicle } from "../src/db/vehicles";
import { t } from "../src/i18n";

const NOW = new Date("2026-09-09T12:00:00.000Z").getTime();

beforeEach(() => {
  scheduled.length = 0;
  cancelled.length = 0;
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

  // Not a template with a placeholder left in it, which is the failure mode a
  // notification has no screen to show it on.
  expect(scheduled[0].content.title).toContain("2016 Subaru Outback");
  expect(scheduled[0].content.title).not.toContain("{vehicle}");
  expect(scheduled[0].content.body).toBe(t("system.resume.first.body"));
});

test("a car that was never named still gets an honest sentence", async () => {
  await scheduleOnboardingNudges(NOW);
  expect(scheduled[0].content.title).not.toContain("{vehicle}");
  expect(scheduled[0].content.title.length).toBeGreaterThan(0);
});

test("a finished flow is nudged about nothing", async () => {
  completeOnboarding();
  await scheduleOnboardingNudges(NOW);
  expect(scheduled).toHaveLength(0);
  // Still cleared, because the flow may have been finished since the last one
  // was scheduled.
  expect(cancelled).toEqual(RESUME_NUDGE_IDS);
});

test("rescheduling clears the previous pair rather than stacking a second", async () => {
  await scheduleOnboardingNudges(NOW);
  await scheduleOnboardingNudges(NOW + 60_000);
  expect(cancelled).toEqual([...RESUME_NUDGE_IDS, ...RESUME_NUDGE_IDS]);
  expect(scheduled).toHaveLength(4);
});

test("finishing cancels by identifier, leaving the service reminders alone", async () => {
  await cancelOnboardingNudges();
  expect(cancelled).toEqual(RESUME_NUDGE_IDS);
  expect(scheduled).toHaveLength(0);
});
