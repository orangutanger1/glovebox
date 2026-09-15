# Vehicle Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A six-tile "Vehicle Health" grid — Overall, Potential, Engine, Brakes & Tires, Electrical & Cabin, Safety & Paperwork — computed from the existing maintenance plan plus a free NHTSA recall count, shown blurred on the onboarding results screen and unblurred on the Pro vehicle screen.

**Architecture:** A pure module `src/health/` turns a `Plan` (from `src/onboarding/plan.ts`) and an optional recall count into `Health`; every number is a fraction of services with a history. `src/health/recalls.ts` is the app's first network call, wrapped so it can only ever return a number or `undefined`, cached in `app_state` for seven days. One design component `HealthGrid` renders both surfaces; `locked` adds two `expo-blur` panes leaving the Overall tile clear.

**Tech Stack:** Expo 57 / React Native 0.86, TypeScript, expo-blur, expo-sqlite `app_state`, Jest (ts-jest `logic` project for `.test.ts`, jest-expo `screens` project for `.test.tsx`).

**Spec:** `docs/superpowers/specs/2026-09-15-vehicle-health-design.md`

## Global Constraints

- No paid third-party data. NHTSA `https://api.nhtsa.gov/recalls/recallsByVehicle` only.
- Tile values: `ok`=1, `soon`=0.5, `due`=0 for logged items; `logged === false` excluded from the score and counted as `unknown`.
- A tile with no scored items has `score === undefined` and never renders `0`.
- Potential ≥ Overall always.
- Bands from Overall: ≥80 excellent, 60–79 good, 40–59 fair, <40 poor, undefined → unknown.
- Bar colours: `tokens.color.green` (excellent/good), `tokens.color.red` (fair/poor), `tokens.color.textMuted` (unknown). No new colour tokens.
- Recall fetch: 4 s timeout, no retries, never throws, `undefined` on any failure. Cache key `health.recalls.<vehicleId>`, value `{"count":n,"at":"<ISO>"}`, 7 days.
- Rendered onboarding copy must contain no en dash (U+2013) or em dash (U+2014): `tests/onboarding-screens.test.tsx` asserts it. Use `·` (U+00B7) as the separator.
- Every catalog in `BASE` (en, de, es, fr, it, ja, ko, nl, pl, ptBR, sv) must define every new key; `tests/i18n.test.ts` enforces parity.
- Run the whole suite with `npx jest`; one project with `npx jest --selectProjects logic` / `screens`.
- Commit after every task with a Conventional Commits subject ≤ 50 chars.

---

### Task 1: The health math — `src/health/index.ts`

**Files:**
- Create: `src/health/index.ts`
- Test: `tests/health.test.ts`

**Interfaces:**
- Consumes: `Plan`, `PlanItem` from `src/onboarding/plan.ts` (`PlanItem = { type: string; status: "due" | "soon" | "ok"; logged: boolean; ... }`), `SERVICE_TYPES` from `src/schedule`.
- Produces:
  ```ts
  export const GROUPS: Record<GroupKey, readonly string[]>;
  export type GroupKey = "engine" | "brakesTires" | "electricalCabin" | "safetyPaperwork";
  export type TileKey = "overall" | "potential" | GroupKey;
  export type HealthTile = { key: TileKey; score?: number; current: number; scored: number; unknown: number; total: number; openRecalls?: number };
  export type Band = "excellent" | "good" | "fair" | "poor" | "unknown";
  export type Health = { tiles: HealthTile[]; band: Band };
  export function buildHealth(plan: Plan, openRecalls?: number): Health;
  export function bandOf(score: number | undefined): Band;
  ```

- [ ] **Step 1: Write the failing tests**

`tests/health.test.ts`:

```ts
import { GROUPS, bandOf, buildHealth, type HealthTile } from "../src/health";
import { SERVICE_TYPES } from "../src/schedule";
import type { Plan, PlanItem } from "../src/onboarding/plan";

const item = (type: string, status: PlanItem["status"], logged = true): PlanItem => ({
  type,
  status,
  logged,
  projected: false,
});

const planOf = (items: PlanItem[]): Plan => ({
  items,
  dueNow: 0,
  pastDue: 0,
  noRecord: 0,
  soon: 0,
  logged: 0,
  unit: "mi",
  distancePerYear: 12000,
});

const tile = (h: ReturnType<typeof buildHealth>, key: HealthTile["key"]) =>
  h.tiles.find((t) => t.key === key)!;

describe("GROUPS", () => {
  test("every tracked service except Other sits in exactly one group", () => {
    const placed = Object.values(GROUPS).flat();
    const expected = SERVICE_TYPES.filter((t) => t !== "Other").sort();
    expect([...placed].sort()).toEqual(expected);
    expect(new Set(placed).size).toBe(placed.length);
  });
});

describe("buildHealth", () => {
  test("tiles come in grid order", () => {
    expect(buildHealth(planOf([])).tiles.map((t) => t.key)).toEqual([
      "overall",
      "potential",
      "engine",
      "brakesTires",
      "electricalCabin",
      "safetyPaperwork",
    ]);
  });

  test("ok, soon and due are worth 1, 0.5 and 0", () => {
    const h = buildHealth(
      planOf([
        item("Oil Change", "ok"),
        item("Air Filter", "soon"),
        item("Spark Plugs", "due"),
        item("Coolant Flush", "ok"),
      ])
    );
    // (1 + 0.5 + 0 + 1) / 4 = 62.5 → 63
    expect(tile(h, "engine")).toEqual({
      key: "engine",
      score: 63,
      current: 2,
      scored: 4,
      unknown: 1, // Transmission Fluid never appeared in the plan
      total: 5,
    });
  });

  test("a service with nothing on file is excluded, not a zero", () => {
    const h = buildHealth(planOf([item("Oil Change", "ok"), item("Air Filter", "due", false)]));
    const engine = tile(h, "engine");
    expect(engine.score).toBe(100);
    expect(engine.scored).toBe(1);
    expect(engine.unknown).toBe(4);
  });

  test("a group that is dropped from the plan still counts as unknown", () => {
    // `buildPlan` omits Inspection in markets with no periodic test; the
    // tile has to say the slot is unknown rather than pretend it is scored.
    const h = buildHealth(planOf([item("Registration", "ok")]));
    expect(tile(h, "safetyPaperwork")).toMatchObject({ score: 100, scored: 1, unknown: 1, total: 2 });
  });

  test("a tile with nothing logged has no score", () => {
    const h = buildHealth(planOf([item("Battery Check", "due", false)]));
    expect(tile(h, "electricalCabin")).toEqual({
      key: "electricalCabin",
      score: undefined,
      current: 0,
      scored: 0,
      unknown: 3,
      total: 3,
    });
    expect(h.band).toBe("unknown");
  });

  test("overall pools every group", () => {
    const h = buildHealth(
      planOf([item("Oil Change", "ok"), item("Tire Rotation", "due"), item("Wiper Blades", "ok")])
    );
    expect(tile(h, "overall")).toMatchObject({ score: 67, current: 2, scored: 3, total: 12 });
  });

  test("potential treats due and soon as done and leaves unlogged out", () => {
    const h = buildHealth(
      planOf([
        item("Oil Change", "due"),
        item("Tire Rotation", "soon"),
        item("Wiper Blades", "ok"),
        item("Battery Check", "due", false),
      ])
    );
    expect(tile(h, "potential")).toMatchObject({ score: 100, current: 3, scored: 3 });
    expect(tile(h, "overall").score).toBe(50);
  });

  test("potential is never below overall", () => {
    const statuses: PlanItem["status"][] = ["ok", "soon", "due"];
    for (const a of statuses)
      for (const b of statuses) {
        const h = buildHealth(planOf([item("Oil Change", a), item("Brake Inspection", b)]));
        expect(tile(h, "potential").score!).toBeGreaterThanOrEqual(tile(h, "overall").score!);
      }
  });

  test("potential equals overall when nothing is due or soon", () => {
    const h = buildHealth(planOf([item("Oil Change", "ok"), item("Registration", "ok")]));
    expect(tile(h, "potential").score).toBe(tile(h, "overall").score);
  });

  test("each open recall is one zero-valued safety item", () => {
    const paperwork = [item("Registration", "ok"), item("Inspection", "ok")];
    expect(tile(buildHealth(planOf(paperwork), 0), "safetyPaperwork")).toMatchObject({
      score: 100,
      scored: 2,
      openRecalls: 0,
    });
    expect(tile(buildHealth(planOf(paperwork), 2), "safetyPaperwork")).toMatchObject({
      score: 50,
      scored: 4,
      openRecalls: 2,
    });
    expect(tile(buildHealth(planOf(paperwork)), "safetyPaperwork")).toMatchObject({
      score: 100,
      openRecalls: undefined,
    });
  });

  test("recalls feed overall and potential too, and potential does not clear them", () => {
    const h = buildHealth(planOf([item("Oil Change", "ok")]), 1);
    expect(tile(h, "overall")).toMatchObject({ score: 50, scored: 2 });
    // A recall is not a service the user can log; doing the due work does
    // not close it, so potential carries it as well.
    expect(tile(h, "potential")).toMatchObject({ score: 50, scored: 2 });
  });
});

describe("bandOf", () => {
  test.each([
    [undefined, "unknown"],
    [0, "poor"],
    [39, "poor"],
    [40, "fair"],
    [59, "fair"],
    [60, "good"],
    [79, "good"],
    [80, "excellent"],
    [100, "excellent"],
  ])("%s → %s", (score, band) => {
    expect(bandOf(score as number | undefined)).toBe(band);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic tests/health.test.ts`
