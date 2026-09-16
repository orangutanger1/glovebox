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

test("the registry holds one experiment with two variants", () => {
  expect(EXPERIMENTS.onboarding_symptoms).toEqual(["control", "no_symptoms"]);
});

test("a fresh install is assigned once, persisted, and never re-flipped", () => {
  const first = assignExperiments(true, () => 0.99);
  expect(first).toEqual({ onboarding_symptoms: "no_symptoms" });
  expect(getState("experiment.onboarding_symptoms")).toBe("no_symptoms");
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
  expect(tracked).toEqual([
    {
      event: "experiment_assigned",
      props: { experiment: "onboarding_symptoms", variant: "no_symptoms" },
    },
  ]);

  // Same install, next launch, still on welcome: the coin is not tossed again.
  const second = assignExperiments(true, () => 0);
  expect(second).toEqual({});
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
  expect(tracked).toHaveLength(1);
});

test("the flip honours the random source", () => {
  assignExperiments(true, () => 0);
  expect(getVariant("onboarding_symptoms")).toBe("control");
  getDb().runSync("DELETE FROM app_state", []);
  assignExperiments(true, () => 0.5);
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
});

test("an ineligible install is left alone and reports unassigned", () => {
  expect(assignExperiments(false)).toEqual({});
  expect(getState("experiment.onboarding_symptoms")).toBeNull();
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
  expect(tracked).toHaveLength(0);
});

test("properties carry the stored variant", () => {
  setState("experiment.onboarding_symptoms", "control");
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "control" });
});

test("a stored value outside the variant list reads as unassigned", () => {
  // A variant a later build retired, or a hand-edited row.
  setState("experiment.onboarding_symptoms", "half_symptoms");
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
  // And it is not overwritten: the row is the record of what this install got.
  assignExperiments(true, () => 0);
  expect(getState("experiment.onboarding_symptoms")).toBe("half_symptoms");
  expect(tracked).toHaveLength(0);
});

test("properties never throw when the database is unavailable", () => {
  const client = jest.requireMock("../src/db/client") as { getDb: () => unknown };
  const real = client.getDb;
  client.getDb = () => {
    throw new Error("no database");
  };
  try {
    expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
    expect(getVariant("onboarding_symptoms")).toBeNull();
  } finally {
    client.getDb = real;
  }
});
