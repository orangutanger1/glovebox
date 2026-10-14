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

test("the registry holds the design test", () => {
  expect(EXPERIMENTS).toEqual({
    app_design: ["classic", "redesign"],
  });
});

test("a fresh install is assigned once, persisted, and never re-flipped", () => {
  expect(assignExperiments(true, () => 0.99)).toEqual({
    app_design: "redesign",
  });
  expect(getVariant("app_design")).toBe("redesign");
  expect(tracked).toEqual([
    { event: "experiment_assigned", props: { experiment: "app_design", variant: "redesign" } },
  ]);
  expect(assignExperiments(true, () => 0)).toEqual({});
  expect(getVariant("app_design")).toBe("redesign");
  expect(experimentProperties()).toEqual({
    exp_app_design: "redesign",
  });
});

test("an ineligible install is left alone and reports unassigned", () => {
  expect(assignExperiments(false)).toEqual({});
  expect(getVariant("app_design")).toBeNull();
  expect(experimentProperties()).toEqual({
    exp_app_design: "unassigned",
  });
  expect(tracked).toHaveLength(0);
});

test("rows from ended experiments are kept and not reported", () => {
  // The row is the record of what the install was shown; a later build never
  // rewrites it, and nothing reads it once its experiment is gone.
  setState("experiment.onboarding_symptoms", "no_symptoms");
  setState("experiment.exit_offer_plans", "with_monthly");
  assignExperiments(true, () => 0);
  expect(getState("experiment.onboarding_symptoms")).toBe("no_symptoms");
  expect(getState("experiment.exit_offer_plans")).toBe("with_monthly");
  expect(getVariant("onboarding_symptoms" as never)).toBeNull();
  expect(getVariant("exit_offer_plans" as never)).toBeNull();
  expect(experimentProperties()).toEqual({ exp_app_design: "classic" });
});

test("a stored value outside the variant list reads as unassigned and is not overwritten", () => {
  setState("experiment.app_design", "weekly");
  expect(getVariant("app_design")).toBeNull();
  expect(assignExperiments(true, () => 0)).toEqual({});
  expect(getState("experiment.app_design")).toBe("weekly");
});

test("properties never throw when the database is unavailable", () => {
  const client = jest.requireMock("../src/db/client") as { getDb: () => unknown };
  const real = client.getDb;
  client.getDb = () => {
    throw new Error("no database");
  };
  try {
    expect(experimentProperties()).toEqual({
      exp_app_design: "unassigned",
    });
    expect(getVariant("app_design")).toBeNull();
  } finally {
    client.getDb = real;
  }
});

test("the design arm the experiment writes is the one the screens read", () => {
  const { isRedesign, resetDesignCache, DESIGN_KEY } = require("../src/design/theme");
  expect(DESIGN_KEY).toBe("experiment.app_design");

  // Before assignment (the first frame of a fresh install, and every install
  // from before the test): classic, and not cached.
  resetDesignCache();
  expect(isRedesign()).toBe(false);

  assignExperiments(true, () => 0.99);
  expect(getVariant("app_design")).toBe("redesign");
  expect(isRedesign()).toBe(true);

  // Cached once known: the row never changes, and buttons read it per render.
  setState("experiment.app_design", "classic");
  expect(isRedesign()).toBe(true);
  resetDesignCache();
  expect(isRedesign()).toBe(false);
  resetDesignCache();
});

test("store builds have no pinned design arm", () => {
  // `redesign-check` in eas.json pins arm A for device checks; production must not.
  const eas = require("../eas.json");
  expect(eas.build.production.env?.EXPO_PUBLIC_APP_DESIGN).toBeUndefined();
  expect(eas.build["redesign-check"].env.EXPO_PUBLIC_APP_DESIGN).toBe("redesign");
  // `design-v2-check` pins arm A plus its second look; production never does.
  expect(eas.build.production.env?.EXPO_PUBLIC_DESIGN_V2).toBeUndefined();
  expect(eas.build["design-v2-check"].env).toEqual({ EXPO_PUBLIC_APP_DESIGN: "redesign", EXPO_PUBLIC_DESIGN_V2: "1" });
});
