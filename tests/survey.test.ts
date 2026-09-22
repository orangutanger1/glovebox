// The same in-memory app_state the other logic tests use.
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

const setAttributes = jest.fn();
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: { setAttributes: (a: unknown) => setAttributes(a) },
}));

import {
  getSource,
  recordObjection,
  recordSource,
  shouldAskObjection,
  sourceProperties,
} from "../src/survey";
import { getDb } from "../src/db/client";
import { setState } from "../src/db/state";

beforeEach(() => {
  tracked.length = 0;
  setAttributes.mockReset();
  getDb().runSync("DELETE FROM app_state", []);
});

test("an unanswered install reports heard_from as unanswered", () => {
  expect(getSource()).toBeNull();
  expect(sourceProperties()).toEqual({ heard_from: "unanswered" });
});

test("the source answer is stored, reported, set on the person and on RevenueCat", () => {
  recordSource("tiktok");
  expect(getSource()).toBe("tiktok");
  expect(sourceProperties()).toEqual({ heard_from: "tiktok" });
  expect(tracked).toEqual([
    { event: "source_answered", props: { source: "tiktok", $set: { heard_from: "tiktok" } } },
  ]);
  expect(setAttributes).toHaveBeenCalledWith({ heard_from: "tiktok" });
});

test("a stored value this build does not know reads as unanswered", () => {
  setState("survey.source", "myspace");
  expect(getSource()).toBeNull();
  expect(sourceProperties()).toEqual({ heard_from: "unanswered" });
});

test("a RevenueCat failure does not stop the answer being recorded", () => {
  setAttributes.mockImplementation(() => {
    throw new Error("not configured");
  });
  expect(() => recordSource("friend")).not.toThrow();
  expect(getSource()).toBe("friend");
});

test("the objection is asked once, and a skip spends the ask", () => {
  expect(shouldAskObjection()).toBe(true);
  recordObjection(null, "sheet_cancelled", "discount");
  expect(shouldAskObjection()).toBe(false);
  expect(tracked).toEqual([
    {
      event: "paywall_objection",
      props: { reason: "skipped", trigger: "sheet_cancelled", offering: "discount" },
    },
  ]);
});

test("an answered objection is reported with its trigger", () => {
  recordObjection("try_first", "declined", "discount");
  expect(tracked[0]).toEqual({
    event: "paywall_objection",
    props: { reason: "try_first", trigger: "declined", offering: "discount" },
  });
});