Expected: FAIL — `Cannot find module '../src/health'`.

- [ ] **Step 3: Write the module**

`src/health/index.ts`:

```ts
import type { Plan, PlanItem } from "../onboarding/plan";

/**
 * Vehicle Health: six numbers, each a fraction of services with a history
 * that are current.
 *
 * The app refused to print a score for a long time, on the argument that
 * "your car is 62" is a number nobody can check. The rule here keeps that
 * argument and lifts the refusal: a score is fine when every point of it is
 * attributable. So an item counts 1 when it is current, 0.5 when it is due
 * soon, 0 when it is overdue — and an item the user has never logged is not a
 * 0, it is left out of the fraction and reported beside it as `unknown`. A
 * tile the user has told us nothing about has no score at all.
 *
 * Pure over the plan (and an optional recall count), so the onboarding
 * results screen and the vehicle screen render the same function of the same
 * rows, and tests/health.test.ts runs it in Node.
 */

export type GroupKey = "engine" | "brakesTires" | "electricalCabin" | "safetyPaperwork";
export type TileKey = "overall" | "potential" | GroupKey;

/** Every tracked service type except "Other", each in exactly one group. A
 *  test asserts the partition, so a new service type cannot be added to the
 *  schedule without being placed here. */
export const GROUPS: Record<GroupKey, readonly string[]> = {
  engine: ["Oil Change", "Air Filter", "Spark Plugs", "Coolant Flush", "Transmission Fluid"],
  brakesTires: ["Brake Inspection", "Tire Rotation"],
  electricalCabin: ["Battery Check", "Wiper Blades", "Cabin Air Filter"],
  safetyPaperwork: ["Registration", "Inspection"],
};

const GROUP_ORDER: readonly GroupKey[] = [
  "engine",
  "brakesTires",
  "electricalCabin",
  "safetyPaperwork",
];

export type HealthTile = {
  key: TileKey;
  /** 0–100, or undefined when nothing in the tile has a history. */
  score?: number;
  /** Scored items worth the full point — the "7 of 9 current" caption. */
  current: number;
  /** Items contributing to the score (logged services, plus open recalls). */
  scored: number;
  /** Items with no record — the gap drawn at the end of the bar. */
  unknown: number;
  /** Items the tile tracks, recalls excluded. */
  total: number;
  /** Safety & Paperwork, Overall and Potential only. Undefined when the
   *  lookup did not run or failed. */
  openRecalls?: number;
};

export type Band = "excellent" | "good" | "fair" | "poor" | "unknown";

export type Health = {
  /** In grid order: overall, potential, then the four groups. */
  tiles: HealthTile[];
  /** Of the overall tile. */
  band: Band;
};

const VALUE: Record<PlanItem["status"], number> = { ok: 1, soon: 0.5, due: 0 };

/** The four counts a bar is drawn from, for one set of types. `potential`
 *  values every logged item at 1; `recalls` adds that many zero-valued items. */
function score(
  types: readonly string[],
  byType: Map<string, PlanItem>,
  opts: { potential: boolean; recalls?: number }
): Omit<HealthTile, "key"> {
  let sum = 0;
  let current = 0;
  let scored = 0;
  let unknown = 0;
  for (const type of types) {
    const item = byType.get(type);
    // Absent from the plan (a market with no inspection) or logged false:
    // either way the app has nothing to score it on.
    if (!item || !item.logged) {
      unknown += 1;
      continue;
    }
    const v = opts.potential ? 1 : VALUE[item.status];
    sum += v;
    scored += 1;
    if (v === 1) current += 1;
  }
  // An open recall is a zero the user cannot log their way out of, so it
  // stays a zero under `potential` too.
  if (opts.recalls !== undefined) scored += opts.recalls;

  return {
    score: scored === 0 ? undefined : Math.round((100 * sum) / scored),
    current,
    scored,
    unknown,
    total: types.length,
    openRecalls: opts.recalls,
  };
}

export function bandOf(s: number | undefined): Band {
  if (s === undefined) return "unknown";
  if (s >= 80) return "excellent";
  if (s >= 60) return "good";
  if (s >= 40) return "fair";
  return "poor";
}

export function buildHealth(plan: Plan, openRecalls?: number): Health {
  const byType = new Map<string, PlanItem>();
  for (const item of plan.items) byType.set(item.type, item);
  const all = GROUP_ORDER.flatMap((g) => GROUPS[g]);

  const overall = score(all, byType, { potential: false, recalls: openRecalls });
  const potential = score(all, byType, { potential: true, recalls: openRecalls });

  const tiles: HealthTile[] = [
    { key: "overall", ...overall },
    { key: "potential", ...potential },
    ...GROUP_ORDER.map((g) => ({
      key: g,
      ...score(GROUPS[g], byType, {
        potential: false,
        recalls: g === "safetyPaperwork" ? openRecalls : undefined,
      }),
    })),
  ];

  return { tiles, band: bandOf(overall.score) };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest --selectProjects logic tests/health.test.ts`
Expected: PASS, 15 tests.

If "overall pools every group" fails on `total`, count the types in `GROUPS`: 5 + 2 + 3 + 2 = 12.

- [ ] **Step 5: Commit**

```bash
git add src/health/index.ts tests/health.test.ts
git commit -m "feat(health): score the plan into six attributable tiles"
```

---

### Task 2: Recall lookup with cache — `src/health/recalls.ts`

**Files:**
- Create: `src/health/recalls.ts`
- Test: `tests/health-recalls.test.ts`

**Interfaces:**
- Consumes: `getState(key): string | null`, `setState(key, value): void` from `src/db/state.ts`; `Vehicle` from `src/db/vehicles.ts` (`make?`, `model?`, `year?`).
- Produces:
  ```ts
  export const RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";
  export const RECALL_TIMEOUT_MS = 4000;
  export const RECALL_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
  export function fetchOpenRecalls(input: { make: string; model: string; year: number; signal?: AbortSignal }): Promise<number | undefined>;
  export function cachedRecalls(vehicleId: string, now?: Date): number | undefined;
  export function openRecallsFor(vehicle: { id: string; make?: string; model?: string; year?: number }, now?: Date): Promise<number | undefined>;
  ```

- [ ] **Step 1: Write the failing tests**

`tests/health-recalls.test.ts`:

```ts
import {
  RECALLS_URL,
  RECALL_CACHE_MS,
  cachedRecalls,
  fetchOpenRecalls,
  openRecallsFor,
} from "../src/health/recalls";

// The same in-memory app_state the other logic tests use, so the cache is
// exercised against the real SQL rather than a stub of it.
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

import { getDb } from "../src/db/client";

const realFetch = globalThis.fetch;
let calls: string[] = [];

function answer(body: unknown, status = 200) {
  globalThis.fetch = jest.fn(async (url: string | URL | Request) => {
    calls.push(String(url));
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  calls = [];
  getDb().runSync("DELETE FROM app_state", []);
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const civic = { make: "Honda", model: "Civic", year: 2019 };

describe("fetchOpenRecalls", () => {
  test("returns the count from a good answer", async () => {
    answer({ Count: 3, results: [] });
    await expect(fetchOpenRecalls(civic)).resolves.toBe(3);
    expect(calls[0]).toBe(`${RECALLS_URL}?make=Honda&model=Civic&modelYear=2019`);
  });

  test("trims what the user typed", async () => {
    answer({ Count: 0, results: [] });
    await fetchOpenRecalls({ make: " Honda ", model: "Civic ", year: 2019 });
    expect(calls[0]).toContain("make=Honda&model=Civic");
  });

  test("a non-200 is undefined, not a throw", async () => {
    answer({}, 503);
    await expect(fetchOpenRecalls(civic)).resolves.toBeUndefined();
  });

  test("a network failure is undefined", async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError("Network request failed");
    }) as typeof fetch;
    await expect(fetchOpenRecalls(civic)).resolves.toBeUndefined();
  });

  test("a body without a numeric Count is undefined", async () => {
    answer({ Message: "No results" });
    await expect(fetchOpenRecalls(civic)).resolves.toBeUndefined();
    answer("not json at all");
    await expect(fetchOpenRecalls(civic)).resolves.toBeUndefined();
  });

  test("a body that fails to parse is undefined", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad");
      },
    })) as typeof fetch;
    await expect(fetchOpenRecalls(civic)).resolves.toBeUndefined();
  });

  test("gives up after the timeout", async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
    ) as typeof fetch;
    const pending = fetchOpenRecalls(civic);
    jest.advanceTimersByTime(4001);
    await expect(pending).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});

describe("openRecallsFor", () => {
  const vehicle = { id: "v1", ...civic };

  test("fetches, caches, and reads the cache next time", async () => {
    answer({ Count: 2, results: [] });
    await expect(openRecallsFor(vehicle)).resolves.toBe(2);
    expect(cachedRecalls("v1")).toBe(2);
    await expect(openRecallsFor(vehicle)).resolves.toBe(2);
    expect(calls).toHaveLength(1);
  });

  test("a stale cache is refetched", async () => {
    answer({ Count: 2, results: [] });
    const then = new Date("2026-01-01T00:00:00Z");
    await openRecallsFor(vehicle, then);
    answer({ Count: 5, results: [] });
    const later = new Date(then.getTime() + RECALL_CACHE_MS + 1);
    expect(cachedRecalls("v1", later)).toBeUndefined();
    await expect(openRecallsFor(vehicle, later)).resolves.toBe(5);
  });

  test("a failed fetch is not cached, and does not erase a good one", async () => {
    answer({ Count: 2, results: [] });
    await openRecallsFor(vehicle);
    answer({}, 500);
    const later = new Date(Date.now() + RECALL_CACHE_MS + 1);
    await expect(openRecallsFor(vehicle, later)).resolves.toBeUndefined();
    // The stale entry is still there for a reader that accepts stale.
    expect(cachedRecalls("v1", new Date())).toBe(2);
  });

  test("a car with no make, model or year is never looked up", async () => {
    answer({ Count: 9, results: [] });
    await expect(openRecallsFor({ id: "v2", make: "Honda" })).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic tests/health-recalls.test.ts`
