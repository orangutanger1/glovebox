import { lifeLeft, moodFor } from "../src/mascot/mood";
import {
  garageMood,
  heroFigure,
  nextFor,
  planCompleteness,
  roadFor,
  roads,
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

describe("Today's one figure", () => {
  test("an overdue-by-distance service shows how far over", () => {
    const v = view(car("a", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    const fig = heroFigure([v], { a: 48210 });
    expect(fig?.kind).toBe("over");
    expect(fig?.type).toBe("Oil Change");
    if (fig?.kind === "over") expect(fig.overBy).toBe(v.next?.overBy);
  });

  test("a car with no odometer shows a date", () => {
    const v = view(car("a"), [rec("Oil Change", "2026-09-01T00:00:00.000Z")]);
    const fig = heroFigure([v], { a: undefined });
    expect(fig?.kind).toBe("date");
  });

  test("the most urgent car wins across cars, and is named", () => {
    const ok = view(car("a", 1000), [rec("Oil Change", "2026-10-01T00:00:00.000Z", 900)]);
    const late = view(car("b", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    const fig = heroFigure([ok, late], { a: 1000, b: 48210 });
    expect(fig?.vehicleId).toBe("b");
    expect(fig?.vehicleName).toBe("Car b");
  });

  test("a distance-only interval with a reading shows distance left", () => {
    const v = view(car("a", 48210), [rec("Spark Plugs", "2026-03-16T00:00:00.000Z", 41000)]);
    const fig = heroFigure([v], { a: 48210 });
    expect(fig).toMatchObject({ kind: "distance", left: 41000 + 60000 - 48210 });
  });

  test("nothing logged, no figure", () => {
    expect(heroFigure([view(car("a"), [])], { a: undefined })).toBeNull();
  });
});

describe("the road", () => {
  test("overdue services are behind the car, the rest ahead in due order", () => {
    const v = view(car("a", 48210), [
      rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000),
      rec("Tire Rotation", "2026-08-01T00:00:00.000Z", 45000),
      rec("Brake Inspection", "2026-04-27T00:00:00.000Z", 44000),
    ]);
    const r = roadFor(v);
    expect(r.behind.map((s) => s.type)).toContain("Oil Change");
    expect(r.ahead.length).toBeGreaterThan(0);
    expect(r.ahead.every((s) => s.status !== "due")).toBe(true);
    const order = r.ahead.map((s) => s.type);
    expect([...r.ahead].sort((a, b) => (a.dueAt ?? "~").localeCompare(b.dueAt ?? "~")).map((s) => s.type)).toEqual(order);
    expect(r.odometer).toBe(48210);
  });

  test("at most six signs ahead", () => {
    const many = ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter", "Cabin Air Filter", "Wiper Blades", "Battery Check", "Coolant Flush"]
      .map((type) => rec(type, "2026-10-01T00:00:00.000Z", 48000));
    expect(roadFor(view(car("a", 48210), many)).ahead.length).toBe(6);
  });

  test("no odometer, no reading on the road; stops by date", () => {
    const r = roadFor(view(car("a"), [
      rec("Oil Change", "2026-09-01T00:00:00.000Z"),
      rec("Wiper Blades", "2026-02-01T00:00:00.000Z"),
    ]));
    expect(r.odometer).toBeUndefined();
    expect(r.ahead.map((s) => s.type)).toEqual(["Oil Change", "Wiper Blades"].sort((a, b) =>
      (r.ahead.find((s) => s.type === a)!.dueAt!).localeCompare(r.ahead.find((s) => s.type === b)!.dueAt!)));
  });

  test("most urgent car first; cars with nothing tracked are left off", () => {
    const fine = view(car("a", 1000), [rec("Oil Change", "2026-10-01T00:00:00.000Z", 900)]);
    const late = view(car("b", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    const empty = view(car("c"), []);
    expect(roads([fine, late, empty]).map((r) => r.vehicleId)).toEqual(["b", "a"]);
  });
});

describe("the logged moment's next", () => {
  test("after a log, next is the fresh due point", () => {
    const v = view(car("a", 48210), [rec("Oil Change", "2026-10-12T00:00:00.000Z", 48210)]);
    const n = nextFor(v, "Oil Change");
    expect(n).toEqual({ dueOdometer: 53210, dueAt: expect.any(String) });
  });

  test("a custom type with no interval has no next", () => {
    const v = view(car("a", 48210), [rec("Timing belt (my own)", "2026-10-12T00:00:00.000Z", 48210)]);
    expect(nextFor(v, "Timing belt (my own)")).toBeNull();
  });
});
