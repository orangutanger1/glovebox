import { lifeLeft, moodFor } from "../src/mascot/mood";
import {
  garageMood,
  planCompleteness,
  todayTasks,
  upcomingItems,
  vehicleView,
} from "../src/redesign/model";
import { defaultIntervals } from "../src/schedule";
import type { Vehicle } from "../src/db/vehicles";
import type { ServiceRecord } from "../src/db/records";

const NOW = "2026-10-12T16:00:00.000Z";
const intervals = defaultIntervals("mi", 12);

function car(id: string, odometer?: number): Vehicle {
  return { id, name: `Car ${id}`, odometer, created_at: NOW } as Vehicle;
}

function rec(type: string, performed_at: string, odometer?: number, extra: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: `${type}:${performed_at}`,
    vehicle_id: "a",
    service_type: type,
    performed_at,
    odometer,
    ...extra,
  } as ServiceRecord;
}

function view(vehicle: Vehicle, records: ServiceRecord[]) {
  return vehicleView({ vehicle, records, intervals, unit: "mi", now: NOW });
}

describe("the mascot's mood", () => {
  test("follows the worst status, and sleeps with nothing logged", () => {
    expect(moodFor({ logged: 0, statuses: [] })).toBe("sleepy");
    expect(moodFor({ logged: 3, statuses: ["ok", "ok"] })).toBe("happy");
    expect(moodFor({ logged: 3, statuses: ["ok", "soon"] })).toBe("heads-up");
    expect(moodFor({ logged: 3, statuses: ["soon", "due", "ok"] })).toBe("worried");
  });

  test("logged records with no tracked interval are happy, not sleepy", () => {
    expect(moodFor({ logged: 1, statuses: [] })).toBe("happy");
  });

  test("the garage takes its worst car's mood", () => {
    const fine = view(car("a", 10_000), [rec("Oil Change", "2026-09-01T12:00:00.000Z", 9_500)]);
    const late = view(car("b", 20_000), [rec("Oil Change", "2025-01-01T12:00:00.000Z", 10_000)]);
    expect(fine.mood).toBe("happy");
    expect(late.mood).toBe("worried");
    expect(garageMood([fine, late])).toBe("worried");
    expect(garageMood([])).toBe("sleepy");
  });

  test("worn tread alone is enough to worry", () => {
    const v = view(car("a", 10_000), [
      rec("Tire Rotation", "2026-10-01T12:00:00.000Z", 9_900, { tread_mm: 1.2 } as Partial<ServiceRecord>),
    ]);
    expect(v.tread?.status).toBe("due");
    expect(v.mood).toBe("worried");
  });
});

describe("interval left", () => {
  test("whichever of months and distance runs out first", () => {
    // 3 of 6 months gone, but 4,000 of 5,000 miles: distance wins at 20%.
    const left = lifeLeft({
      lastPerformedAt: "2026-07-12T12:00:00.000Z",
      lastOdometer: 10_000,
      months: 6,
      distance: 5_000,
      odometer: 14_000,
      now: NOW,
    });
    expect(left).toBeCloseTo(0.2, 1);
  });

  test("is clamped and null when there is nothing to measure", () => {
    expect(lifeLeft({ lastPerformedAt: "2020-01-01T12:00:00.000Z", months: 6, now: NOW })).toBe(0);
    expect(lifeLeft({ lastPerformedAt: NOW, distance: 5_000, now: NOW })).toBeNull();
  });
});

describe("Today and Upcoming", () => {
  test("Today lists due and soon across cars, overdue first; Upcoming the rest by date", () => {
    const a = view(car("a", 30_000), [
      rec("Oil Change", "2025-01-01T12:00:00.000Z", 20_000), // overdue
      rec("Wiper Blades", "2025-10-30T12:00:00.000Z"), // due within 30 days
      rec("Battery Check", "2026-08-01T12:00:00.000Z"), // fine, dated
    ]);
    const b = view(car("b", 5_000), [rec("Air Filter", "2026-06-01T12:00:00.000Z", 4_000)]);

    const today = todayTasks([b, a]);
    expect(today.map((t) => [t.vehicleId, t.type, t.status])).toEqual([
      ["a", "Oil Change", "due"],
      ["a", "Wiper Blades", "soon"],
    ]);

    const upcoming = upcomingItems([a, b]);
    expect(upcoming.map((u) => u.type)).toEqual(["Air Filter", "Battery Check"]);
  });
});

describe("plan completeness", () => {
  test("counts the odometer and the four basis services, and names the first gap", () => {
    expect(planCompleteness({ vehicle: car("a"), records: [] })).toEqual({
      percent: 0,
      gap: { kind: "odometer" },
    });
    expect(
      planCompleteness({
        vehicle: car("a", 1_000),
        records: [rec("Oil Change", NOW), rec("Tire Rotation", NOW)],
      })
    ).toEqual({ percent: 60, gap: { kind: "service", type: "Brake Inspection" } });
    expect(
      planCompleteness({
        vehicle: car("a", 1_000),
        records: ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter"].map((t) => rec(t, NOW)),
      })
    ).toEqual({ percent: 100, gap: null });
  });
});
