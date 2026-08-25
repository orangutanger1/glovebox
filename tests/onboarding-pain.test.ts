import Database from "better-sqlite3";

/**
 * The cards quote formatted distances, and the formatter reads the stored
 * unit, so this import graph reaches `src/db/client` and through it
 * `expo-sqlite` — an ES module this runner cannot parse. The plan built below
 * states its unit; the database is here only to keep the graph resolvable.
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

import { buildPlan } from "../src/onboarding/plan";
import { painCards, PAIN_CARD_COUNT } from "../src/onboarding/pain";
import { setLanguage } from "../src/i18n";
import type { Answers } from "../src/onboarding/state";

// Every headline below is catalog copy, so it is only the copy asserted here
// while English is the language in force.
beforeAll(() => setLanguage("en"));

const INTERVALS = {
  "Oil Change": { months: 6, distance: 5000 },
  "Tire Rotation": { months: 6, distance: 6000 },
  "Brake Inspection": { months: 12, distance: 12000 },
};

const NOW = new Date("2026-08-03T12:00:00");

function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function cardsFor(answers: Answers, records: Parameters<typeof buildPlan>[0]["records"] = []) {
  const plan = buildPlan({
    odometer: 80000,
    records,
    intervals: INTERVALS,
    answers,
    unit: "mi",
    now: NOW,
  });
  return painCards({ plan, answers, vehicleName: "2019 Honda Civic" });
}

test("always exactly three, even from an abandoned quiz", () => {
  expect(cardsFor({})).toHaveLength(PAIN_CARD_COUNT);
  expect(cardsFor({ tracking: "memory", worries: ["bills", "missed", "records", "resale", "upsell"] }))
    .toHaveLength(PAIN_CARD_COUNT);
});

test("an empty worry set is no preference, not an empty screen", () => {
  // The last question no longer blocks on an answer, so this is what the
  // screens after it are handed when somebody taps straight past it.
  const cards = cardsFor({ tracking: "memory", worries: [] });
  expect(cards).toHaveLength(PAIN_CARD_COUNT);
  // What they use today, what has nothing on file, then the fixed tail. Every
  // one of them a fact rather than a worry the user never claimed.
  expect(cards.map((c) => c.id)).toEqual(["memory", "blind", "bills"]);
  for (const card of cards) {
    expect(card.headline.length).toBeGreaterThan(0);
    expect(card.body.length).toBeGreaterThan(0);
    expect(card.fix.length).toBeGreaterThan(0);
  }
});

test("never repeats a finding", () => {
  const ids = cardsFor({ tracking: "receipts", worries: ["records", "bills"] }).map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("the same answers always produce the same three cards", () => {
  const answers: Answers = { tracking: "dealer", worries: ["upsell"] };
  expect(cardsFor(answers).map((c) => c.id)).toEqual(cardsFor(answers).map((c) => c.id));
});

test("what the user said they use today gets its own card", () => {
  expect(cardsFor({ tracking: "spreadsheet" }).map((c) => c.id)).toContain("spreadsheet");
  expect(cardsFor({ tracking: "dealer" }).map((c) => c.id)).toContain("dealer");
});

test("an overdue count leads, and counts only services with history", () => {
  const cards = cardsFor({ tracking: "memory" }, [
    { service_type: "Oil Change", performed_at: daysAgo(400), odometer: 70000 },
  ]);
  expect(cards[0].id).toBe("overdue");
  // Two other services have never been logged; they are the "blind" card, not
  // part of the overdue count.
  expect(cards[0].headline).toBe("One service is already overdue");
});

test("with no history there is nothing to call overdue", () => {
  const ids = cardsFor({ tracking: "memory" }).map((c) => c.id);
  expect(ids).not.toContain("overdue");
  expect(ids).toContain("blind");
});

test("the blind card counts what has nothing on file", () => {
  const card = cardsFor({}).find((c) => c.id === "blind")!;
  expect(card.headline).toBe("3 of 3 services have nothing on file");
});

test("every card carries the answer to itself", () => {
  for (const card of cardsFor({ tracking: "nothing", worries: ["resale"] })) {
    expect(card.fix.length).toBeGreaterThan(0);
    expect(card.legend.length).toBeGreaterThan(0);
  }
});
