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
import { NAME_MAX_LENGTH, ONBOARDING_NAME_KEY, normalizeName } from "../src/onboarding/state";
import {
  getOnboardingName,
  setOnboardingName,
  resetOnboarding,
  tNamed,
} from "../src/onboarding";
import { LANGUAGES, setLanguage, t } from "../src/i18n";

beforeEach(() => {
  getDb().runSync("DELETE FROM app_state", []);
  setLanguage("en");
});

test("a name is trimmed, collapsed and capped before anything can send it", () => {
  expect(normalizeName("  Alex  ")).toBe("Alex");
  expect(normalizeName("Mary   Jane")).toBe("Mary Jane");
  expect(normalizeName("x".repeat(80))).toHaveLength(NAME_MAX_LENGTH);
});

test("whitespace is not a name, and is not stored as one", () => {
  // The screen's Continue is gated on exactly this, so a field holding three
  // spaces has to read as empty rather than as an answer.
  expect(normalizeName("   ")).toBeNull();
  setOnboardingName("   ");
  expect(getOnboardingName()).toBeNull();
});

test("an install from before the name screen existed reads as unnamed", () => {
  // The majority of installs on the day this ships. Every reader has to survive
  // it; none of them may render a greeting with a hole in it.
  expect(getOnboardingName()).toBeNull();
});

test("a replay re-asks about the car and not about the driver", () => {
  setOnboardingName("Alex");
  resetOnboarding();
  // The vehicle and the answers are cleared so the questions can be asked
  // again. Asking a returning user their name a second time is the app
  // forgetting who it is talking to.
  expect(getOnboardingName()).toBe("Alex");
});

test("a stored value written by an older build is normalised on the way out", () => {
  getDb().runSync("INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)", [
    ONBOARDING_NAME_KEY,
    "  Alex ",
  ]);
  expect(getOnboardingName()).toBe("Alex");
});

test("tNamed picks the named sentence only when there is a name to put in it", () => {
  expect(tNamed("offer.paywall.title")).toBe(t("offer.paywall.title"));
  expect(tNamed("offer.paywall.title")).not.toContain("{name}");

  setOnboardingName("Alex");
  const named = tNamed("offer.paywall.title");
  expect(named).toContain("Alex");
  expect(named).not.toBe(t("offer.paywall.title"));
  expect(named).not.toContain("{name}");
});

test("the named reminder keeps every other value the unnamed one carries", () => {
  setOnboardingName("Alex");
  // The vehicle moved to the body when the title started truncating; what the
  // named title still has to carry is the name and the service.
  const title = tNamed("system.notify.title", { service: "Oil Change" });
  expect(title).toContain("Alex");
  expect(title).toContain("Oil Change");
  expect(title).not.toMatch(/\{\w+\}/);
});

test("every language has both halves of every named pair", () => {
  // A catalog with the plain key and no `.named` twin silently prints the key
  // itself into a push notification the moment that user types a name.
  const PAIRS = [
    "offer.paywall.title",
    "offer.trial.title",
    "system.notify.title",
    "system.resume.first.title",
    "system.resume.second.title",
  ];
  for (const language of LANGUAGES) {
    setLanguage(language);
    setOnboardingName("Alex");
    for (const key of PAIRS) {
      const named = tNamed(key, { count: 3, vehicle: "2016 Outback", service: "Oil Change" });
      expect({ language, key, named }).toEqual({
        language,
        key,
        named: expect.stringContaining("Alex"),
      });
      expect(named).not.toContain(`${key}.named`);
    }
  }
});
