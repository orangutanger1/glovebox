import { dueStates } from "../src/schedule/due";

/**
 * The one place "latest record per type → nextDue → dueStatus" lives.
 *
 * The garage card, the vehicle screen, the reminder collector and the
 * onboarding plan each carried their own copy of that loop, and the copies
 * drifted: when b50b2f6 shipped "Other" with no interval, the garage card
 * learned to skip an empty interval by name of the bug while the vehicle
 * screen only skipped it by accident (an empty interval yields no due figure,
 * which reads as "ok"). Four loops is four places the next rule has to land.
 */

function performedOn(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

const NOW = new Date(2026, 8, 17, 10).toISOString();

const INTERVALS = {
  "Oil Change": { months: 6, distance: 5000 },
  "Spark Plugs": { distance: 60000 },
  "Wiper Blades": { months: 12 },
  Other: {},
};

test("one state per service type, from the latest record of that type", () => {
  const states = dueStates({
    records: [
      { service_type: "Oil Change", performed_at: performedOn(2026, 8, 1), odometer: 84000 },
      { service_type: "Oil Change", performed_at: performedOn(2026, 1, 1), odometer: 80000 },
    ],
    intervals: INTERVALS,
    odometer: 84500,
    unit: "mi",
    now: NOW,
  });
  expect(states).toHaveLength(1);
  expect(states[0].type).toBe("Oil Change");
  expect(states[0].status).toBe("ok");
  expect(states[0].dueOdometer).toBe(89000);
  expect(states[0].last.odometer).toBe(84000);
});

test("the latest record wins whatever order the rows arrive in", () => {
  const states = dueStates({
    records: [
      { service_type: "Oil Change", performed_at: performedOn(2026, 1, 1), odometer: 80000 },
      { service_type: "Oil Change", performed_at: performedOn(2026, 8, 1), odometer: 84000 },
    ],
    intervals: INTERVALS,
    odometer: 84500,
    unit: "mi",
    now: NOW,
  });
  expect(states[0].last.odometer).toBe(84000);
});

test("a type with no interval, or an empty one, produces no state", () => {
  // The b50b2f6 rule, in one place: "Other" ships with no cadence, and a
  // service the app has no opinion about is not "on schedule" — it must not
  // take the garage headline from one that has an interval, and it must not
  // be listed as due anywhere.
  const states = dueStates({
    records: [
      { service_type: "Other", performed_at: performedOn(2025, 1, 1) },
      { service_type: "Detailing", performed_at: performedOn(2025, 1, 1) },
      { service_type: "Wiper Blades", performed_at: performedOn(2025, 1, 1) },
    ],
    intervals: INTERVALS,
    odometer: 84500,
    unit: "mi",
    now: NOW,
  });
  expect(states.map((s) => s.type)).toEqual(["Wiper Blades"]);
  expect(states[0].status).toBe("due");
});

test("overBy is how far the reading is past the distance figure, only when past", () => {
  const states = dueStates({
    records: [
      { service_type: "Oil Change", performed_at: performedOn(2026, 8, 1), odometer: 80000 },
      { service_type: "Spark Plugs", performed_at: performedOn(2026, 8, 1), odometer: 30000 },
      { service_type: "Wiper Blades", performed_at: performedOn(2025, 1, 1) },
    ],
    intervals: INTERVALS,
    odometer: 85400,
    unit: "mi",
    now: NOW,
  });
  const byType = Object.fromEntries(states.map((s) => [s.type, s]));
  expect(byType["Oil Change"].status).toBe("due");
  expect(byType["Oil Change"].overBy).toBe(400);
  expect(byType["Spark Plugs"].overBy).toBeUndefined();
  // Due by date, with no distance figure at all.
  expect(byType["Wiper Blades"].status).toBe("due");
  expect(byType["Wiper Blades"].overBy).toBeUndefined();
});

test("states come out in the order the types were first seen", () => {
  const states = dueStates({
    records: [
      { service_type: "Wiper Blades", performed_at: performedOn(2026, 8, 1) },
      { service_type: "Oil Change", performed_at: performedOn(2026, 7, 1), odometer: 80000 },
    ],
    intervals: INTERVALS,
    unit: "mi",
    now: NOW,
  });
  expect(states.map((s) => s.type)).toEqual(["Wiper Blades", "Oil Change"]);
});
