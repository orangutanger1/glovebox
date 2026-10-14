// The explainer takes the unit as an argument, so nothing here reads the
// database; the mock only keeps expo-sqlite out of the Node run.
jest.mock("../src/db/client", () => ({
  getDb: () => {
    throw new Error("no database in this test");
  },
}));
jest.mock("../src/i18n/device", () => ({
  deviceRegion: () => "US",
  deviceLanguageTags: () => ["en-US"],
}));

import { en } from "../src/i18n/catalog/en";
import { CATALOGS } from "../src/i18n/catalog";
import { setLanguage, resetFormatters } from "../src/i18n";
import {
  EXPLAINED,
  difficultyOf,
  explainPath,
  explainStatus,
  hasExplainer,
  intervalLine,
  scheduleLines,
} from "../src/explain";
import { SERVICE_TYPES } from "../src/schedule";
import type { DueState } from "../src/schedule/due";

const NOW = Date.parse("2026-10-13T16:00:00.000Z");

function state(over: Partial<DueState>): DueState {
  return {
    type: "Oil Change",
    status: "ok",
    last: { performed_at: "2026-06-01T16:00:00.000Z" },
    ...over,
  };
}

afterEach(() => {
  setLanguage("en");
  resetFormatters();
});

describe("which services have a card", () => {
  test("every shipped service except Other", () => {
    expect([...EXPLAINED].sort()).toEqual(SERVICE_TYPES.filter((t) => t !== "Other").sort());
    expect(hasExplainer("Other")).toBe(false);
    expect(hasExplainer("Timing belt")).toBe(false);
  });

  test("every card has its three parts in English", () => {
    for (const type of EXPLAINED) {
      for (const part of ["what", "why", "diy"]) {
        expect(en[`explain.${type}.${part}`]).toBeTruthy();
      }
    }
  });

  test("the copy carries no number, so it can't contradict the owner's own interval", () => {
    const withDigits = Object.entries(en)
      .filter(([k]) => /^explain\.[A-Z]/.test(k))
      .filter(([, v]) => typeof v === "string" && /\d/.test(v))
      .map(([k]) => k);
    expect(withDigits).toEqual([]);
  });

  test("paperwork has no DIY tag; the rest do", () => {
    expect(difficultyOf("Registration")).toBeNull();
    expect(difficultyOf("Inspection")).toBeNull();
    expect(difficultyOf("Wiper Blades")).toBe("easy");
    expect(difficultyOf("Coolant Flush")).toBe("shop");
  });

  test("every base catalog translates every card", () => {
    for (const [language, catalog] of Object.entries(CATALOGS)) {
      if (language.includes("-")) continue;
      for (const type of EXPLAINED) {
        expect({ language, key: type, has: Boolean(catalog[`explain.${type}.what`]) }).toEqual({
          language,
          key: type,
          has: true,
        });
      }
    }
  });
});

describe("explainPath", () => {
  test("encodes the type and carries source and vehicle", () => {
    expect(explainPath("Oil Change", "due_row", "v1")).toBe(
      "/explain?type=Oil%20Change&source=due_row&vehicle=v1",
    );
  });

  test("leaves the vehicle out when there is none", () => {
    expect(explainPath("Spark Plugs", "log_form")).toBe("/explain?type=Spark%20Plugs&source=log_form");
  });
});

describe("explainStatus", () => {
  test("maps the due state to the reported status", () => {
    expect(explainStatus(undefined)).toBe("never_logged");
    expect(explainStatus(state({ status: "due" }))).toBe("overdue");
    expect(explainStatus(state({ status: "soon" }))).toBe("due_soon");
    expect(explainStatus(state({ status: "ok" }))).toBe("ok");
  });
});

describe("scheduleLines", () => {
  test("reads the owner's interval in their unit", () => {
    expect(intervalLine({ months: 6, distance: 5000 }, "mi")).toBe("Every 6 months · 5,000 mi");
    expect(intervalLine({ months: 6, distance: 10000 }, "km")).toBe("Every 6 months · 10,000 km");
    expect(intervalLine({ distance: 60000 }, "mi")).toBe("Every 60,000 mi");
    expect(intervalLine({ months: 12 }, "mi")).toBe("Every 12 months");
    expect(intervalLine({}, "mi")).toBeNull();
    expect(intervalLine(undefined, "mi")).toBeNull();
  });

  test("says when nothing is logged", () => {
    expect(scheduleLines({ interval: { months: 12 }, state: undefined, unit: "mi", now: NOW })).toEqual([
      "Every 12 months",
      "Not logged yet",
    ]);
  });

  test("gives the last record and when it's next due", () => {
    const lines = scheduleLines({
      interval: { months: 6, distance: 5000 },
      state: state({
        last: { performed_at: "2026-06-01T16:00:00.000Z", odometer: 41200 },
        dueAt: "2026-12-01T17:00:00.000Z",
      }),
      unit: "mi",
      now: NOW,
    });
    expect(lines[0]).toBe("Every 6 months · 5,000 mi");
    expect(lines[1]).toMatch(/^Last done .+ at 41,200 mi$/);
    expect(lines[2]).toBe("Next due · In 49 days");
  });

  test("says how far over an overdue service is", () => {
    const lines = scheduleLines({
      interval: { months: 6, distance: 5000 },
      state: state({ status: "due", overBy: 800 }),
      unit: "mi",
      now: NOW,
    });
    expect(lines[lines.length - 1]).toBe("Overdue by 800 mi");
  });

  test("falls back to the distance for a mileage-only interval", () => {
    const lines = scheduleLines({
      interval: { distance: 60000 },
      state: state({ dueOdometer: 100000 }),
      unit: "mi",
      now: NOW,
    });
    expect(lines[lines.length - 1]).toBe("Next due at 100,000 mi");
  });
});
