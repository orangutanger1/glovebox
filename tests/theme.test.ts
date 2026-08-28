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

import { LIGHT, DARK, type Palette } from "../src/design/palette";
import { getThemeMode, setThemeMode } from "../src/design/themeState";

describe("the palettes", () => {
  test("define exactly the same roles", () => {
    expect(Object.keys(LIGHT).sort()).toEqual(Object.keys(DARK).sort());
  });

  test("share no colour value between themes except by intent", () => {
    // A role that is identical in both themes is a role that was not thought
    // about. The two allowed exceptions are numeric/enum, not colours.
    const shared = (Object.keys(LIGHT) as (keyof Palette)[]).filter(
      (role) => LIGHT[role] === DARK[role]
    );
    expect(shared).toEqual([]);
  });

  test("reserve overdue red and never reuse it as the accent", () => {
    expect(LIGHT.accent).not.toBe(LIGHT.overdue);
    expect(DARK.accent).not.toBe(DARK.overdue);
  });
});

describe("the stored theme mode", () => {
  test("defaults to system before anything is chosen", () => {
    expect(getThemeMode()).toBe("system");
  });

  test("round-trips a choice", () => {
    setThemeMode("dark");
    expect(getThemeMode()).toBe("dark");
    setThemeMode("light");
    expect(getThemeMode()).toBe("light");
  });

  test("falls back to system when the stored value is not a mode", () => {
    const { setState } = require("../src/db/state");
    setState("theme", "sepia");
    expect(getThemeMode()).toBe("system");
  });

  test("a chosen mode is what the next launch reads", () => {
    setThemeMode("dark");
    const { getThemeMode: fresh } = require("../src/design/themeState");
    expect(fresh()).toBe("dark");
  });
});
