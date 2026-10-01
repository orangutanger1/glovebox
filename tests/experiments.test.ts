// The same in-memory app_state the other logic tests use, so the row is
// written and read through the real SQL.
jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

const tracked: { event: string; props?: Record<string, unknown> }[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props?: Record<string, unknown>) => {
    tracked.push({ event, props });
  },
}));

import {
  EXPERIMENTS,
  assignExperiments,
  experimentProperties,
  getVariant,
} from "../src/experiments";
import { getDb } from "../src/db/client";
import { getState, setState } from "../src/db/state";

beforeEach(() => {
  tracked.length = 0;
  getDb().runSync("DELETE FROM app_state", []);
});

// No experiment is running (both onboarding tests ended 2026-10-01). The
// machinery stays for the next one; these pin what it does with none.
test("the registry is empty", () => {
  expect(EXPERIMENTS).toEqual({});
});

test("a fresh install is assigned nothing and tracks nothing", () => {
  expect(assignExperiments(true, () => 0.99)).toEqual({});
  expect(tracked).toHaveLength(0);
  expect(experimentProperties()).toEqual({});
});

test("rows from ended experiments are kept and not reported", () => {
  // The row is the record of what the install was shown; a later build never
  // rewrites it, and nothing reads it once its experiment is gone.
  setState("experiment.onboarding_symptoms", "no_symptoms");
  setState("experiment.onboarding_payoff", "condensed");
  expect(assignExperiments(true, () => 0)).toEqual({});
  expect(getState("experiment.onboarding_symptoms")).toBe("no_symptoms");
  expect(getState("experiment.onboarding_payoff")).toBe("condensed");
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({});
});

test("properties never throw when the database is unavailable", () => {
  const client = jest.requireMock("../src/db/client") as { getDb: () => unknown };
  const real = client.getDb;
  client.getDb = () => {
    throw new Error("no database");
  };
  try {
    expect(experimentProperties()).toEqual({});
    expect(getVariant("onboarding_symptoms")).toBeNull();
  } finally {
    client.getDb = real;
  }
});