Expected: FAIL — `Cannot find module '../src/health/recalls'`.

- [ ] **Step 3: Write the module**

`src/health/recalls.ts`:

```ts
import { getState, setState } from "../db/state";

/**
 * Open recalls for a year/make/model, from NHTSA.
 *
 * This is the app's first outbound request, and the shape of it is the
 * point: it can only ever resolve to a number or to `undefined`. Nothing on
 * the health grid waits on it, nothing retries it, and every way it can go
 * wrong — no network, a 5xx, a body that is not JSON, a make NHTSA does not
 * recognise, a slow link — is the same `undefined`, which the tile renders as
 * "Recalls not checked". The grid is honest without it and slightly more
 * informed with it.
 *
 * Only year, make and model leave the device, as the user typed them. No
 * identifier, no VIN, no odometer.
 *
 * Cached per vehicle in `app_state` for a week: recalls change rarely, and a
 * vehicle screen that hit a government API on every focus would be the kind
 * of bulk traffic NHTSA asks applications not to send.
 */

export const RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";
export const RECALL_TIMEOUT_MS = 4000;
export const RECALL_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

const cacheKey = (vehicleId: string) => `health.recalls.${vehicleId}`;

export async function fetchOpenRecalls(input: {
  make: string;
  model: string;
  year: number;
  signal?: AbortSignal;
}): Promise<number | undefined> {
  const params = new URLSearchParams({
    make: input.make.trim(),
    model: input.model.trim(),
    modelYear: String(input.year),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECALL_TIMEOUT_MS);
  input.signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(`${RECALLS_URL}?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) return undefined;
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null) return undefined;
    const count = (body as { Count?: unknown }).Count;
    return typeof count === "number" && Number.isFinite(count) && count >= 0 ? count : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** The cached count, if one was written inside the last week. */
export function cachedRecalls(vehicleId: string, now: Date = new Date()): number | undefined {
  const raw = getState(cacheKey(vehicleId));
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { count?: unknown; at?: unknown };
    if (typeof parsed.count !== "number" || typeof parsed.at !== "string") return undefined;
    const age = now.getTime() - new Date(parsed.at).getTime();
    if (!Number.isFinite(age) || age < 0 || age > RECALL_CACHE_MS) return undefined;
    return parsed.count;
  } catch {
    return undefined;
  }
}

/**
 * The count for one vehicle: the cache if it is fresh, otherwise a fetch,
 * written back only on success so a bad day at NHTSA does not erase a good
 * answer from last week.
 */
