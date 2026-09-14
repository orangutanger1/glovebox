import { selectReminders, triggerTime, MAX_SCHEDULED, type Reminder } from "../src/notify/select";

const NOW = new Date("2026-08-02T12:00:00.000Z").getTime();

function reminder(daysFromNow: number, serviceType = "Oil Change"): Reminder {
  return {
    vehicleName: "Civic",
    serviceType,
    dueAt: new Date(NOW + daysFromNow * 86400000).toISOString(),
    lastPerformedAt: "2026-01-15T17:00:00.000Z",
  };
}

test("drops reminders whose due date has already passed", () => {
  const kept = selectReminders([reminder(-30), reminder(10)], NOW);
  expect(kept).toHaveLength(1);
  expect(kept[0].dueAt).toBe(reminder(10).dueAt);
});

test("orders soonest first", () => {
  const kept = selectReminders([reminder(90), reminder(5), reminder(30)], NOW);
  expect(kept.map((r) => r.dueAt)).toEqual([reminder(5).dueAt, reminder(30).dueAt, reminder(90).dueAt]);
});

test("keeps everything when under the cap", () => {
  const candidates = Array.from({ length: 10 }, (_, i) => reminder(i + 1));
  expect(selectReminders(candidates, NOW)).toHaveLength(10);
});

test("keeps everything at exactly the cap", () => {
  const candidates = Array.from({ length: MAX_SCHEDULED }, (_, i) => reminder(i + 1));
  expect(selectReminders(candidates, NOW)).toHaveLength(MAX_SCHEDULED);
});

test("over the cap, keeps the soonest and drops the rest", () => {
  // Built furthest-first so a cap applied before sorting would keep the wrong
  // ones — which is the failure mode iOS produced on its own.
  const candidates = Array.from({ length: MAX_SCHEDULED + 25 }, (_, i) =>
    reminder(MAX_SCHEDULED + 25 - i)
  );
  const kept = selectReminders(candidates, NOW);

  expect(kept).toHaveLength(MAX_SCHEDULED);
  expect(kept[0].dueAt).toBe(reminder(1).dueAt);
  expect(kept[MAX_SCHEDULED - 1].dueAt).toBe(reminder(MAX_SCHEDULED).dueAt);
});

test("stays under the iOS limit of 64 pending notifications", () => {
  expect(MAX_SCHEDULED).toBeLessThan(64);
});

describe("triggerTime", () => {
  test("reads the calendar components iOS hands back for a date trigger", () => {
    // What `getAllScheduledNotificationsAsync` returns on iOS for a reminder
    // scheduled as `{ type: "date", date }`: the SDK converts it to calendar
    // components on the way in and serialises those on the way out. There is
    // no `date` field on the round trip.
    const at = triggerTime({
      type: "calendar",
      repeats: false,
      dateComponents: {
        calendar: "gregorian",
        timeZone: null,
        isLeapMonth: false,
        year: 2027,
        month: 3,
        day: 14,
        hour: 9,
        minute: 0,
        second: 0,
      },
    });
    expect(at).toBe(new Date(2027, 2, 14, 9, 0, 0, 0).getTime());
  });

  test("still reads a plain date, and refuses a trigger with no single time", () => {
    const when = new Date("2027-03-14T13:00:00.000Z");
    expect(triggerTime({ type: "date", date: when.getTime() })).toBe(when.getTime());
    expect(triggerTime({ type: "date", date: when.toISOString() })).toBe(when.getTime());
    expect(triggerTime({ type: "timeInterval", seconds: 60 })).toBeUndefined();
    expect(triggerTime({ type: "calendar", dateComponents: { hour: 9, minute: 0 } })).toBeUndefined();
    expect(triggerTime(null)).toBeUndefined();
  });
});
