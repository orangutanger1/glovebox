import Database from "better-sqlite3";

/**
 * A walk through the whole flow's data path.
 *
 * The screens are JSX over these calls and nothing else: the vehicle question
 * runs `createVehicle`, the odometer question runs `setOdometerIfHigher`, the
 * service question writes a record, the two attitude questions write answers,
 * and every screen after them renders `readFindings()`. Driving those in order
 * against a real SQLite file is the closest thing to launching the app that
 * runs in Node, and it is the test that would have caught each of the three
 * ways the old flow wrote the wrong car.
 */
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

import { createVehicle, getVehicle, setOdometerReading, updateVehicleIdentity } from "../src/db/vehicles";
import { addRecord, listRecords, softDeleteRecord } from "../src/db/records";
import {
  getAnswers,
  getOnboardingVehicleId,
  setAnswers,
  setOnboardingVehicleId,
  resetOnboarding,
} from "../src/onboarding";
import { readFindings } from "../src/onboarding/usePlan";
import { MILES_PER_YEAR, milesPerYearFor, odometerDaysAgo } from "../src/onboarding/plan";
import type { ServiceTypeAnswer } from "../src/onboarding/state";

/** What `app/onboarding/vehicle.tsx` does on Continue. */
function answerVehicle(name: string, year: number) {
  const ownedId = getOnboardingVehicleId();
  const existing = ownedId ? getVehicle(ownedId) : null;
  const identity = { name, year, make: "Honda", model: "Civic" };
  if (existing) updateVehicleIdentity(existing.id, identity);
  else setOnboardingVehicleId(createVehicle(identity).id);
}

/**
 * What `app/onboarding/service.tsx` does on Continue.
 *
 * The record is dated noon local and filed at the mileage the car was showing
 * then, counted back from today's reading at the rate the previous question
 * established. Both the type now chosen and the type answered last time are
 * cleared first, so changing the answer corrects the run's one record instead
 * of leaving the old service behind.
 */
function answerService(type: ServiceTypeAnswer, daysAgo: number | null) {
  const vehicle = getVehicle(getOnboardingVehicleId()!)!;
  const answeredBefore = getAnswers().service;
  for (const r of listRecords(vehicle.id)) {
    if (r.service_type === type || r.service_type === answeredBefore) softDeleteRecord(r.id);
  }
  if (daysAgo !== null) {
    const performed = new Date();
    performed.setDate(performed.getDate() - daysAgo);
    performed.setHours(12, 0, 0, 0);
    addRecord({
      vehicle_id: vehicle.id,
      service_type: type,
      performed_at: performed.toISOString(),
      odometer:
        vehicle.odometer === undefined
          ? undefined
          : odometerDaysAgo(vehicle.odometer, milesPerYearFor(getAnswers()), daysAgo),
    });
  }
  setAnswers({ service: type });
}

function walkTheQuiz() {
  answerVehicle("2019 Honda Civic", 2019);
  setOdometerReading(getOnboardingVehicleId()!, 84210);
  setAnswers({ drive: "high" });
  answerService("Oil Change", 400);
  setAnswers({ tracking: "memory" });
  setAnswers({ worries: ["bills", "resale"] });
}

beforeEach(() => {
  resetOnboarding();
});

test("the quiz produces a plan built from the answers, not from defaults", () => {
  walkTheQuiz();
  const { vehicle, vehicleName, plan, answers, cards } = readFindings();

  expect(vehicle?.odometer).toBe(84210);
  expect(vehicleName).toBe("2019 Honda Civic");
  expect(answers).toEqual({
    drive: "high",
    tracking: "memory",
    worries: ["bills", "resale"],
    service: "Oil Change",
  });

  expect(plan.milesPerYear).toBe(MILES_PER_YEAR.high);
  expect(plan.projectedOdometer).toBe(84210 + MILES_PER_YEAR.high);
  // One service logged, and it was logged more than a year ago against a
  // 5,000-mile interval, so it is the overdue one.
  expect(plan.logged).toBe(1);
  expect(plan.items[0]).toMatchObject({ type: "Oil Change", status: "due", logged: true });
  expect(cards).toHaveLength(3);
  expect(cards[0].id).toBe("overdue");
  expect(cards[0].body).toContain("2019 Honda Civic");
});

