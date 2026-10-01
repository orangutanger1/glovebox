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

test("the registry holds the exit-offer test", () => {
  expect(EXPERIMENTS).toEqual({ exit_offer_plans: ["yearly", "with_monthly"] });
});

test("a fresh install is assigned once, persisted, and never re-flipped", () => {
  expect(assignExperiments(true, () => 0.99)).toEqual({ exit_offer_plans: "with_monthly" });
  expect(getVariant("exit_offer_plans")).toBe("with_monthly");
  expect(tracked).toEqual([
    { event: "experiment_assigned", props: { experiment: "exit_offer_plans", variant: "with_monthly" } },
  ]);
  expect(assignExperiments(true, () => 0)).toEqual({});
  expect(getVariant("exit_offer_plans")).toBe("with_monthly");
  expect(experimentProperties()).toEqual({ exp_exit_offer_plans: "with_monthly" });
});

test("an ineligible install is left alone and reports unassigned", () => {
  expect(assignExperiments(false)).toEqual({});
  expect(getVariant("exit_offer_plans")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_exit_offer_plans: "unassigned" });
  expect(tracked).toHaveLength(0);
});

test("rows from ended experiments are kept and not reported", () => {
  // The row is the record of what the install was shown; a later build never
  // rewrites it, and nothing reads it once its experiment is gone.
  setState("experiment.onboarding_symptoms", "no_symptoms");
  assignExperiments(true, () => 0);
  expect(getState("experiment.onboarding_symptoms")).toBe("no_symptoms");
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_exit_offer_plans: "yearly" });
});

test("a stored value outside the variant list reads as unassigned and is not overwritten", () => {
  setState("experiment.exit_offer_plans", "weekly");
  expect(getVariant("exit_offer_plans")).toBeNull();
  expect(assignExperiments(true, () => 0)).toEqual({});
  expect(getState("experiment.exit_offer_plans")).toBe("weekly");
});

test("properties never throw when the database is unavailable", () => {
  const client = jest.requireMock("../src/db/client") as { getDb: () => unknown };
  const real = client.getDb;
  client.getDb = () => {
    throw new Error("no database");
  };
  try {
    expect(experimentProperties()).toEqual({ exp_exit_offer_plans: "unassigned" });
    expect(getVariant("exit_offer_plans")).toBeNull();
  } finally {
    client.getDb = real;
  }
});
