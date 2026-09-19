import Database from "better-sqlite3";

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

import { getDb } from "../src/db/client";
import {
  getDefaultIntervals,
  getIntervals,
  listIntervalOverrides,
  saveInterval,
} from "../src/db/intervals";

beforeEach(() => {
  getDb().runSync("DELETE FROM service_intervals", []);
});

test("a number that differs from the default is stored as an override", () => {
  saveInterval("Oil Change", { months: 6, distance: 7500 });
  expect(listIntervalOverrides()["Oil Change"]).toEqual({ months: 6, distance: 7500 });
  expect(getIntervals()["Oil Change"]).toEqual({ months: 6, distance: 7500 });
});

test("saving the default back is not an override", () => {
  // The editor opens prefilled with the numbers in force, so Save on an
  // untouched form used to write the default under the user's name: the row
  // read "Custom", and a later unit switch converted it (5,000 mi → 8,047 km)
  // where the shipped default would have said 10,000.
  const shipped = getDefaultIntervals()["Oil Change"];
  saveInterval("Oil Change", { ...shipped });
  expect(listIntervalOverrides()["Oil Change"]).toBeUndefined();
});

test("saving the default back clears an override that was there", () => {
  saveInterval("Oil Change", { months: 12, distance: 10000 });
  saveInterval("Oil Change", { ...getDefaultIntervals()["Oil Change"] });
  expect(listIntervalOverrides()["Oil Change"]).toBeUndefined();
});

test("neither figure clears the override, as before", () => {
  saveInterval("Oil Change", { months: 12 });
  saveInterval("Oil Change", {});
  expect(listIntervalOverrides()["Oil Change"]).toBeUndefined();
});

test("a service with no default keeps whatever it is given", () => {
  saveInterval("Timing Belt", { distance: 90000 });
  expect(listIntervalOverrides()["Timing Belt"]).toEqual({ distance: 90000 });
});
