const mockState = new Map<string, string>();
jest.mock("../src/db/state", () => ({
  getState: (k: string) => mockState.get(k) ?? null,
  setState: (k: string, v: string) => void mockState.set(k, v),
}));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (...a: unknown[]) => mockTrack(...a) }));
jest.mock("../src/i18n/device", () => ({ deviceRegion: () => "US" }));

import { matchModel, nhtsaMake, squash, toRecalls } from "../src/recalls/match";
import { cachedRecalls, lookupRecalls } from "../src/recalls";

const CIVIC = { make: "Honda", model: "Civic", year: 2014 };

function mockFetch(routes: Record<string, unknown>) {
  const calls: string[] = [];
  global.fetch = jest.fn(async (url: string) => {
    calls.push(url);
    const hit = Object.entries(routes).find(([k]) => url.includes(k));
    if (!hit) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => hit[1] };
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => {
  mockState.clear();
  mockTrack.mockClear();
});

describe("matching what the owner typed to NHTSA's names", () => {
  test("squashes punctuation, case and spacing", () => {
    expect(squash("F-150")).toBe(squash("f 150"));
  });

  test("maps the makes owners abbreviate", () => {
    expect(nhtsaMake("chevy")).toBe("CHEVROLET");
    expect(nhtsaMake("VW")).toBe("VOLKSWAGEN");
    expect(nhtsaMake("Škoda")).toBe("SKODA");
  });

  test("exact wins, a unique prefix is accepted, ambiguity is no match", () => {
    expect(matchModel("civic", ["CIVIC", "CIVIC HYBRID"])).toBe("CIVIC");
    expect(matchModel("Pilo", ["PILOT", "ACCORD"])).toBe("PILOT");
    expect(matchModel("Silverado", ["SILVERADO 1500", "SILVERADO 2500"])).toBeNull();
    expect(matchModel("Cybertruck", ["CIVIC"])).toBeNull();
    expect(matchModel("", ["CIVIC"])).toBeNull();
  });

  test("one row per campaign, newest first, with a readable component", () => {
    const recalls = toRecalls([
      { NHTSACampaignNumber: "15V574000", Component: "POWER TRAIN:AUTOMATIC TRANSMISSION", Summary: "a", ReportReceivedDate: "15/09/2015" },
      { NHTSACampaignNumber: "19V182000", Component: "AIR BAGS:FRONTAL", Summary: "b", ReportReceivedDate: "08/03/2019", parkIt: true },
      { NHTSACampaignNumber: "15V574000", Component: "POWER TRAIN", Summary: "dupe" },
    ]);
    expect(recalls.map((r) => r.campaign)).toEqual(["19V182000", "15V574000"]);
    expect(recalls[0]).toMatchObject({ component: "Air bags", parkIt: true });
    expect(recalls[1].component).toBe("Power train");
  });
});

describe("lookupRecalls", () => {
  test("asks only about a model NHTSA lists, and caches the answer for a week", async () => {
    const calls = mockFetch({
      "/products/vehicle/models": { results: [{ model: "CIVIC" }, { model: "ACCORD" }] },
      "/recalls/recallsByVehicle": { results: [{ NHTSACampaignNumber: "15V574000", Component: "POWER TRAIN", Summary: "x" }] },
    });
    const result = await lookupRecalls(CIVIC, "US");
    expect(result).toMatchObject({ status: "found", model: "CIVIC" });
    expect(calls[1]).toContain("model=CIVIC");
    expect(calls[1]).toContain("make=HONDA");

    await lookupRecalls(CIVIC, "US");
    expect(calls).toHaveLength(2);
    expect(cachedRecalls(CIVIC)?.fresh).toBe(true);
  });

  test("a model NHTSA does not list says nothing, rather than 'no recalls'", async () => {
    mockFetch({ "/products/vehicle/models": { results: [{ model: "ACCORD" }] } });
    expect(await lookupRecalls({ make: "Honda", model: "Civick", year: 2014 }, "US")).toEqual({ status: "unavailable" });
  });

  test("a listed model with no recalls says so", async () => {
    mockFetch({
      "/products/vehicle/models": { results: [{ model: "CIVIC" }] },
      "/recalls/recallsByVehicle": { results: [] },
    });
    expect(await lookupRecalls(CIVIC, "US")).toEqual({ status: "none", model: "CIVIC" });
  });

  test("outside the US, or without make, model and year, nothing is sent", async () => {
    const calls = mockFetch({});
    expect(await lookupRecalls(CIVIC, "GB")).toEqual({ status: "unavailable" });
    expect(await lookupRecalls({ make: "Honda", year: 2014 }, "US")).toEqual({ status: "unavailable" });
    expect(calls).toHaveLength(0);
  });

  test("a failed lookup falls back to a stale answer, or throws with none", async () => {
    mockFetch({});
    await expect(lookupRecalls(CIVIC, "US")).rejects.toThrow();
    mockState.set("recalls:honda|civic|2014", JSON.stringify({ at: 0, result: { status: "none", model: "CIVIC" } }));
    expect(await lookupRecalls(CIVIC, "US")).toEqual({ status: "none", model: "CIVIC" });
  });
});