test("stepping back and correcting an answer edits the car instead of adding one", () => {
  walkTheQuiz();
  const first = getOnboardingVehicleId();

  answerVehicle("2018 Honda Civic", 2018);
  answerService("Oil Change", 5);

  expect(getOnboardingVehicleId()).toBe(first);
  const after = readFindings();
  expect(after.vehicleName).toBe("2018 Honda Civic");
  expect(after.vehicle?.odometer).toBe(84210);
  // The corrected answer replaced the record rather than stacking a second one.
  expect(listRecords(first!).filter((r) => r.service_type === "Oil Change")).toHaveLength(1);
  expect(after.plan.items.find((i) => i.type === "Oil Change")?.status).toBe("ok");
});

test("a changed attitude answer does not blank the ones around it", () => {
  walkTheQuiz();
  setAnswers({ tracking: "spreadsheet" });
  expect(getAnswers()).toEqual({
    drive: "high",
    tracking: "spreadsheet",
    worries: ["bills", "resale"],
    service: "Oil Change",
  });
});

test("a replay starts from nothing and does not inherit the last run's car", () => {
  walkTheQuiz();
  resetOnboarding();

  expect(getOnboardingVehicleId()).toBeNull();
  expect(getAnswers()).toEqual({});

  const { vehicle, vehicleName, plan, cards } = readFindings();
  expect(vehicle).toBeNull();
  expect(vehicleName).toBe("car");
  // No car, no history: every interval is unproven and the flow still has
  // three true things to say.
  expect(plan.logged).toBe(0);
  expect(plan.dueNow).toBe(plan.items.length);
  expect(cards).toHaveLength(3);
});

test("a vehicle deleted between launches leaves the findings screens standing", () => {
  walkTheQuiz();
  const { getDb } = jest.requireMock("../src/db/client") as { getDb: () => { runSync: (sql: string, p?: unknown[]) => void } };
  getDb().runSync("UPDATE vehicles SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    getOnboardingVehicleId(),
  ]);

  const { vehicle, plan } = readFindings();
  expect(vehicle).toBeNull();
  expect(plan.odometer).toBeUndefined();
  expect(plan.items.every((i) => !i.logged)).toBe(true);
});

test("a mistyped odometer can be corrected downwards", () => {
  walkTheQuiz();
  // The high-water guard belongs on mileage that arrives attached to a service.
  // This field is the dash reading itself, and stepping back to fix an extra
  // digit has to actually change it.
  setOdometerReading(getOnboardingVehicleId()!, 8421);
  expect(readFindings().vehicle?.odometer).toBe(8421);
});

test("changing which service was logged does not leave the first one behind", () => {
  walkTheQuiz();
  answerService("Air Filter", 30);

  const records = listRecords(getOnboardingVehicleId()!);
  expect(records.map((r) => r.service_type)).toEqual(["Air Filter"]);
  const { plan } = readFindings();
  expect(plan.logged).toBe(1);
  expect(plan.items.find((i) => i.type === "Oil Change")?.logged).toBe(false);
});

test("answering \"not sure\" takes back a date already given", () => {
  walkTheQuiz();
  answerService("Oil Change", null);

  expect(listRecords(getOnboardingVehicleId()!)).toHaveLength(0);
  expect(readFindings().plan.logged).toBe(0);
});

test("a service is filed at the mileage the car was showing when it happened", () => {
  answerVehicle("2019 Honda Civic", 2019);
  setOdometerReading(getOnboardingVehicleId()!, 84210);
  setAnswers({ drive: "high" });
  answerService("Oil Change", 180);

  // 12,500 mi a year for half a year is ~6,164 miles ago, so the oil change
  // was done around 78,046 and the next one falls due 5,000 miles after that,
  // which is behind today's reading. Filing it at 84,210 instead claimed the
  // car had not moved since and put the next change 5,000 miles from today.
  const back = odometerDaysAgo(84210, MILES_PER_YEAR.high, 180);
  expect(back).toBe(78046);
  const [record] = listRecords(getOnboardingVehicleId()!);
  expect(record.odometer).toBe(back);
  // Noon local, the same as every other date this app writes.
  expect(new Date(record.performed_at).getHours()).toBe(12);

  const oil = readFindings().plan.items.find((i) => i.type === "Oil Change")!;
  expect(oil.dueOdometer).toBe(back + 5000);
  expect(oil.status).toBe("due");
});