export async function openRecallsFor(
  vehicle: { id: string; make?: string; model?: string; year?: number },
  now: Date = new Date()
): Promise<number | undefined> {
  const cached = cachedRecalls(vehicle.id, now);
  if (cached !== undefined) return cached;
  if (!vehicle.make || !vehicle.model || !vehicle.year) return undefined;
  const count = await fetchOpenRecalls({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
  });
  if (count !== undefined) {
    setState(cacheKey(vehicle.id), JSON.stringify({ count, at: now.toISOString() }));
  }
  return count;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest --selectProjects logic tests/health-recalls.test.ts`
Expected: PASS, 11 tests.

If the timeout test hangs, the fake-timer `advanceTimersByTime` ran before `fetch` registered its abort listener; wrap the advance in `await Promise.resolve();` first.

- [ ] **Step 5: Commit**

```bash
git add src/health/recalls.ts tests/health-recalls.test.ts
git commit -m "feat(health): look up open recalls from NHTSA, cached a week"
```

---

### Task 3: Copy — the `health.*` catalog keys in every language

**Files:**
- Create: `src/i18n/catalog/en/health.ts`
- Modify: `src/i18n/catalog/en/index.ts` (import + `FRAGMENTS` entry)
- Modify: `src/i18n/catalog/de.ts`, `es.ts`, `fr.ts`, `it.ts`, `ja.ts`, `ko.ts`, `nl.ts`, `pl.ts`, `ptBR.ts`, `sv.ts` (append a `// health` block before the closing `};`)
- Modify: `tests/localization-smoke.test.ts:24-50` (`SAMPLES`)
- Test: existing `tests/i18n.test.ts`, `tests/localization-smoke.test.ts`

**Interfaces:**
- Produces the keys below, read through `t()` by Tasks 4–6. Plural keys take `count`; caption keys take `current`, `scored`.

- [ ] **Step 1: Run the parity tests to see the baseline pass**

Run: `npx jest --selectProjects logic tests/i18n.test.ts tests/localization-smoke.test.ts`
Expected: PASS. (They will fail after Step 2 until every catalog is filled — that is the failing-test cycle for this task.)

- [ ] **Step 2: Add the English fragment and register it**

`src/i18n/catalog/en/health.ts`:

```ts
import type { Fragment } from "../types";

/**
 * The Vehicle Health grid: six tiles, each a number and a caption that says
 * what the number is made of. The captions are the traceability line, so
 * every one of them is a count and none of them is an adjective.
 *
 * "Current" rather than "OK": the tile fraction is services that are not yet
 * due, and "3 of 5 OK" reads as a verdict on the parts rather than a count of
 * the dates. Tile names are short in English; "Electrical & Cabin" is the
 * long one and the tile allows it two lines.
 */
export const health: Fragment = {
  "health.title": "Vehicle Health",
  "health.lock": "Unlock the full report",

  "health.tile.overall": "Overall",
  "health.tile.potential": "Potential",
  "health.tile.engine": "Engine",
  "health.tile.brakesTires": "Brakes & Tires",
  "health.tile.electricalCabin": "Electrical & Cabin",
  "health.tile.safetyPaperwork": "Safety & Paperwork",

  "health.band.excellent": "Excellent",
  "health.band.good": "Good",
  "health.band.fair": "Fair",
  "health.band.poor": "Poor",
  "health.band.unknown": "Not enough logged",

  "health.caption.current": "{current} of {scored} current",
  "health.caption.unlogged": { one: "1 unlogged", other: "{count} unlogged" },
  "health.caption.none": "Nothing logged yet",
  "health.caption.potential": {
    one: "if the 1 due is done",
    other: "if the {count} due are done",
  },
  "health.caption.potential.none": "nothing due",
  "health.caption.recalls.none": "No open recalls",
  "health.caption.recalls.open": { one: "1 open recall", other: "{count} open recalls" },
  "health.caption.recalls.unchecked": "Recalls not checked",
};
```

In `src/i18n/catalog/en/index.ts` add `import { health } from "./health";` after the `garage` import and `health,` after `garage,` in `FRAGMENTS`.

In `tests/localization-smoke.test.ts` add to `SAMPLES`, after `logged: 4,`:

```ts
  current: 7,
  scored: 9,
```

- [ ] **Step 3: Run parity to see the nine other base catalogs fail**

Run: `npx jest --selectProjects logic tests/i18n.test.ts`
Expected: FAIL — nine "translates every key and invents none" cases, each missing the 21 `health.*` keys.

- [ ] **Step 4: Append the translations**

Each block goes inside the catalog's `Fragment` object, immediately before the closing `};`. Plural categories must match what the language already uses for other counted keys in that file (pl has `one/few/many/other`; ja and ko have `other` only; the rest `one/other`).

`src/i18n/catalog/de.ts`:

```ts
  // health
  "health.title": "Fahrzeugzustand",
  "health.lock": "Vollständigen Bericht freischalten",
  "health.tile.overall": "Gesamt",
  "health.tile.potential": "Potenzial",
  "health.tile.engine": "Motor",
  "health.tile.brakesTires": "Bremsen & Reifen",
  "health.tile.electricalCabin": "Elektrik & Innenraum",
  "health.tile.safetyPaperwork": "Sicherheit & Papiere",
  "health.band.excellent": "Ausgezeichnet",
  "health.band.good": "Gut",
  "health.band.fair": "Mittel",
  "health.band.poor": "Schlecht",
  "health.band.unknown": "Zu wenig erfasst",
  "health.caption.current": "{current} von {scored} aktuell",
  "health.caption.unlogged": { one: "1 nicht erfasst", other: "{count} nicht erfasst" },
  "health.caption.none": "Noch nichts erfasst",
  "health.caption.potential": {
    one: "wenn die 1 fällige erledigt ist",
    other: "wenn die {count} fälligen erledigt sind",
  },
  "health.caption.potential.none": "nichts fällig",
  "health.caption.recalls.none": "Keine offenen Rückrufe",
  "health.caption.recalls.open": { one: "1 offener Rückruf", other: "{count} offene Rückrufe" },
  "health.caption.recalls.unchecked": "Rückrufe nicht geprüft",
```

`src/i18n/catalog/es.ts`:

```ts
  // health
  "health.title": "Estado del vehículo",
  "health.lock": "Desbloquea el informe completo",
  "health.tile.overall": "General",
  "health.tile.potential": "Potencial",
  "health.tile.engine": "Motor",
  "health.tile.brakesTires": "Frenos y neumáticos",
  "health.tile.electricalCabin": "Eléctrico y habitáculo",
  "health.tile.safetyPaperwork": "Seguridad y papeles",
  "health.band.excellent": "Excelente",
  "health.band.good": "Bien",
  "health.band.fair": "Regular",
  "health.band.poor": "Mal",
  "health.band.unknown": "Faltan registros",
  "health.caption.current": "{current} de {scored} al día",
  "health.caption.unlogged": { one: "1 sin registrar", other: "{count} sin registrar" },
  "health.caption.none": "Nada registrado aún",
  "health.caption.potential": {
    one: "si haces el 1 pendiente",
    other: "si haces los {count} pendientes",
  },
  "health.caption.potential.none": "nada pendiente",
  "health.caption.recalls.none": "Sin llamadas a revisión abiertas",
  "health.caption.recalls.open": {
    one: "1 llamada a revisión abierta",
    other: "{count} llamadas a revisión abiertas",
  },
  "health.caption.recalls.unchecked": "Llamadas a revisión sin comprobar",
```

`src/i18n/catalog/fr.ts`:

```ts
  // health
  "health.title": "État du véhicule",
  "health.lock": "Débloquer le rapport complet",
  "health.tile.overall": "Global",
  "health.tile.potential": "Potentiel",
  "health.tile.engine": "Moteur",
  "health.tile.brakesTires": "Freins et pneus",
  "health.tile.electricalCabin": "Électricité et habitacle",
  "health.tile.safetyPaperwork": "Sécurité et papiers",
  "health.band.excellent": "Excellent",
  "health.band.good": "Bon",
  "health.band.fair": "Moyen",
  "health.band.poor": "Faible",
  "health.band.unknown": "Pas assez d'entrées",
  "health.caption.current": "{current} sur {scored} à jour",
  "health.caption.unlogged": { one: "1 non consigné", other: "{count} non consignés" },
  "health.caption.none": "Rien de consigné pour l'instant",
  "health.caption.potential": {
    one: "si le 1 à faire est fait",
    other: "si les {count} à faire sont faits",
  },
  "health.caption.potential.none": "rien à faire",
  "health.caption.recalls.none": "Aucun rappel en cours",
  "health.caption.recalls.open": { one: "1 rappel en cours", other: "{count} rappels en cours" },
  "health.caption.recalls.unchecked": "Rappels non vérifiés",
```

`src/i18n/catalog/it.ts`:

```ts
  // health
  "health.title": "Stato del veicolo",
  "health.lock": "Sblocca il rapporto completo",
  "health.tile.overall": "Generale",
  "health.tile.potential": "Potenziale",
  "health.tile.engine": "Motore",
  "health.tile.brakesTires": "Freni e gomme",
  "health.tile.electricalCabin": "Elettrico e abitacolo",
  "health.tile.safetyPaperwork": "Sicurezza e documenti",
  "health.band.excellent": "Eccellente",
  "health.band.good": "Buono",
  "health.band.fair": "Discreto",
  "health.band.poor": "Scarso",
  "health.band.unknown": "Troppo poco registrato",
  "health.caption.current": "{current} su {scored} in regola",
  "health.caption.unlogged": { one: "1 non registrato", other: "{count} non registrati" },
  "health.caption.none": "Ancora nulla registrato",
  "health.caption.potential": {
    one: "se fai l'1 in scadenza",
    other: "se fai i {count} in scadenza",
  },
  "health.caption.potential.none": "niente in scadenza",
  "health.caption.recalls.none": "Nessun richiamo aperto",
  "health.caption.recalls.open": { one: "1 richiamo aperto", other: "{count} richiami aperti" },
  "health.caption.recalls.unchecked": "Richiami non verificati",
```

`src/i18n/catalog/ja.ts`:

```ts
  // health
  "health.title": "車両の状態",
  "health.lock": "レポート全体を見る",
  "health.tile.overall": "総合",
  "health.tile.potential": "ポテンシャル",
  "health.tile.engine": "エンジン",
  "health.tile.brakesTires": "ブレーキ・タイヤ",
  "health.tile.electricalCabin": "電装・車内",
  "health.tile.safetyPaperwork": "安全・手続き",
  "health.band.excellent": "とても良い",
  "health.band.good": "良い",
  "health.band.fair": "ふつう",
  "health.band.poor": "要注意",
  "health.band.unknown": "記録が足りません",
  "health.caption.current": "{scored}件中{current}件が期限内",
  "health.caption.unlogged": { other: "{count}件は未記録" },
  "health.caption.none": "まだ記録がありません",
  "health.caption.potential": { other: "期限の{count}件を済ませた場合" },
  "health.caption.potential.none": "期限のものはありません",
  "health.caption.recalls.none": "未対応のリコールなし",
  "health.caption.recalls.open": { other: "未対応のリコール{count}件" },
  "health.caption.recalls.unchecked": "リコールは未確認",
```

`src/i18n/catalog/ko.ts`:

```ts
  // health
  "health.title": "차량 상태",
  "health.lock": "전체 리포트 잠금 해제",
  "health.tile.overall": "종합",
  "health.tile.potential": "잠재 점수",
  "health.tile.engine": "엔진",
  "health.tile.brakesTires": "브레이크·타이어",
  "health.tile.electricalCabin": "전기·실내",
  "health.tile.safetyPaperwork": "안전·서류",
  "health.band.excellent": "매우 좋음",
  "health.band.good": "좋음",
  "health.band.fair": "보통",
  "health.band.poor": "나쁨",
  "health.band.unknown": "기록이 부족함",
  "health.caption.current": "{scored}개 중 {current}개 정상",
  "health.caption.unlogged": { other: "{count}개 미기록" },
  "health.caption.none": "아직 기록이 없습니다",
  "health.caption.potential": { other: "예정된 {count}개를 마치면" },
  "health.caption.potential.none": "예정된 항목 없음",
  "health.caption.recalls.none": "미조치 리콜 없음",
  "health.caption.recalls.open": { other: "미조치 리콜 {count}건" },
  "health.caption.recalls.unchecked": "리콜 미확인",
```

`src/i18n/catalog/nl.ts`:

```ts
  // health
  "health.title": "Conditie van de auto",
  "health.lock": "Volledig rapport ontgrendelen",
  "health.tile.overall": "Totaal",
  "health.tile.potential": "Potentieel",
  "health.tile.engine": "Motor",
  "health.tile.brakesTires": "Remmen & banden",
  "health.tile.electricalCabin": "Elektra & interieur",
  "health.tile.safetyPaperwork": "Veiligheid & papieren",
  "health.band.excellent": "Uitstekend",
  "health.band.good": "Goed",
  "health.band.fair": "Matig",
  "health.band.poor": "Slecht",
  "health.band.unknown": "Te weinig vastgelegd",
  "health.caption.current": "{current} van {scored} in orde",
  "health.caption.unlogged": { one: "1 niet vastgelegd", other: "{count} niet vastgelegd" },
  "health.caption.none": "Nog niets vastgelegd",
  "health.caption.potential": {
    one: "als de 1 openstaande is gedaan",
    other: "als de {count} openstaande zijn gedaan",
  },
  "health.caption.potential.none": "niets openstaand",
  "health.caption.recalls.none": "Geen open terugroepacties",
  "health.caption.recalls.open": {
    one: "1 open terugroepactie",
    other: "{count} open terugroepacties",
  },
  "health.caption.recalls.unchecked": "Terugroepacties niet gecontroleerd",
```

`src/i18n/catalog/pl.ts`:

```ts
  // health
  "health.title": "Stan pojazdu",
  "health.lock": "Odblokuj pełny raport",
  "health.tile.overall": "Ogółem",
  "health.tile.potential": "Potencjał",
  "health.tile.engine": "Silnik",
  "health.tile.brakesTires": "Hamulce i opony",
  "health.tile.electricalCabin": "Elektryka i kabina",
  "health.tile.safetyPaperwork": "Bezpieczeństwo i dokumenty",
  "health.band.excellent": "Doskonały",
  "health.band.good": "Dobry",
  "health.band.fair": "Przeciętny",
  "health.band.poor": "Słaby",
  "health.band.unknown": "Za mało wpisów",
  "health.caption.current": "{current} z {scored} aktualnych",
  "health.caption.unlogged": {
    one: "1 bez wpisu",
    few: "{count} bez wpisu",
    many: "{count} bez wpisu",
    other: "{count} bez wpisu",
  },
  "health.caption.none": "Jeszcze nic nie zapisano",
  "health.caption.potential": {
    one: "po wykonaniu 1 zaległej",
    few: "po wykonaniu {count} zaległych",
    many: "po wykonaniu {count} zaległych",
    other: "po wykonaniu {count} zaległych",
  },
  "health.caption.potential.none": "nic zaległego",
  "health.caption.recalls.none": "Brak otwartych akcji serwisowych",
  "health.caption.recalls.open": {
    one: "1 otwarta akcja serwisowa",
    few: "{count} otwarte akcje serwisowe",
    many: "{count} otwartych akcji serwisowych",
    other: "{count} otwartej akcji serwisowej",
  },
  "health.caption.recalls.unchecked": "Akcje serwisowe niesprawdzone",
```

`src/i18n/catalog/ptBR.ts`:

```ts
  // health
  "health.title": "Saúde do veículo",
  "health.lock": "Desbloquear o relatório completo",
  "health.tile.overall": "Geral",
  "health.tile.potential": "Potencial",
  "health.tile.engine": "Motor",
  "health.tile.brakesTires": "Freios e pneus",
  "health.tile.electricalCabin": "Elétrica e cabine",
  "health.tile.safetyPaperwork": "Segurança e documentos",
  "health.band.excellent": "Excelente",
  "health.band.good": "Bom",
  "health.band.fair": "Regular",
  "health.band.poor": "Ruim",
  "health.band.unknown": "Poucos registros",
  "health.caption.current": "{current} de {scored} em dia",
  "health.caption.unlogged": { one: "1 sem registro", other: "{count} sem registro" },
  "health.caption.none": "Nada registrado ainda",
  "health.caption.potential": {
    one: "se fizer o 1 pendente",
    other: "se fizer os {count} pendentes",
  },
  "health.caption.potential.none": "nada pendente",
  "health.caption.recalls.none": "Nenhum recall em aberto",
  "health.caption.recalls.open": { one: "1 recall em aberto", other: "{count} recalls em aberto" },
  "health.caption.recalls.unchecked": "Recalls não verificados",
```

`src/i18n/catalog/sv.ts`:

```ts
  // health
  "health.title": "Bilens skick",
  "health.lock": "Lås upp hela rapporten",
  "health.tile.overall": "Totalt",
  "health.tile.potential": "Potential",
  "health.tile.engine": "Motor",
  "health.tile.brakesTires": "Bromsar & däck",
  "health.tile.electricalCabin": "El & kupé",
  "health.tile.safetyPaperwork": "Säkerhet & papper",
  "health.band.excellent": "Utmärkt",
  "health.band.good": "Bra",
  "health.band.fair": "Okej",
  "health.band.poor": "Dåligt",
  "health.band.unknown": "För lite loggat",
  "health.caption.current": "{current} av {scored} i tid",
  "health.caption.unlogged": { one: "1 ej loggad", other: "{count} ej loggade" },
  "health.caption.none": "Inget loggat ännu",
  "health.caption.potential": {
    one: "om den 1 som ska göras görs",
    other: "om de {count} som ska göras görs",
  },
  "health.caption.potential.none": "inget att göra",
  "health.caption.recalls.none": "Inga öppna återkallelser",
  "health.caption.recalls.open": {
    one: "1 öppen återkallelse",
    other: "{count} öppna återkallelser",
  },
  "health.caption.recalls.unchecked": "Återkallelser ej kontrollerade",
```

- [ ] **Step 5: Run the parity and smoke tests**

Run: `npx jest --selectProjects logic tests/i18n.test.ts tests/localization-smoke.test.ts`
Expected: PASS.

If a plural test fails for pl, compare the category set against an existing pl counted key such as `onboardingC.results.overdue` and match it exactly.

- [ ] **Step 6: Commit**

```bash
git add src/i18n tests/localization-smoke.test.ts
git commit -m "feat(i18n): add the Vehicle Health copy in every language"
```

---

### Task 4: `HealthBar` and `HealthGrid` design components

**Files:**
- Create: `src/design/HealthBar.tsx`
- Create: `src/design/HealthGrid.tsx`
- Test: `tests/health-grid.test.tsx`

**Interfaces:**
- Consumes: `Health`, `HealthTile`, `Band` from `src/health`; `tokens`; `Panel` from `src/design/Surface`; `t` from `src/i18n`; `BlurView` from `expo-blur`.
- Produces:
  ```ts
  export function HealthBar(props: { fill: number; unknown: number; color: string }): JSX.Element;
  export function bandColor(band: Band): string;
  export function HealthGrid(props: { health: Health; locked: boolean; testID?: string }): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test**

`tests/health-grid.test.tsx`:

```tsx
import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { HealthGrid } from "../src/design/HealthGrid";
import { buildHealth } from "../src/health";
import type { Plan, PlanItem } from "../src/onboarding/plan";
import { setLanguage } from "../src/i18n";

beforeAll(() => setLanguage("en"));

const item = (type: string, status: PlanItem["status"], logged = true): PlanItem => ({
  type,
  status,
  logged,
  projected: false,
});
const planOf = (items: PlanItem[]): Plan => ({
  items,
  dueNow: 0,
  pastDue: 0,
  noRecord: 0,
  soon: 0,
  logged: 0,
  unit: "mi",
  distancePerYear: 12000,
});

function render(el: ReactElement): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(el);
  });
  return tree;
}

