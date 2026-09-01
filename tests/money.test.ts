import Database from "better-sqlite3";

/** Same in-memory database the other logic tests stand up: `src/money` reads
 *  `app_state` through `src/db/client`, which pulls in `expo-sqlite`. */
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

import {
  defaultCurrencyFor,
  formatMoney,
  getCurrency,
  initCurrency,
  resetCurrency,
  resetMoneyFormats,
  setCurrency,
} from "../src/money";
import { setLanguage } from "../src/i18n";
import { getState } from "../src/db/state";

afterEach(() => {
  setLanguage("en");
  resetCurrency();
  resetMoneyFormats();
});

describe("the currency default", () => {
  test("follows the region, not the language", () => {
    expect(defaultCurrencyFor("DE")).toBe("EUR");
    expect(defaultCurrencyFor("AT")).toBe("EUR");
    expect(defaultCurrencyFor("CH")).toBe("CHF");
    expect(defaultCurrencyFor("GB")).toBe("GBP");
    expect(defaultCurrencyFor("BR")).toBe("BRL");
  });

  test("an unknown or absent region is USD rather than a guess", () => {
    expect(defaultCurrencyFor(null)).toBe("USD");
    expect(defaultCurrencyFor("ZZ")).toBe("USD");
  });

  test("region matching is case insensitive", () => {
    expect(defaultCurrencyFor("gb")).toBe("GBP");
  });
});

describe("the stored currency", () => {
  test("an install from before this setting reads as USD", () => {
    // Every build before src/money rendered `$${cost}` in every language, so a
    // missing row means dollars were on the glass. Inferring from the region
    // here would relabel those numbers on first launch abroad.
    resetCurrency();
    expect(getState("currency")).toBeNull();
    expect(getCurrency()).toBe("USD");
  });

  test("a written choice survives, and initCurrency does not overwrite it", () => {
    setCurrency("SEK");
    resetCurrency();
    expect(initCurrency()).toBe("SEK");
  });
});

describe("formatMoney", () => {
  test("symbol and separators follow the language, the currency follows the setting", () => {
    setCurrency("EUR");
    setLanguage("de");
    // German puts the symbol after the number; English would put it before.
    expect(formatMoney(1240)).toMatch(/1\.240/);
    expect(formatMoney(1240)).toMatch(/€/);
  });

  test("no minor units: a log records what a job cost, not an invoice", () => {
    setCurrency("USD");
    expect(formatMoney(1240)).not.toMatch(/\.00/);
  });

  test("rounds rather than truncating", () => {
    setCurrency("USD");
    expect(formatMoney(45.5)).toMatch(/46/);
  });

  test("an unknown currency code degrades to a grouped number plus the code", () => {
    // Hermes ships a reduced ICU; a total that reads "1,240 XYZ" beats one
    // that throws on a screen made of totals.
    expect(formatMoney(1240, "NOT_A_CODE")).toBe("1,240 NOT_A_CODE");
  });

  test("zero formats rather than falling through to a blank", () => {
    setCurrency("USD");
    expect(formatMoney(0)).toMatch(/0/);
  });
});
