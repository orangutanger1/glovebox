jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
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

import { BODY_STYLES, isBodyStyle } from "../src/vehicles/bodyStyles";
import { createVehicle, getVehicle, setBodyStyle } from "../src/db/vehicles";

test("there are exactly seven body styles and they are the ones the art covers", () => {
  expect(BODY_STYLES).toEqual([
    "sedan", "hatchback", "coupe", "wagon", "suv", "pickup", "van",
  ]);
});

test("rejects a value that is not a body style", () => {
  expect(isBodyStyle("sedan")).toBe(true);
  expect(isBodyStyle("spaceship")).toBe(false);
});

test("a vehicle created without a body style has none", () => {
  const v = createVehicle({ name: "2016 Civic" });
  expect(getVehicle(v.id)?.body_style).toBeUndefined();
});

test("a body style survives a write and a read", () => {
  const v = createVehicle({ name: "2023 F-150" });
  setBodyStyle(v.id, "pickup");
  expect(getVehicle(v.id)?.body_style).toBe("pickup");
});

test("a body style given at creation is stored", () => {
  const v = createVehicle({ name: "2025 Model S", body_style: "sedan" });
  expect(getVehicle(v.id)?.body_style).toBe("sedan");
});