function ownText(node: TestRenderer.ReactTestInstance): string {
  const kids: unknown = node.props.children;
  return (Array.isArray(kids) ? kids : [kids])
    .filter((k): k is string => typeof k === "string")
    .join("");
}
const texts = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root
    .findAll((n) => typeof n.type === "string")
    .map(ownText)
    .filter((s) => s.length > 0);

const blurs = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAll((n) => n.props.testID === "health-blur");

test("prints six tiles with a number and a caption each", () => {
  const health = buildHealth(
    planOf([
      item("Oil Change", "ok"),
      item("Air Filter", "due"),
      item("Tire Rotation", "ok"),
      item("Registration", "ok"),
    ]),
    1
  );
  const printed = texts(render(createElement(HealthGrid, { health, locked: false })));
  expect(printed).toContain("Vehicle Health");
  for (const name of [
    "Overall",
    "Potential",
    "Engine",
    "Brakes & Tires",
    "Electrical & Cabin",
    "Safety & Paperwork",
  ])
    expect(printed).toContain(name);
  // Overall: (1 + 0 + 1 + 1) / 5 with the recall → 60.
  expect(printed).toContain("60");
  expect(printed).toContain("3 of 5 current");
  expect(printed).toContain("1 open recall");
  expect(printed).toContain("Good");
});

test("a tile with nothing logged prints no number and says so", () => {
  const health = buildHealth(planOf([item("Oil Change", "ok")]));
  const printed = texts(render(createElement(HealthGrid, { health, locked: false })));
  expect(printed).toContain("Nothing logged yet");
  expect(printed).not.toContain("0");
  expect(printed.join(" ")).not.toMatch(/[–—]/);
});

test("potential says what it is conditional on", () => {
  const health = buildHealth(planOf([item("Oil Change", "due"), item("Air Filter", "soon")]));
  const printed = texts(render(createElement(HealthGrid, { health, locked: false })));
  expect(printed).toContain("if the 2 due are done");
});

test("unchecked recalls are said, not hidden", () => {
  const health = buildHealth(planOf([item("Registration", "ok")]));
  const printed = texts(render(createElement(HealthGrid, { health, locked: false })));
  expect(printed).toContain("Recalls not checked");
});

test("locked draws blur panes and the lock line; unlocked draws neither", () => {
  const health = buildHealth(planOf([item("Oil Change", "ok")]));
  const locked = render(createElement(HealthGrid, { health, locked: true }));
  expect(blurs(locked)).toHaveLength(2);
  expect(texts(locked)).toContain("Unlock the full report");
  // The real numbers are still rendered underneath — nothing is faked.
  expect(texts(locked)).toContain("100");

  const open = render(createElement(HealthGrid, { health, locked: false }));
  expect(blurs(open)).toHaveLength(0);
  expect(texts(open)).not.toContain("Unlock the full report");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest --selectProjects screens tests/health-grid.test.tsx`
Expected: FAIL — `Cannot find module '../src/design/HealthGrid'`.

- [ ] **Step 3: Write `HealthBar`**

`src/design/HealthBar.tsx`:

```tsx
import { View } from "react-native";
import { tokens } from "./tokens";

/**
 * A reading, not a wait: a static track with a fill, and at the right end a
 * dimmer segment for the share of the tile the app has nothing on.
 *
 * Not `ProgressBar` — that one animates a job in progress, and a health bar
 * that crept up on mount would be claiming the car got better while you
 * watched. Widths are flex ratios rather than measured pixels so the bar lays
 * out once and never remeasures.
 */
export function HealthBar({
  fill,
  unknown,
  color,
  height = 6,
}: {
  /** 0–1 of the scored share. */
  fill: number;
  /** 0–1 of the track that is unlogged and drawn as a gap. */
  unknown: number;
  color: string;
  height?: number;
}) {
  const scoredShare = Math.max(0, 1 - unknown);
  const filled = scoredShare * Math.min(1, Math.max(0, fill));
  const empty = scoredShare - filled;
  return (
    <View
      style={{
        flexDirection: "row",
        height,
        borderRadius: height / 2,
        overflow: "hidden",
        backgroundColor: tokens.color.sunken,
      }}
    >
      {filled > 0 ? <View style={{ flex: filled, backgroundColor: color }} /> : null}
      {empty > 0 ? <View style={{ flex: empty }} /> : null}
      {unknown > 0 ? (
        <View style={{ flex: unknown, backgroundColor: tokens.color.unlitBulb }} />
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Write `HealthGrid`**

`src/design/HealthGrid.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { tokens } from "./tokens";
import { Panel } from "./Surface";
import { HealthBar } from "./HealthBar";
import { t } from "../i18n";
import type { Band, Health, HealthTile } from "../health";

/**
 * Six tiles in two columns: a legend, a large numeral, a bar, and one line
 * that says what the numeral is made of.
 *
 * Locked, the grid still renders its real numbers — there is nothing fake
 * behind the blur — and two blur panes cover everything but the Overall
 * tile, which is the teaser. Two panes rather than one with a hole, because
 * BlurView cannot be cut out; and two rather than five (one per hidden tile)
 * because blur is the most expensive thing in the system and both surfaces
 * this sits on are otherwise still.
 */

const TILE_KEY = {
  overall: "health.tile.overall",
  potential: "health.tile.potential",
  engine: "health.tile.engine",
  brakesTires: "health.tile.brakesTires",
  electricalCabin: "health.tile.electricalCabin",
  safetyPaperwork: "health.tile.safetyPaperwork",
} as const;

const BAND_KEY = {
  excellent: "health.band.excellent",
  good: "health.band.good",
  fair: "health.band.fair",
  poor: "health.band.poor",
  unknown: "health.band.unknown",
} as const;

/** Two-tone by design: the band word carries the finer grade, the bar the
 *  verdict. */
export function bandColor(band: Band): string {
  if (band === "excellent" || band === "good") return tokens.color.green;
  if (band === "unknown") return tokens.color.textMuted;
  return tokens.color.red;
}

function tileBand(tile: HealthTile): Band {
  const s = tile.score;
  if (s === undefined) return "unknown";
  if (s >= 80) return "excellent";
  if (s >= 60) return "good";
  if (s >= 40) return "fair";
  return "poor";
}

/** The traceability line under the number. Always a count. */
function caption(tile: HealthTile, dueCount: number): string {
  if (tile.key === "potential") {
    return dueCount > 0
      ? t("health.caption.potential", { count: dueCount })
      : t("health.caption.potential.none");
  }
  if (tile.key === "safetyPaperwork") {
    if (tile.openRecalls === undefined) {
      return tile.scored === 0
        ? t("health.caption.recalls.unchecked")
        : `${t("health.caption.current", { current: tile.current, scored: tile.scored })} · ${t("health.caption.recalls.unchecked")}`;
    }
    return tile.openRecalls === 0
      ? t("health.caption.recalls.none")
      : t("health.caption.recalls.open", { count: tile.openRecalls });
  }
  if (tile.scored === 0) return t("health.caption.none");
  const current = t("health.caption.current", { current: tile.current, scored: tile.scored });
  return tile.unknown > 0
    ? `${current} · ${t("health.caption.unlogged", { count: tile.unknown })}`
    : current;
}

function Tile({ tile, dueCount }: { tile: HealthTile; dueCount: number }) {
  const band = tileBand(tile);
  const color = bandColor(band);
  const denominator = tile.total + (tile.openRecalls ?? 0);
  return (
    <View style={styles.tile}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }} numberOfLines={2}>
        {t(TILE_KEY[tile.key])}
      </Text>
      {/* The slot keeps its height when there is no number, so the grid
          does not stagger; an empty slot, never a zero. */}
      <Text style={{ ...tokens.text.readout, fontSize: 34, lineHeight: 40, color: tokens.color.text }}>
        {tile.score === undefined ? "" : String(tile.score)}
      </Text>
      <HealthBar
        fill={(tile.score ?? 0) / 100}
        unknown={denominator === 0 ? 1 : tile.unknown / denominator}
        color={color}
      />
      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }} numberOfLines={2}>
        {caption(tile, dueCount)}
      </Text>
    </View>
  );
}

export function HealthGrid({
  health,
  locked,
  testID,
}: {
  health: Health;
  locked: boolean;
  testID?: string;
}) {
  const overall = health.tiles[0];
  // How many logged services are due or soon — what Potential's caption
  // names. Overall's scored items minus the recalls minus the ones worth a
  // full point is exactly that, so it is derived rather than passed.
  const dueCount = overall.scored - (overall.openRecalls ?? 0) - overall.current;
  const rows = [health.tiles.slice(0, 2), health.tiles.slice(2, 4), health.tiles.slice(4, 6)];

  return (
    <Panel>
      <View style={{ padding: tokens.space.md, gap: tokens.space.md }} testID={testID}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
            {t("health.title")}
          </Text>
          <Text style={{ ...tokens.text.legend, color: bandColor(health.band) }}>
            {t(BAND_KEY[health.band])}
          </Text>
        </View>

        <View style={{ gap: tokens.space.lg }}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((tile) => (
                <Tile key={tile.key} tile={tile} dueCount={dueCount} />
              ))}
              {/* First row, right half: Potential sits under blur while
                  Overall stays clear. */}
              {locked && i === 0 ? (
                <BlurView
                  testID="health-blur"
                  intensity={24}
                  tint="dark"
                  style={[StyleSheet.absoluteFill, { left: "50%" }]}
                />
              ) : null}
            </View>
          ))}
        </View>

        {locked ? (
          // Rows two and three, whole width. Positioned against the grid's
          // outer box by covering everything below the first row.
          <BlurView
            testID="health-blur"
            intensity={24}
            tint="dark"
            style={[styles.lowerPane, { alignItems: "center", justifyContent: "center" }]}
          >
            <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
              {"\u{1F512}"} {t("health.lock")}
            </Text>
          </BlurView>
        ) : null}
      </View>
    </Panel>
  );
}

/** Height of one tile row plus the gap beneath it: legend (~18) + numeral
 *  (40) + bar (6) + caption (~19) + three gaps of 4 + row gap 24. The lower
 *  pane starts there. Fixed rather than measured so the pane never flashes
 *  in a frame late. */
const ROW_HEIGHT = 18 + 40 + 6 + 19 + 3 * tokens.space.xs + tokens.space.lg;

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: tokens.space.md },
  tile: { flex: 1, gap: tokens.space.xs, minWidth: 0 },
  lowerPane: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Header row (legend line ~18 + gap 16) + first tile row.
    top: tokens.space.md + 18 + tokens.space.md + ROW_HEIGHT,
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest --selectProjects screens tests/health-grid.test.tsx`
Expected: PASS, 5 tests.

If `BlurView` is undefined under jest-expo, add at the top of the test file:

```ts
jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return { BlurView: View };
});
```

- [ ] **Step 6: Check the lock pane's top edge on a device or simulator**

Run: `npx expo start`, open any Pro vehicle, temporarily pass `locked` true. The lower pane must begin exactly on the gap under the first tile row. If it lands high or low, adjust `ROW_HEIGHT` (the legend and caption line heights are the estimates) and re-check. Restore `locked` before committing.

- [ ] **Step 7: Commit**

```bash
git add src/design/HealthBar.tsx src/design/HealthGrid.tsx tests/health-grid.test.tsx
git commit -m "feat(design): add the Vehicle Health grid and bar"
```

---

### Task 5: The onboarding results screen — blurred grid, real counts below

**Files:**
- Modify: `app/onboarding/results.tsx`
- Modify: `src/analytics/index.ts` (one `trackHealthShown` helper after `trackVehicleEntry`)
- Modify: `tests/onboarding-screens.test.tsx:19-66` (add two mocks)
- Test: `tests/onboarding-screens.test.tsx`

**Interfaces:**
- Consumes: `buildHealth(plan, openRecalls?)`, `openRecallsFor(vehicle)`, `HealthGrid`, `useIsPro()` from `src/purchases/useIsPro`, `useOnboardingFindings()`.
- Produces: `trackHealthShown(health: Health): void` emitting `health_grid_shown { overall, potential, band, recalls }`.

- [ ] **Step 1: Add the two mocks the screen test now needs**

`tests/onboarding-screens.test.tsx`, after the `react-native-purchases` mock on line 51:

```ts
// `useIsPro` calls `Purchases.getCustomerInfo`, which the mock above does not
// have. Onboarding is walked as a free user unless a test says otherwise.
let mockPro: boolean | null = false;
jest.mock("../src/purchases/useIsPro", () => ({ useIsPro: () => mockPro }));
// The results screen asks NHTSA for recalls. No test worker has a network,
// and the grid has to render the same with the answer still pending.
jest.mock("../src/health/recalls", () => ({
  openRecallsFor: jest.fn(async () => undefined),
  cachedRecalls: () => undefined,
}));
```

- [ ] **Step 2: Write the failing tests**

Append to `tests/onboarding-screens.test.tsx`, after the "payoff screen is the whole argument" test (line ~442). The file's own `render`, `texts`, `createVehicle`, `setAnswers`/answer helpers and `addRecord` are already imported there; use the same names the surrounding tests use.

```ts
test("the results screen shows the health grid locked, with the counts still beneath", () => {
  const car = createVehicle({
    name: "2019 Honda Civic",
    year: 2019,
    make: "Honda",
    model: "Civic",
    odometer: 84210,
  });
  setOnboardingVehicleId(car.id);
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: "2026-09-01T12:00:00.000Z",
    odometer: 84000,
  });

  mockPro = false;
  const tree = render(OnboardingResults);
  const printed = texts(tree.root);
  expect(printed).toContain("Vehicle Health");
  expect(printed).toContain("Unlock the full report");
  expect(tree.root.findAll((n) => n.props.testID === "health-blur")).toHaveLength(2);
  // The facts the flow argues from are still on the glass, unblurred.
  expect(printed).toContain("Due now");
  expect(printed).toContain("On file");
});

test("a Pro replay of onboarding sees the grid unlocked", () => {
  const car = createVehicle({ name: "Civic", year: 2019, make: "Honda", model: "Civic" });
  setOnboardingVehicleId(car.id);
  mockPro = true;
  const tree = render(OnboardingResults);
  expect(tree.root.findAll((n) => n.props.testID === "health-blur")).toHaveLength(0);
  mockPro = false;
});
```

If `setOnboardingVehicleId` or `addRecord` are not yet imported in this test file, add `import { setOnboardingVehicleId } from "../src/onboarding";` and `import { addRecord } from "../src/db/records";` alongside the existing imports.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest --selectProjects screens tests/onboarding-screens.test.tsx -t "health grid"`
Expected: FAIL — `printed` does not contain "Vehicle Health".

- [ ] **Step 4: Add the analytics helper**

`src/analytics/index.ts`, after `trackVehicleEntry`:

```ts
/**
 * The health grid, once per plan build. Enough to see what the reveal is
 * showing — a distribution of overall scores and how often recalls came
 * back — without a per-tile event for each of six tiles.
 */
export function trackHealthShown(health: {
  tiles: { key: string; score?: number; openRecalls?: number }[];
  band: string;
}): void {
  const overall = health.tiles.find((t) => t.key === "overall");
  const potential = health.tiles.find((t) => t.key === "potential");
  track("health_grid_shown", {
    overall: overall?.score ?? null,
    potential: potential?.score ?? null,
    band: health.band,
    recalls:
      overall?.openRecalls === undefined
        ? "unchecked"
        : overall.openRecalls === 0
          ? "none"
          : String(overall.openRecalls),
  });
}
```

- [ ] **Step 5: Wire the grid into the results screen**

`app/onboarding/results.tsx` — add imports:

```ts
import { useEffect, useMemo, useState } from "react";
import { HealthGrid } from "../../src/design/HealthGrid";
import { buildHealth } from "../../src/health";
import { cachedRecalls, openRecallsFor } from "../../src/health/recalls";
import { useIsPro } from "../../src/purchases/useIsPro";
import { trackHealthShown } from "../../src/analytics";
```

Replace the docblock above `export default function OnboardingResults()` (the "It is deliberately not a score…" paragraph) with:

```ts
/**
 * The payoff. Everything above the fold here is the user's own car, computed
 * from what they typed ninety seconds ago, and it is the first time the app
 * has told them something they did not already know.
 *
 * The health grid at the top is a score, and for a long time this screen
 * refused to print one. The rule that lifts the refusal is in `src/health`:
 * every point of it is a fraction of services with a history, and an item
 * the user never logged is a gap on the bar, not a zero. Under the grid the
 * counts stay exactly as they were — the grid is added to the argument, not
 * put in place of the facts the rest of the flow makes it from.
 *
 * Locked for a free user with the Overall tile clear: the number is the
 * product and the blur is the ask, and the Continue button below is already
 * the way to the paywall.
 */
```

Change the existing findings line to also take the vehicle:

```ts
  const { vehiclePhrase, plan, vehicle } = useOnboardingFindings();
```

Then, after `const unit = getDistanceUnit();`:

```ts
  const pro = useIsPro();

  // The cached count renders on the first frame; a fetch, if one is needed,
  // updates the tile in place. Nothing waits.
  const [recalls, setRecalls] = useState<number | undefined>(() =>
    vehicle ? cachedRecalls(vehicle.id) : undefined
  );
  useEffect(() => {
    if (!vehicle || recalls !== undefined) return;
    let live = true;
    openRecallsFor(vehicle).then((count) => {
      if (live && count !== undefined) setRecalls(count);
    });
    return () => {
      live = false;
    };
  }, [vehicle, recalls]);

  const health = useMemo(() => buildHealth(plan, recalls), [plan, recalls]);
  useEffect(() => {
    trackHealthShown(health);
    // Once per plan build, which is once per mount: `plan` is memoised for
    // the life of the screen and the recall count arriving is not a new plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);
```

In the JSX, wrap the existing `<Panel>` in a fragment with the grid first:

```tsx
      <View style={{ gap: tokens.space.md }}>
        <HealthGrid health={health} locked={pro !== true} />
        <Panel>
          {/* …existing panel body, unchanged… */}
        </Panel>
      </View>
```

`pro !== true` renders the locked state during the `null` beat, never a flash of the unlocked one.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest --selectProjects screens tests/onboarding-screens.test.tsx`
Expected: PASS, including the pre-existing "no en dash anywhere in onboarding" walk.

- [ ] **Step 7: Run the analytics test**

Run: `npx jest --selectProjects logic tests/analytics.test.ts`
Expected: PASS. If it enumerates event names, add `health_grid_shown` to that list.

- [ ] **Step 8: Commit**

```bash
git add app/onboarding/results.tsx src/analytics/index.ts tests/onboarding-screens.test.tsx
git commit -m "feat(onboarding): show the health grid locked on results"
```

---

### Task 6: The vehicle screen — unlocked grid for Pro

**Files:**
- Modify: `app/vehicle/[id].tsx:145-160` (state, refresh) and `:270-310` (`ListHeaderComponent`)
- Modify: `tests/vehicle-fuel.test.tsx:46-52` (two mocks)
- Test: `tests/vehicle-health.test.tsx`

**Interfaces:**
- Consumes: `buildPlan` from `src/onboarding/plan`, `getAnswers` from `src/onboarding`, `getIntervals` from `src/db/intervals`, `getDistanceUnit` from `src/units`, `buildHealth`, `cachedRecalls`, `openRecallsFor`, `HealthGrid`, `useIsPro`.

- [ ] **Step 1: Add the mocks `vehicle-fuel.test.tsx` now needs**

After the `react-native-purchases` mock in `tests/vehicle-fuel.test.tsx`:

```ts
jest.mock("../src/purchases/useIsPro", () => ({ useIsPro: () => false }));
jest.mock("../src/health/recalls", () => ({
  openRecallsFor: jest.fn(async () => undefined),
  cachedRecalls: () => undefined,
}));
```

Run: `npx jest --selectProjects screens tests/vehicle-fuel.test.tsx`
Expected: PASS (unchanged behaviour; the mocks are inert until Step 4).

- [ ] **Step 2: Write the failing test**

`tests/vehicle-health.test.tsx` — copy the whole mock preamble from `tests/vehicle-fuel.test.tsx` lines 15–66 (expo-router, db client, purchases-ui, purchases, expo-notifications, expo-haptics, i18n device), then:

```ts
let mockPro: boolean | null = false;
jest.mock("../src/purchases/useIsPro", () => ({ useIsPro: () => mockPro }));

let mockRecalls: number | undefined = undefined;
jest.mock("../src/health/recalls", () => ({
  openRecallsFor: jest.fn(async () => mockRecalls),
  cachedRecalls: () => undefined,
}));

import VehicleDetail from "../app/vehicle/[id]";
import { getDb } from "../src/db/client";
import { addRecord } from "../src/db/records";
import { setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

beforeEach(() => {
  mockPro = false;
  mockRecalls = undefined;
  getDb().runSync("DELETE FROM service_records", []);
  getDb().runSync("DELETE FROM vehicles", []);
  getDb().runSync(
    "INSERT INTO vehicles (id, name, make, model, year, odometer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ["v1", "Civic", "Honda", "Civic", 2019, 84210, "2026-01-01T00:00:00.000Z"]
  );
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(VehicleDetail) as ReactElement);
  });
  return tree;
}

function ownText(node: TestRenderer.ReactTestInstance): string {
  const kids: unknown = node.props.children;
  return (Array.isArray(kids) ? kids : [kids])
    .filter((k): k is string => typeof k === "string")
    .join("");
}
const texts = (node: TestRenderer.ReactTestInstance) =>
  node
    .findAll((n) => typeof n.type === "string")
    .map(ownText)
    .filter((s) => s.length > 0);

test("a free garage has no health grid at all", () => {
  const printed = texts(render().root);
  expect(printed).not.toContain("Vehicle Health");
  expect(printed).not.toContain("Unlock the full report");
});

test("a Pro garage sees the grid unlocked, built from the log", () => {
  mockPro = true;
  addRecord({
    vehicle_id: "v1",
    service_type: "Oil Change",
    performed_at: new Date().toISOString(),
    odometer: 84210,
  });
  const tree = render();
  const printed = texts(tree.root);
  expect(printed).toContain("Vehicle Health");
  expect(printed).toContain("100");
  expect(printed).toContain("1 of 1 current");
  expect(tree.root.findAll((n) => n.props.testID === "health-blur")).toHaveLength(0);
});

test("the recall count arrives in place", async () => {
  mockPro = true;
  mockRecalls = 2;
  const tree = render();
  await act(async () => {
    await Promise.resolve();
  });
  expect(texts(tree.root)).toContain("2 open recalls");
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest --selectProjects screens tests/vehicle-health.test.tsx`
Expected: FAIL — the Pro test does not find "Vehicle Health".

- [ ] **Step 4: Wire the grid into the vehicle screen**

`app/vehicle/[id].tsx` — add imports:

```ts
import { useMemo } from "react"; // fold into the existing react import
import { HealthGrid } from "../../src/design/HealthGrid";
import { buildHealth } from "../../src/health";
import { cachedRecalls, openRecallsFor } from "../../src/health/recalls";
import { buildPlan } from "../../src/onboarding/plan";
import { getAnswers } from "../../src/onboarding";
import { useIsPro } from "../../src/purchases/useIsPro";
```

Inside `VehicleDetail`, after `const [undoId, setUndoId] = ...`:

```ts
  const pro = useIsPro();
  const [recalls, setRecalls] = useState<number | undefined>(undefined);
```

Extend `refresh` so the cached count comes back with the rows:

```ts
  const refresh = useCallback(() => {
    setVehicle(getVehicle(id));
    setRecords(listRecords(id));
    setFuel(listFuelEntries(id));
    setRecalls(cachedRecalls(id));
  }, [id]);
```

After the undo-timer effect:

```ts
  // A fetch only when the cache is empty or stale, and only for a Pro
  // garage, which is the only one that renders the tile. The count updates
  // the grid in place; the tile said "Recalls not checked" until then.
  useEffect(() => {
    if (pro !== true || !vehicle || recalls !== undefined) return;
    let live = true;
    openRecallsFor(vehicle).then((count) => {
      if (live && count !== undefined) setRecalls(count);
    });
    return () => {
      live = false;
    };
  }, [pro, vehicle, recalls]);

  // The same function of the same rows the onboarding results ran. The
  // drive-rate answer is the one from onboarding; a second car added later
  // is projected at the same rate, which is the scheduler's assumption too.
  const health = useMemo(() => {
    if (!vehicle) return null;
    const plan = buildPlan({
      odometer: vehicle.odometer,
      records,
      intervals: getIntervals(),
      answers: getAnswers(),
      unit: getDistanceUnit(),
    });
    return buildHealth(plan, recalls);
  }, [vehicle, records, recalls]);
```

In `ListHeaderComponent`, as the first child of the outer `<View style={{ gap: tokens.space.md, ... }}>`, before the cluster `<Panel>`:

```tsx
            {pro === true && health ? <HealthGrid health={health} locked={false} /> : null}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest --selectProjects screens tests/vehicle-health.test.tsx tests/vehicle-fuel.test.tsx tests/vehicle-rename.test.tsx`
Expected: PASS.

If `vehicle-rename.test.tsx` renders `VehicleDetail` and fails on `Purchases.getCustomerInfo`, add the same two mocks from Step 1 to it.

- [ ] **Step 6: Commit**

```bash
git add app/vehicle/\[id\].tsx tests/vehicle-health.test.tsx tests/vehicle-fuel.test.tsx
git commit -m "feat(vehicle): show the health grid on a Pro vehicle"
```

---

### Task 7: Retire the "not a score" comments and close out

**Files:**
- Modify: `src/onboarding/outlook.ts:12-17`
- Modify: `app/onboarding/outlook.tsx:42-44`
- Modify: `src/i18n/catalog/en/onboardingC.ts:40` and the matching `// ask. Counts and dates the scheduler already computes; no score.` line in each base catalog (grep `no score`)
- Modify: `tests/onboarding-screens.test.tsx:1105` comment

- [ ] **Step 1: Rewrite the comments that now point the wrong way**

`src/onboarding/outlook.ts` — replace the "Deliberately not a score…" paragraph with:

```ts
 * Not a score. The score lives in `src/health` and is built from the same
 * plan; this screen is the twelve-month projection, and every figure on it is
 * a count or a date the scheduler already makes.
```

`app/onboarding/outlook.tsx` — replace the "There is no score on it…" sentence with:

```ts
 * There is no score on it: the health grid on the results screen has already
 * given one, and this is the projection that follows it.
```

Catalog comment lines: change `no score.` to `no score here.` in each file it appears in (`grep -rn "no score" src/i18n/catalog`).

`tests/onboarding-screens.test.tsx:1105` — change "`results.tsx` refuses to print" to "`results.tsx` prints its score in the health grid, and this screen does not".

- [ ] **Step 2: Run the whole suite**

Run: `npx jest`
Expected: PASS, both projects.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A src app tests
git commit -m "docs(health): point the old no-score comments at the grid"
```

- [ ] **Step 5: Run it on a device**

Run: `npx expo start`, walk onboarding as a free user to `results`: the grid renders with Overall clear and the other five under blur, the lock line centred on the lower pane, the counts panel below unblurred. Then on a Pro build open a vehicle: the grid at the top, no blur, the Safety & Paperwork caption changing from "Recalls not checked" to a count within a few seconds on Wi-Fi. Turn airplane mode on and reopen: the cached count still shows.

---

## Self-review

**Spec coverage.** Groups, item values, six tiles in order, Potential ≥ Overall, recalls as zero items, band thresholds, two-tone colours — Task 1 and 4. Fetch with timeout/undefined/never-throws and the 7-day `app_state` cache — Task 2. `health.*` keys in every base catalog — Task 3. `HealthGrid`/`HealthBar`, locked state with the Overall teaser, no entrance animation — Task 4. Results screen: grid above the unchanged counts, locked for `pro !== true`, `health_grid_shown` once per plan — Task 5. Vehicle screen: Pro only, not rendered for free, recalls arriving in place — Task 6. Comment rewrites — Task 7. Privacy-label note needs no code. Tap-to-scroll on the vehicle screen was listed as v1 in the spec's screen section but as a follow-up in the same sentence; it is left out here and stays out of scope.

**Deviations from the spec, on purpose.** (1) The spec's empty-score numeral "—" would fail the existing no-dash assertion over every onboarding screen, so the slot renders empty with the "Nothing logged yet" caption. (2) `HealthTile.current` is added so the caption "7 of 9 current" is a field rather than re-derived in the view. (3) Recalls are folded into Overall and Potential as well as Safety & Paperwork, so the headline number cannot say 100 over an open recall; the spec named only the one tile.

**Placeholder scan.** None.

**Type consistency.** `buildHealth(plan, openRecalls?)`, `HealthTile.{key,score,current,scored,unknown,total,openRecalls}`, `cachedRecalls(id, now?)`, `openRecallsFor(vehicle, now?)`, `HealthGrid({health, locked, testID?})`, `trackHealthShown(health)` — same names in every task that uses them.
