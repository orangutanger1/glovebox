# App Design A v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give arm A of `app_design` a look of its own, as "A v2": a display face and a monospace face, a single large figure on Today, illustrated service stickers, a road on the Upcoming tab, a full-screen "logged" moment and a warmer page. Separately, fix the dark header on A's vehicle screen now.

**Architecture:** Everything except Task 1 sits behind a new `isDesignV2()` gate (`src/design/theme.ts`). It is true only inside arm A, and for now only on a build that pins it (`EXPO_PUBLIC_DESIGN_V2=1`, a new `design-v2-check` EAS profile). Store builds never turn it on. How v2 reaches users (a new A/B against A, or replacing A) is decided after the `app_design` read (~11-03) and is **out of scope here**. Pure rules (the hero figure, the road's stops, the "next" after a log) go in `src/redesign/model.ts` and are tested in Node; screens read them.

**Tech Stack:** Expo 57 / React Native 0.86, TypeScript, expo-router, expo-font + `@expo-google-fonts/*` (JS and font assets only, so OTA-safe), expo-haptics, Jest (ts-jest `logic` project for `.test.ts`, jest-expo `screens` project for `.test.tsx`), Python + ffmpeg for the mascot regrade (`design-source/mascot/anim/grade.py`), kie.ai (gpt-image-2.5, image-to-image) for four new stickers.

**Spec:** No separate spec. The brief is the 2026-10-13 review of three reference videos (karen, egglu, Eden "after" designs) and the mock canvas https://claude.ai/artifact/EgUL15UAW2x6iX9WHDTnG1 (Today and vehicle, A now vs A v2). It is restated under "Design brief" below so this plan stands alone.

## Design brief

What the three references share and arm A lacks: a look of its own, readable from any single screenshot.

1. **Typography.** Bricolage Grotesque (display: greeting, hero figure, headlines, bubble) and DM Mono (small uppercase spaced-out labels, right-hand values, odometer). Body stays the system font.
2. **A road.** The Upcoming tab becomes a road. The car sits at its odometer reading, services ahead appear as signposts in due order, and overdue services sit behind the car in red. This is the counterpart to karen's lily-pad path.
3. **One big figure on Today.** The most urgent thing as one number ("2,210 mi over", or a date). The three-ring row is replaced by a "Next up" list with a thin bar per row.
4. **Service stickers.** Coloured sticker icons (style of `assets/intro/*.png`) replace the tinted line icons in every service row. Line icons stay for chrome (tab bar, back, settings).
5. **Full-screen moments.** Logging a service shows a full-colour screen (celebrating car, "Oil change logged.", when it's next due) instead of the toast.
6. **Warmer page.** A warm off-white page instead of `#F4F4F7`. The mascot loops are regraded to it.
7. **Bug (A today).** A's vehicle screen shows a dark header bar with a barely visible title (see `research/redesign/before-after.jpg`, vehicle frame).

## Prerequisite: the service explainers

The service explainers (spec `docs/superpowers/specs/2026-10-13-service-explainers-design.md`, DECISIONS "Service explainers, built 2026-10-13") are **built but uncommitted** in the working tree: `app/explain.tsx`, `src/explain/`, and edits to `app/_layout.tsx`, `app/vehicle/[id].tsx`, `app/vehicle/[id]/log.tsx`, `src/redesign/VehicleScreen.tsx`, `src/notify/*`, the i18n catalogs and tests. Tasks 1, 3, 7, 9 and 10 edit the same files. **Before Task 1:** ask the user to commit the explainers (or confirm they should be committed), so this plan's commits never mix with them and either piece can be reverted alone. Explainers ship the same in both `app_design` arms; v2 only restyles their screen (Task 10) and must keep every way into it working.

## Global Constraints

- **Arm B never changes.** Every v2 branch is `isDesignV2()`, which is false outside arm A. Arm A itself does not change until v2 is explicitly turned on, except for Task 1's bug fix.
- **No native change.** No new native module, no `app.json` plugin change. `runtimeVersion` policy is `appVersion`, so a native change would silently break OTA compatibility for 1.3.0. Fonts come from `@expo-google-fonts/*` (JS and `.ttf` assets) loaded by `expo-font`, which is already in the binary.
- **No OTA without an explicit ask from the user.** Task 1 is ready to ship on its own; still ask first.
- **The funnel does not differ.** No onboarding step, paywall, price, timer or copy under test changes. v2 touches only post-onboarding screens (Today, Upcoming, vehicle, the logged moment) and the shared page colour.
- **Events unchanged.** No new analytics events, no renamed ones. Do not edit `src/analytics/index.ts`.
- **No em dashes (—) or en dashes (–) in app copy.** Typographic apostrophe U+2019 (’), never ASCII `'`.
- **16 locales.** Every new key goes into `src/i18n/catalog/en/redesign.ts` and the 10 full catalogs (`de fr it es ptBR nl sv pl ja ko`) with real translations. Regional overlays (`enGB enAU enCA frCA esMX`) only override keys that exist. `tests/i18n.test.ts` enforces parity.
- **ja and ko keep the system font.** Neither face has CJK glyphs. The type helpers return no `fontFamily` for those languages.
- **Health is not a score.** Bars and figures are the user's own interval left or overrun (see DECISIONS, `app_design`, "Health is not a score").
- **Contrast.** Text ≥ 4.5:1 (≥ 3:1 at 24 px+). White on `#4C7DFF` is 3.6:1, so the logged screen uses `#3A64E0` (white on it ≈ 5:1).
- **Reduce Motion.** Stills instead of loops, no slide or scale entrances, fades only.
- **Mono uppercase labels: at most three per screen.** `tokens.text.legend` notes that spaced uppercase on every label was the most dated thing in the classic app. v2 brings it back only in DM Mono, sparingly.
- Run one project: `npx jest --selectProjects logic --testPathPattern <name>` or `--selectProjects screens`. Whole suite: `npx jest`. Type check: `npx tsc --noEmit`.
- Commit after every task. Conventional Commits, subject ≤ 50 chars. Update `docs/DECISIONS.md` in the same commit as any decision (CLAUDE.md).

## Review Focus

1. **Fresh install, first frame.** The arm row does not exist yet, so `isDesignV2()` must be false and nothing may render with an unloaded custom font. Expected: classic look, no red-box "Unrecognized font family". Test in Task 3.
2. **Fonts not loaded yet (or failed to load).** Every v2 text must fall back to the system font. Expected: same layout, system face, no crash. Test in Task 3.
3. **A car with no odometer, or with only date-based intervals.** Expected: the hero shows a date figure. The road shows no "you're here" reading, and stops are placed by date order only. Tests in Tasks 6 and 8.
4. **Multiple cars.** Expected: the hero picks the most urgent service across all cars and names that car. The road draws one section per car, most urgent car first. Tests in Tasks 6 and 8.
5. **Logging a service that has no interval (custom type), or logging from the vehicle screen vs Today.** Expected: the logged screen shows the title and no "next" line, and it appears once on whichever screen takes the `takeLogged()` signal. Test in Task 9.
6. **Explainer entry points after the restyle.** Every service row that opened an explainer before v2 still does in v2. That means the vehicle screen's care rows (`due_row` / `service_row`), History rows, the log form and due notifications. "Log this service" from an explainer leads to the log form, then to the logged moment, shown once. Tests in Tasks 7 and 10.

---

### Task 1: Fix the dark header on A's vehicle screen (ships independently)

**Files:**
- Modify: `app/_layout.tsx` (around lines 459–475, `Chrome` and its `Stack screenOptions`) and/or `src/redesign/VehicleScreen.tsx:573` (its `Stack.Screen options`), depending on the root cause
- Test: `tests/redesign-vehicle.test.tsx`

**Interfaces:** Produces nothing other tasks use.

This is a bug. Use **superpowers:systematic-debugging**: reproduce, find the root cause, and only then fix it.

- [ ] **Step 1: Reproduce.** Build or run the `redesign-check` profile in the simulator (`EXPO_PUBLIC_APP_DESIGN=redesign npx expo start`), open a vehicle, and screenshot the header. Then do a fresh install (delete the app) on a store-like build where the arm is *assigned* rather than pinned, and repeat.

- [ ] **Step 2: Test the leading hypothesis.** `Chrome`'s `screenOptions` read `tokens.color.housing` and `tokens.color.text` during render. On a fresh install the first render happens **before** `assignExperiments` writes the `app_design` row (`app/_layout.tsx:256`), so `isRedesign()` returns false and the header is built with classic colours (dark page, light text) and never rebuilt. The before/after frame (dark bar, dark title) does not fully match this (it would give a light title), so also check:
  - (a) whether `RedesignVehicle`'s `headerTitle` Pressable draws its own dark background
  - (b) `headerTransparent` / `headerBlurEffect` defaults on iOS 26
  - (c) whether `Chrome` re-renders after boot (does `holding` flip?)

  Log `isRedesign()` and the resolved `headerStyle` inside `Chrome` render and inside `RedesignVehicle` render.

- [ ] **Step 3: Write the failing test** for the cause you found. If it is the header options, render `RedesignVehicle` with the arm set and assert on the options passed to `Stack.Screen`. Change the existing mock to capture them:

```tsx
const screenOptions: Record<string, unknown>[] = [];
jest.mock("expo-router", () => ({
  // ...existing mocks...
  Stack: { Screen: ({ options }: { options: Record<string, unknown> }) => { screenOptions.push(options); return null; } },
}));

test("arm A's vehicle header sits on the light page", () => {
  setArm("redesign"); // the file's existing helper for writing experiment.app_design
  render(); // existing helper
  const last = screenOptions[screenOptions.length - 1];
  expect(last.headerStyle).toEqual({ backgroundColor: "#F4F4F7" });
  expect(last.headerTintColor).toBe("#16161A");
});
```

- [ ] **Step 4: Run it and confirm it fails.** Run: `npx jest --selectProjects screens --testPathPattern redesign-vehicle`. Expected: FAIL on `headerStyle`.

- [ ] **Step 5: Minimal fix.** If the cause is render order, set the header colours on `RedesignVehicle`'s own `Stack.Screen`, read at its render (by then the arm is known, because the user can't reach a vehicle before boot finishes):

```tsx
<Stack.Screen
  options={{
    title: vehicle?.name ?? t("vehicle.title"),
    headerStyle: { backgroundColor: tokens.color.housing },
    headerTintColor: tokens.color.text,
    contentStyle: { backgroundColor: tokens.color.housing },
    headerShadowVisible: false,
    headerTitle: () => ( /* unchanged */ ),
  }}
/>
```

  If the cause is elsewhere, fix that instead and adjust the test.

- [ ] **Step 6: Run the test, then the suite.** `npx jest --selectProjects screens --testPathPattern redesign-vehicle`: PASS. Then `npx jest` and `npx tsc --noEmit`.

- [ ] **Step 7: Device check.** Screenshot on the `redesign-check` build: light header, readable title.

- [ ] **Step 8: Commit and log it.** Add a line to the ship log `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` ("arm A vehicle header fix, post-onboarding only, does not touch the paywall metric"). Then:

```bash
git add app/_layout.tsx src/redesign/VehicleScreen.tsx tests/redesign-vehicle.test.tsx docs/superpowers/specs/2026-08-26-funnel-comparability-register.md
git commit -m "fix(redesign): light header on vehicle screen"
```

Stop here and ask the user before publishing an OTA.

---

### Task 2: The `isDesignV2()` gate and the `design-v2-check` profile

**Files:**
- Modify: `src/design/theme.ts`
- Modify: `eas.json` (new profile after `redesign-check`)
- Test: `tests/experiments.test.ts` (the existing EAS-profile test near line 127), new `tests/design-v2.test.ts`

**Interfaces:**
- Produces: `export function isDesignV2(): boolean` from `src/design/theme.ts`.

- [ ] **Step 1: Write the failing tests** in `tests/design-v2.test.ts`:

```ts
const state = new Map<string, string>();
jest.mock("../src/db/state", () => ({ getState: (k: string) => state.get(k) ?? null }));

function load(env: Record<string, string | undefined>) {
  jest.resetModules();
  const prev = { ...process.env };
  Object.assign(process.env, env);
  const mod = require("../src/design/theme") as typeof import("../src/design/theme");
  process.env = prev;
  return mod;
}

test("off without the pin, even in arm A", () => {
  state.set("experiment.app_design", "redesign");
  expect(load({ EXPO_PUBLIC_DESIGN_V2: undefined, EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(false);
});

test("on with the pin in arm A", () => {
  state.set("experiment.app_design", "redesign");
  expect(load({ EXPO_PUBLIC_DESIGN_V2: "1", EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(true);
});

test("never in arm B, pin or not", () => {
  state.set("experiment.app_design", "classic");
  expect(load({ EXPO_PUBLIC_DESIGN_V2: "1", EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(false);
});

test("never before the arm is assigned", () => {
  state.clear();
  expect(load({ EXPO_PUBLIC_DESIGN_V2: "1", EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(false);
});
```

  In `tests/experiments.test.ts`, next to the existing production-profile assertions:

```ts
expect(eas.build.production.env?.EXPO_PUBLIC_DESIGN_V2).toBeUndefined();
expect(eas.build["design-v2-check"].env).toEqual({ EXPO_PUBLIC_APP_DESIGN: "redesign", EXPO_PUBLIC_DESIGN_V2: "1" });
```

  Note: babel-preset-expo inlines `EXPO_PUBLIC_*` at bundle time. If `load()` doesn't see the env under ts-jest, read the env through a tiny `env.ts` module and mock that module instead.

- [ ] **Step 2: Run and confirm they fail.** `npx jest --selectProjects logic --testPathPattern "design-v2|experiments"`. Expected: FAIL, `isDesignV2 is not a function` / missing profile.

- [ ] **Step 3: Implement** in `src/design/theme.ts`, after `isRedesign`:

```ts
/**
 * Arm A's second look (docs/superpowers/plans/2026-10-13-app-design-v2.md).
 * Inside arm A only, and for now only on a build that pins it: how v2 reaches
 * users is decided after the `app_design` read. Read at render time, like
 * `isRedesign`.
 */
const V2_PIN = process.env.EXPO_PUBLIC_DESIGN_V2;

export function isDesignV2(): boolean {
  return V2_PIN === "1" && isRedesign();
}
```

  In `eas.json`, add after `redesign-check`:

```json
"design-v2-check": {
  "extends": "preview",
  "env": {
    "EXPO_PUBLIC_APP_DESIGN": "redesign",
    "EXPO_PUBLIC_DESIGN_V2": "1"
  }
},
```

  Analytics stay off on this profile for the same reason as `redesign-check`. Check how `redesign-check` turns them off (grep `EXPO_PUBLIC_APP_DESIGN` in `src/analytics`) and make sure the same condition covers this profile. It does if the condition is "`EXPO_PUBLIC_APP_DESIGN` is set".

- [ ] **Step 4: Run the tests.** Same command. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/design/theme.ts eas.json tests/design-v2.test.ts tests/experiments.test.ts
git commit -m "feat(design): isDesignV2 gate and check profile"
```

---

### Task 3: Fonts and v2 type styles

**Files:**
- Modify: `package.json` (via `npx expo install`)
- Create: `src/design/type.ts`
- Modify: `app/_layout.tsx` (load fonts in `RootLayout`)
- Test: `tests/design-type.test.ts`

**Interfaces:**
- Consumes: `isDesignV2()` (Task 2), `getLanguage()` from `src/i18n`.
- Produces, from `src/design/type.ts`:
  ```ts
  export const FONT_ASSETS: Record<string, number>;      // for useFonts
  export function markFontsLoaded(): void;
  export function resetFontsLoaded(): void;              // test seam
  export type V2Style = { fontFamily?: string; fontSize: number; lineHeight?: number; letterSpacing?: number; fontWeight?: "400" | "500" | "600" | "700" | "800"; textTransform?: "uppercase"; fontVariant?: "tabular-nums"[] };
  export const v2: {
    greeting(): V2Style;   // 30/34, display 800
    figure(): V2Style;     // 68/68, display 800, tabular
    headline(): V2Style;   // 20/26, display 700
    bubble(): V2Style;     // 16/20, display 500
    label(): V2Style;      // 11, mono 500, +1.6 tracking, uppercase
    value(): V2Style;      // 13, mono 500, tabular
    odometer(): V2Style;   // 24, mono 500, tabular
  };
  ```
  Each returns the custom family only when `isDesignV2() && loaded && !["ja","ko"].includes(getLanguage())`. Otherwise it returns the same size and spacing with a system weight and no `fontFamily` (and no uppercase for ja/ko).

- [ ] **Step 1: Install the fonts.**

```bash
npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/dm-mono
ls node_modules/@expo-google-fonts/bricolage-grotesque node_modules/@expo-google-fonts/dm-mono
```

  Confirm the export names used below exist (`BricolageGrotesque_500Medium`, `_700Bold`, `_800ExtraBold`, `DMMono_400Regular`, `DMMono_500Medium`). If a weight is missing, use the nearest one and change `type.ts` to match. Confirm that neither package adds a config plugin or native code (`cat node_modules/@expo-google-fonts/dm-mono/package.json`).

- [ ] **Step 2: Write the failing test** `tests/design-type.test.ts`:

```ts
let v2On = true;
let lang = "en";
jest.mock("../src/design/theme", () => ({ isDesignV2: () => v2On, isRedesign: () => true }));
jest.mock("../src/i18n", () => ({ getLanguage: () => lang }));
jest.mock("@expo-google-fonts/bricolage-grotesque", () => ({
  BricolageGrotesque_500Medium: 1, BricolageGrotesque_700Bold: 2, BricolageGrotesque_800ExtraBold: 3,
}));
jest.mock("@expo-google-fonts/dm-mono", () => ({ DMMono_400Regular: 4, DMMono_500Medium: 5 }));

import { markFontsLoaded, resetFontsLoaded, v2 } from "../src/design/type";

beforeEach(() => { v2On = true; lang = "en"; resetFontsLoaded(); });

test("no custom family before the fonts load", () => {
  expect(v2.figure().fontFamily).toBeUndefined();
  expect(v2.figure().fontSize).toBe(68);
});

test("custom family once loaded, in v2", () => {
  markFontsLoaded();
  expect(v2.figure().fontFamily).toBe("BricolageGrotesque_800ExtraBold");
  expect(v2.label().fontFamily).toBe("DMMono_500Medium");
  expect(v2.label().textTransform).toBe("uppercase");
});

test("system font outside v2", () => {
  markFontsLoaded();
  v2On = false;
  expect(v2.greeting().fontFamily).toBeUndefined();
});

test.each(["ja", "ko"])("system font and no uppercase in %s", (l) => {
  markFontsLoaded();
  lang = l;
  expect(v2.greeting().fontFamily).toBeUndefined();
  expect(v2.label().textTransform).toBeUndefined();
});
```

- [ ] **Step 3: Run and confirm it fails.** `npx jest --selectProjects logic --testPathPattern design-type`. Expected: FAIL, module not found.

- [ ] **Step 4: Implement** `src/design/type.ts`:

```ts
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { isDesignV2 } from "./theme";
import { getLanguage } from "../i18n";

/**
 * A v2's two faces: Bricolage Grotesque for what the eye lands on (the
 * greeting, the one big figure, headlines, the car's line) and DM Mono for
 * readings and the few small spaced labels, the way an odometer prints. Body
 * copy stays the system face.
 *
 * Every style falls back to the system face, same size, until the fonts have
 * loaded, outside v2, and in Japanese and Korean (neither face has the glyphs).
 */
export const FONT_ASSETS = {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  DMMono_400Regular,
  DMMono_500Medium,
};

let loaded = false;
export function markFontsLoaded(): void { loaded = true; }
export function resetFontsLoaded(): void { loaded = false; }

const NO_LATIN_FACE = new Set(["ja", "ko"]);

function on(): boolean {
  return loaded && isDesignV2() && !NO_LATIN_FACE.has(getLanguage());
}

export type V2Style = {
  fontFamily?: string;
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: "400" | "500" | "600" | "700" | "800";
  textTransform?: "uppercase";
  fontVariant?: "tabular-nums"[];
};

function face(family: string, systemWeight: V2Style["fontWeight"], base: V2Style): V2Style {
  // A custom family carries its own weight; setting fontWeight as well makes
  // iOS synthesise a bolder one.
  return on() ? { ...base, fontFamily: family } : { ...base, fontWeight: systemWeight };
}

const TAB: "tabular-nums"[] = ["tabular-nums"];

export const v2 = {
  greeting: () => face("BricolageGrotesque_800ExtraBold", "700", { fontSize: 30, lineHeight: 34, letterSpacing: -0.8 }),
  figure: () => face("BricolageGrotesque_800ExtraBold", "700", { fontSize: 68, lineHeight: 68, letterSpacing: -2.5, fontVariant: TAB }),
  headline: () => face("BricolageGrotesque_700Bold", "700", { fontSize: 20, lineHeight: 26, letterSpacing: -0.4 }),
  bubble: () => face("BricolageGrotesque_500Medium", "500", { fontSize: 16, lineHeight: 20 }),
  label: () => {
    const upper = !NO_LATIN_FACE.has(getLanguage());
    return face("DMMono_500Medium", "600", {
      fontSize: 11,
      letterSpacing: upper ? 1.6 : 0.2,
      ...(upper ? { textTransform: "uppercase" as const } : {}),
    });
  },
  value: () => face("DMMono_500Medium", "600", { fontSize: 13, fontVariant: TAB }),
  odometer: () => face("DMMono_500Medium", "600", { fontSize: 24, fontVariant: TAB }),
};
```

- [ ] **Step 5: Load the fonts** in `RootLayout` (`app/_layout.tsx`), next to the other boot hooks:

```tsx
import { useFonts } from "expo-font";
import { FONT_ASSETS, markFontsLoaded } from "../src/design/type";
// inside RootLayout:
const [fontsLoaded] = useFonts(FONT_ASSETS);
if (fontsLoaded) markFontsLoaded();
```

  Do not hold the splash on fonts. Arm A's `LaunchCurtain` covers the first ~560 ms anyway, and until load the styles fall back to the system face. Loading also runs in arm B. That's harmless (nothing in B reads `v2`) and avoids depending on when the arm is known.

- [ ] **Step 6: Run the tests, the suite and tsc.** `npx jest --selectProjects logic --testPathPattern design-type`: PASS. Then `npx jest`, `npx tsc --noEmit`.

- [ ] **Step 7: Commit.**

```bash
git add package.json package-lock.json src/design/type.ts app/_layout.tsx tests/design-type.test.ts
git commit -m "feat(design): v2 display and mono faces"
```

---

### Task 4: Warmer page for v2, and the mascot loops regraded to it

**Files:**
- Modify: `src/design/tokens.ts` (`LIGHT_COLOR`, `themed`)
- Modify: `design-source/mascot/anim/grade.py` (`PAGE` from an argument)
- Create: `assets/mascot/v2/car-{happy,heads-up,worried,sleepy,celebrating}.gif`
- Modify: `src/mascot/Mascot.tsx` (pick the loop set)
- Test: `tests/design-v2.test.ts` (extend)

**Interfaces:**
- Consumes: `isDesignV2()`.
- Produces: `tokens.color.housing` etc. return the v2 values when `isDesignV2()`. Exports `V2_PAGE` (the hex) from `src/design/tokens.ts`.

- [ ] **Step 1: Pick the page.** The candidate is `#F6F3EE` (warm off-white). Check contrast of `textMuted` (`rgba(22,22,26,0.60)`) and `textFaint` (`rgba(22,22,26,0.46)`) on it, and of `#C42B30` / `#B65A00` labels:

```bash
python3 -I -c "
def L(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c:c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def mix(fg,a,bg): return ''.join('%02x'%round(int(fg[i:i+2],16)*a+int(bg[i:i+2],16)*(1-a)) for i in (0,2,4))
bg='F6F3EE'
for name,fg in [('muted',mix('16161A',.60,bg)),('faint',mix('16161A',.46,bg)),('red','C42B30'),('amber','B65A00')]:
    a,b=sorted([L(fg),L(bg)]); print(name,round((b+.05)/(a+.05),2))
"
```

  Expected: muted ≥ 4.5, red and amber ≥ 4.5. `faint` is used for captions only and may land near 3.6, which matches today's `#F4F4F7`. Show the user the page on a device (Step 7) before committing to the hex.

- [ ] **Step 2: Write the failing test** (append to `tests/design-v2.test.ts`):

```ts
test("v2 warms the page; arm A without v2 keeps #F4F4F7", () => {
  state.set("experiment.app_design", "redesign");
  const withV2 = load({ EXPO_PUBLIC_DESIGN_V2: "1", EXPO_PUBLIC_APP_DESIGN: undefined });
  const { tokens: t2 } = require("../src/design/tokens");
  expect(t2.color.housing).toBe("#F6F3EE");
  const without = load({ EXPO_PUBLIC_DESIGN_V2: undefined, EXPO_PUBLIC_APP_DESIGN: undefined });
  const { tokens: t1 } = require("../src/design/tokens");
  expect(t1.color.housing).toBe("#F4F4F7");
});
```

- [ ] **Step 3: Run and confirm it fails.** Expected: `#F4F4F7` ≠ `#F6F3EE`.

- [ ] **Step 4: Implement** in `src/design/tokens.ts`:

```ts
import { isDesignV2, isRedesign } from "./theme";

/** A v2's page: warm off-white instead of Bevel's cool grey. The keys that are
 *  "the page, a shade down" move with it; everything else is LIGHT_COLOR. */
export const V2_PAGE = "#F6F3EE";
const V2_COLOR: typeof CLASSIC_COLOR = {
  ...LIGHT_COLOR,
  housing: V2_PAGE,
  surfaceHi: "#EFEBE4",
  sunken: "#ECE8E1",
  edgeSolid: "#ECE8E1",
};

function themed<T extends object>(classic: T, light: T, v2: T = light): T {
  const out = {} as T;
  for (const key of Object.keys(classic) as (keyof T)[]) {
    Object.defineProperty(out, key, {
      enumerable: true,
      get: () => (isRedesign() ? (isDesignV2() ? v2[key] : light[key]) : classic[key]),
    });
  }
  return out;
}

// in `tokens`:
color: themed(CLASSIC_COLOR, LIGHT_COLOR, V2_COLOR),
```

  `LaunchCurtain` already opens onto `tokens.color.housing`, so it follows the page.

- [ ] **Step 5: Regrade the loops.** In `grade.py`, make `PAGE` an argument:

```python
def main(out_dir, page_hex="F4F4F7"):
    global PAGE
    PAGE = np.array([int(page_hex[i:i + 2], 16) for i in (0, 2, 4)], float)
    ...

if __name__ == "__main__":
    main(*sys.argv[1:])
```

  Then run it from the folder that holds the clips:

```bash
cd design-source/mascot/anim && mkdir -p ../../../assets/mascot/v2 && python3 -I grade.py ../../../assets/mascot/v2 F6F3EE
```

  Expected: five GIFs, similar sizes to today's (~250–400 KB each). Confirm byte-for-byte that the shipped `assets/mascot/car-*.gif` did not change (`git status assets/mascot`).

- [ ] **Step 6: Pick the set** in `src/mascot/Mascot.tsx`:

```tsx
import { isDesignV2 } from "../design/theme";

const LOOP_V2: Record<Mood, number> = {
  happy: require("../../assets/mascot/v2/car-happy.gif"),
  "heads-up": require("../../assets/mascot/v2/car-heads-up.gif"),
  worried: require("../../assets/mascot/v2/car-worried.gif"),
  sleepy: require("../../assets/mascot/v2/car-sleepy.gif"),
  celebrating: require("../../assets/mascot/v2/car-celebrating.gif"),
};
// where the loop source is chosen:
const source = (isDesignV2() ? LOOP_V2 : LOOP)[mood];
```

  Cost: about +1.7 MB in the OTA bundle for everyone until v2 is decided. Note this in the commit body.

- [ ] **Step 7: Run tests, then do a device check** on the `design-v2-check` build: the car on Today and the vehicle screen shows no visible box or halo around the loop. Show the user, and adjust the hex if they want (rerun Step 5).

- [ ] **Step 8: Commit.**

```bash
git add src/design/tokens.ts src/mascot/Mascot.tsx design-source/mascot/anim/grade.py assets/mascot/v2 tests/design-v2.test.ts
git commit -m "feat(design): warm v2 page and regraded loops"
```

---

### Task 5: Service stickers

**Files:**
- Create: `assets/stickers/{oil,tire,brake,filter,wiper,battery,coolant,spark,wrench}.png` (192 px, transparent; @2x/@3x not needed at ≤ 48 pt render, matching `assets/intro/*.png`)
- Create: `design-source/stickers/` (generation prompts and sources)
- Create: `src/redesign/stickers.tsx`
- Modify: `src/redesign/ui.tsx` (`TaskRow`), `src/redesign/icons.tsx` (`UpcomingRow`), `src/redesign/VehicleScreen.tsx` (To-do, Care plan and History rows)
- Test: `tests/redesign-stickers.test.ts`

**Interfaces:**
- Consumes: `isDesignV2()`, `serviceIcon()` keys.
- Produces:
  ```ts
  export type StickerName = "oil" | "tire" | "brake" | "filter" | "wiper" | "battery" | "coolant" | "spark" | "wrench";
  export function stickerFor(serviceType: string): StickerName;   // unknown → "wrench"; "tread" → "tire"
  export function ServiceSticker(props: { type: string; size?: number }): JSX.Element;  // default size 36
  ```

- [ ] **Step 1: Reuse five stickers.** Copy `assets/intro/{oil,tyre,battery,plug,wrench}.png` to `assets/stickers/{oil,tire,battery,spark,wrench}.png`. They are already transparent cutouts with no glow (checked 2026-10-13). Only the 2k source sheet `design-source/intro/stickers-2k.png` has the glow baked in.

- [ ] **Step 2: Generate four more** (brake, filter, wiper, coolant) on kie.ai: gpt-image-2.5, image-to-image, with `assets/intro/oil.png` and `assets/intro/battery.png` as style references. Prompt: same flat sticker style, blue `#4C7DFF` body, pale `#D6E0FF` panels, slate `#3A4256` details, no outline, no glow, no shadow, centred on plain white, one object:
  - "a brake disc with caliper"
  - "an engine air filter"
  - "a windscreen wiper blade"
  - "a coolant bottle with a thermometer mark"

  Check the credit price before running. Cut out each one to transparent and downscale to 192 px, then save the sources and prompts in `design-source/stickers/`. Show the user all nine side by side before continuing.

- [ ] **Step 3: Write the failing test** `tests/redesign-stickers.test.ts`:

```ts
import { stickerFor } from "../src/redesign/stickers";

test("every built-in service has its own sticker", () => {
  expect(stickerFor("Oil Change")).toBe("oil");
  expect(stickerFor("Tire Rotation")).toBe("tire");
  expect(stickerFor("Brake Inspection")).toBe("brake");
  expect(stickerFor("Air Filter")).toBe("filter");
  expect(stickerFor("Cabin Air Filter")).toBe("filter");
  expect(stickerFor("Wiper Blades")).toBe("wiper");
  expect(stickerFor("Battery Check")).toBe("battery");
  expect(stickerFor("Coolant Flush")).toBe("coolant");
  expect(stickerFor("Spark Plugs")).toBe("spark");
});

test("worn tread is a tyre; anything custom is the wrench", () => {
  expect(stickerFor("tread")).toBe("tire");
  expect(stickerFor("Timing belt (my own)")).toBe("wrench");
});
```

- [ ] **Step 4: Run and confirm it fails.** `npx jest --selectProjects logic --testPathPattern redesign-stickers`.

- [ ] **Step 5: Implement** `src/redesign/stickers.tsx`:

```tsx
import { Image } from "react-native";

/**
 * A v2's service stickers: the intro's flat blue stickers, one per service, in
 * every row that names a service. Chrome (tabs, back, settings) keeps the line
 * icons in icons.tsx.
 */
const STICKERS = {
  oil: require("../../assets/stickers/oil.png"),
  tire: require("../../assets/stickers/tire.png"),
  brake: require("../../assets/stickers/brake.png"),
  filter: require("../../assets/stickers/filter.png"),
  wiper: require("../../assets/stickers/wiper.png"),
  battery: require("../../assets/stickers/battery.png"),
  coolant: require("../../assets/stickers/coolant.png"),
  spark: require("../../assets/stickers/spark.png"),
  wrench: require("../../assets/stickers/wrench.png"),
} as const;

export type StickerName = keyof typeof STICKERS;

const BY_SERVICE: Record<string, StickerName> = {
  "Oil Change": "oil",
  "Tire Rotation": "tire",
  tread: "tire",
  "Brake Inspection": "brake",
  "Air Filter": "filter",
  "Cabin Air Filter": "filter",
  "Wiper Blades": "wiper",
  "Battery Check": "battery",
  "Coolant Flush": "coolant",
  "Spark Plugs": "spark",
};

export function stickerFor(serviceType: string): StickerName {
  return BY_SERVICE[serviceType] ?? "wrench";
}

export function ServiceSticker({ type, size = 36 }: { type: string; size?: number }) {
  return (
    <Image
      source={STICKERS[stickerFor(type)]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
```

  Add a `type?: string` prop to `TaskRow`. When `isDesignV2() && type`, draw `<ServiceSticker type={type} />` to the left of the title. The check button stays: it is the row's action, and moves to the right. In `UpcomingRow`, swap the icon disc for the sticker when `isDesignV2()`. Do the same for the vehicle screen's To-do, Care plan and History rows. Pass `type` from every `TaskRow` call site (`Home.tsx` Today list, `VehicleScreen.tsx` To-do).

- [ ] **Step 6: Run the tests, then the screen tests** (`npx jest --selectProjects screens --testPathPattern redesign`), which must pass unchanged with v2 off. Then `npx tsc --noEmit`.

- [ ] **Step 7: Commit.**

```bash
git add assets/stickers design-source/stickers src/redesign tests/redesign-stickers.test.ts
git commit -m "feat(redesign): v2 service stickers"
```

---

### Task 6: Today, one big figure

**Files:**
- Modify: `src/redesign/model.ts` (add `heroFigure`)
- Create: `src/redesign/HeroCard.tsx`
- Modify: `src/redesign/Home.tsx` (header, bubble, ring row → hero + Next up, under `isDesignV2()`)
- Modify: `src/onboarding/Convo.tsx` (`Bubble` text style from `v2.bubble()`; post-onboarding only, see note)
- Modify: `src/i18n/catalog/en/redesign.ts` + 10 full catalogs
- Test: `tests/redesign-model.test.ts`, `tests/redesign-home.test.tsx`

**Interfaces:**
- Consumes: `VehicleView`, `byUrgency`, `v2.*` (Task 3), `ServiceSticker` (Task 5), `LifeBar` (`src/redesign/ui.tsx`).
- Produces:
  ```ts
  export type HeroFigure =
    | { kind: "over"; vehicleId: string; vehicleName: string; type: string; overBy: number; last: DueState["last"] }
    | { kind: "date"; vehicleId: string; vehicleName: string; type: string; status: "due" | "soon" | "ok"; dueAt: string }
    | { kind: "distance"; vehicleId: string; vehicleName: string; type: string; status: "due" | "soon" | "ok"; left: number };
  export function heroFigure(views: readonly VehicleView[], odometers: Record<string, number | undefined>): HeroFigure | null;
  ```

- [ ] **Step 1: Write the failing tests** (append to `tests/redesign-model.test.ts`, using its `car`, `rec` and `view` helpers):

```ts
import { heroFigure } from "../src/redesign/model";

describe("Today's one figure", () => {
  test("an overdue-by-distance service shows how far over", () => {
    const v = view(car("a", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    const fig = heroFigure([v], { a: 48210 });
    expect(fig?.kind).toBe("over");
    expect(fig?.type).toBe("Oil Change");
    if (fig?.kind === "over") expect(fig.overBy).toBe(v.next?.overBy);
  });

  test("a date-only interval shows its date", () => {
    const v = view(car("a"), [rec("Oil Change", "2026-09-01T00:00:00.000Z")]);
    const fig = heroFigure([v], { a: undefined });
    expect(fig?.kind).toBe("date");
  });

  test("the most urgent car wins across cars", () => {
    const ok = view(car("a", 1000), [rec("Oil Change", "2026-10-01T00:00:00.000Z", 900)]);
    const late = view(car("b", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    expect(heroFigure([ok, late], { a: 1000, b: 48210 })?.vehicleId).toBe("b");
  });

  test("nothing logged, no figure", () => {
    expect(heroFigure([view(car("a"), [])], { a: undefined })).toBeNull();
  });
});
```

- [ ] **Step 2: Run and confirm it fails.** `npx jest --selectProjects logic --testPathPattern redesign-model`.

- [ ] **Step 3: Implement** in `src/redesign/model.ts`:

```ts
export type HeroFigure =
  | { kind: "over"; vehicleId: string; vehicleName: string; type: string; overBy: number; last: DueState["last"] }
  | { kind: "date"; vehicleId: string; vehicleName: string; type: string; status: Status; dueAt: string }
  | { kind: "distance"; vehicleId: string; vehicleName: string; type: string; status: Status; left: number };

/** Today's one figure: the most urgent next service across every car, as the
 *  single number that says it best. Distance over beats a date; a date beats
 *  distance left, because it needs no odometer to be right. */
export function heroFigure(
  views: readonly VehicleView[],
  odometers: Record<string, number | undefined>,
): HeroFigure | null {
  const ranked = views
    .filter((v): v is VehicleView & { next: DueState } => v.next !== undefined)
    .sort((a, b) => byUrgency(a.next, b.next));
  const top = ranked[0];
  if (!top) return null;
  const s = top.next;
  const base = { vehicleId: top.vehicle.id, vehicleName: top.vehicle.name, type: s.type };
  if (s.overBy !== undefined) return { ...base, kind: "over", overBy: s.overBy, last: s.last };
  if (s.dueAt) return { ...base, kind: "date", status: s.status, dueAt: s.dueAt };
  const odo = odometers[top.vehicle.id];
  if (s.dueOdometer !== undefined && odo !== undefined) {
    return { ...base, kind: "distance", status: s.status, left: Math.max(0, s.dueOdometer - odo) };
  }
  return null;
}
```

- [ ] **Step 4: Run the model tests.** Expected: PASS.

- [ ] **Step 5: Add copy.** In `src/i18n/catalog/en/redesign.ts`:

```ts
"redesign.hero.overdue": "Overdue",
"redesign.hero.dueSoon": "Due soon",
"redesign.hero.next": "Next up",
"redesign.hero.overUnit": "{{unit}} over",
"redesign.hero.leftUnit": "{{unit}} to go",
"redesign.hero.lastDone": "Last done {{date}}",
"redesign.hero.lastDoneAt": "Last done {{date}} at {{reading}}",
```

  Translate them into `de fr it es ptBR nl sv pl ja ko`, with real translations and no dashes. Run `npx jest --testPathPattern i18n`.

- [ ] **Step 6: Build `HeroCard`** (`src/redesign/HeroCard.tsx`):

```tsx
import { Text, View } from "react-native";
import { tokens } from "../design/tokens";
import { v2 } from "../design/type";
import { t, formatNumber, formatShortDate, formatDueIn } from "../i18n";
import { distanceUnitLabel } from "../units/format"; // use the same helper VehicleScreen.tsx imports for "mi"/"km"
import { serviceName } from "../schedule/names";
import type { HeroFigure } from "./model";
import { ServiceSticker } from "./stickers";
import { LifeBar } from "./ui";

const RED_TEXT = "#C42B30";   // red at ≥4.5:1 on white, for small text
const AMBER_TEXT = "#B65A00";

export function HeroCard({ fig, showCar }: { fig: HeroFigure; showCar: boolean }) {
  const over = fig.kind === "over";
  const tone = over || fig.status === "due" ? RED_TEXT : fig.status === "soon" ? AMBER_TEXT : tokens.color.accent;
  const label = `${serviceName(fig.type)} · ${t(over || fig.status === "due" ? "redesign.hero.overdue" : fig.status === "soon" ? "redesign.hero.dueSoon" : "redesign.hero.next")}`;
  const figure =
    fig.kind === "over" ? formatNumber(fig.overBy)
    : fig.kind === "distance" ? formatNumber(fig.left)
    : formatShortDate(fig.dueAt);
  const unit =
    fig.kind === "over" ? t("redesign.hero.overUnit", { unit: distanceUnitLabel() })
    : fig.kind === "distance" ? t("redesign.hero.leftUnit", { unit: distanceUnitLabel() })
    : formatDueIn(fig.dueAt);
  const foot =
    fig.kind === "over"
      ? fig.last.odometer !== undefined
        ? t("redesign.hero.lastDoneAt", { date: formatShortDate(fig.last.performed_at), reading: `${formatNumber(fig.last.odometer)} ${distanceUnitLabel()}` })
        : t("redesign.hero.lastDone", { date: formatShortDate(fig.last.performed_at) })
      : null;

  return (
    <View
      accessible
      accessibilityLabel={`${label}. ${figure} ${unit}.${foot ? ` ${foot}.` : ""}`}
      style={{ backgroundColor: tokens.color.surface, borderRadius: tokens.radius.xl, padding: 20, gap: 10, ...tokens.shadow.ambient }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...v2.label(), color: tone }} numberOfLines={1}>{label}</Text>
        <ServiceSticker type={fig.type} size={34} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <Text style={{ ...v2.figure(), color: tokens.color.text }} adjustsFontSizeToFit numberOfLines={1}>{figure}</Text>
        <Text style={{ ...v2.value(), fontSize: 15, color: tokens.color.textMuted }}>{unit}</Text>
      </View>
      {over ? <LifeBar value={0} status="due" /> : null}
      {foot || showCar ? (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {[showCar ? fig.vehicleName : null, foot].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </View>
  );
}
```

  Before writing it, check what `LifeBar value={0}` draws: an empty bar. If it shows nothing for an overrun, pass `value={1}` with `status="due"` so the bar reads as full red, as in the mock. Use whichever `distanceUnitLabel` / `tokens.shadow` names the code really has (`grep -n "distanceUnitLabel" src/redesign/VehicleScreen.tsx`, `grep -n "shadow" src/design/tokens.ts`).

- [ ] **Step 7: Wire it into `Home.tsx`** behind `isDesignV2()`:
  - Date line: `todayLabel()` drawn with `v2.label()` and the car name when there's one car (`"MON · OCT 12 · MAZDA CX-5"`; join with ` · `).
  - Greeting: `v2.greeting()`.
  - Car row: in v2 the car sits left (`size={124}`) with the `Bubble` to its right (`tail="left"`), as in the mock.
  - Replace the `rings` `GlassCard` with `<HeroCard fig={hero} showCar={views.length > 1} />` when `hero` is non-null. Keep the existing empty state when it's null.
  - Under it, a "Next up" `SectionTitle` (`v2.label()`) and the remaining Today tasks as rows with `ServiceSticker`, a `LifeBar` (from `view.lives` for that type) and the `whenLabel` in `v2.value()` on the right. The hero's own service is left out of this list.
  - The `+` round button turns black (`tokens.color.text` background, white plus) in v2 only.

  In `Convo.tsx`'s `Bubble`, use `v2.bubble()` for the text. During onboarding `isDesignV2()` is still false on fresh installs unless pinned, and the pin is a check build, so the funnel is untouched. Keep it that way: **do not** let `isDesignV2()` turn on during onboarding when v2 later becomes an experiment arm. Record that in DECISIONS when the v2 test is designed.

- [ ] **Step 8: Screen test** in `tests/redesign-home.test.tsx`. With v2 pinned (mock `isDesignV2` → true) and the overdue-oil fixture, the tree contains the hero figure text (`formatNumber(overBy)`) and no `Ring`. With v2 off, the existing ring-row assertions still pass.

```tsx
test("v2 leads with one figure instead of rings", () => {
  v2On = true; // module-level flag read by a jest.mock of ../src/design/theme's isDesignV2
  const tree = render();
  expect(textOf(tree)).toContain("2,210");      // fixture: 48,210 now, due at 46,000
  expect(tree.root.findAll((n) => n.type === Ring)).toHaveLength(0);
});
```

  Pick the fixture so `overBy` is exactly 2,210 with the default oil interval. If the default interval isn't 5,000 mi, change the last-service reading so the overrun still comes out at 2,210.

- [ ] **Step 9: Run** `npx jest --selectProjects screens --testPathPattern redesign-home`, `npx jest`, `npx tsc --noEmit`.

- [ ] **Step 10: Commit.**

```bash
git add src/redesign src/onboarding/Convo.tsx src/i18n tests/redesign-model.test.ts tests/redesign-home.test.tsx
git commit -m "feat(redesign): v2 Today hero figure"
```

---

### Task 7: Vehicle screen in v2

**Files:**
- Modify: `src/design/OdometerRoll.tsx` (allow a static reading with no roll)
- Modify: `src/redesign/VehicleScreen.tsx` (hero, overdue card, row values)
- Test: `tests/redesign-vehicle.test.tsx`

**Interfaces:**
- Consumes: `OdometerRoll` (already used by `app/onboarding/odometer.tsx:110` as `<OdometerRoll value live />`), `v2.*`, `ServiceSticker`.
- Produces: `OdometerRoll` gains `still?: boolean` (no spin; digits rendered at rest). The default stays `false`, so onboarding is unchanged.

- [ ] **Step 1: Write the failing tests.**
  - With v2 on and `vehicle.odometer = 48210`, the vehicle screen renders an element with `accessibilityLabel` `"48,210 mi"` (the odometer reads as one number to VoiceOver, not six digits) and no plain readout `Text` with the same string.
  - With v2 on, pressing an overdue Oil Change care row pushes `explainPath("Oil Change", "due_row", "a")`, and pressing a History row pushes the `service_row` path. Use the file's `navigated` array and import `explainPath` from `../src/explain`. These pass today with v2 off; the point is that v2's restyle keeps the `Pressable` and its `onPress` (`src/redesign/VehicleScreen.tsx` around lines 437–452 and 696).

- [ ] **Step 2: Run and confirm it fails.** `npx jest --selectProjects screens --testPathPattern redesign-vehicle`.

- [ ] **Step 3: Implement.**
  - `OdometerRoll`: add `still`. When true (and always under Reduce Motion), place each wheel at its digit with no animation. Wrap it in a `View` with `accessible` and `accessibilityLabel={`${formatNumber(value)} ${distanceUnitLabel()}`}`. Read the file first: it has its own leading-zero and digit-count rules, so keep those.
  - `VehicleScreen` hero, in v2: `Mascot size={120} animate`, then `<OdometerRoll value={vehicle.odometer} still />` and the unit in `v2.value()`, then "Update odometer". The header title becomes the spec line (`2019 MAZDA CX-5`) in `v2.label()`, set through `headerTitle`. Keep the tap-to-edit `Pressable`.
  - The overdue card (currently a pink `redWash` card with "Oil Change: 2,210 mi over"): in v2 it's a white card with a `ServiceSticker` in a 52 pt `redWash` tile, an `OVERDUE` `v2.label()` in `#C42B30`, the title in `v2.headline()` and the last-done line in caption.
  - To-do rows: right-hand `whenLabel` in `v2.value()`, coloured `#C42B30` for due, `#B65A00` for soon, `tokens.color.accent` for ok.

- [ ] **Step 4: Run the tests.** Expected: PASS, and the onboarding screen tests are unchanged (`npx jest --selectProjects screens --testPathPattern onboarding`).

- [ ] **Step 5: Commit.**

```bash
git add src/design/OdometerRoll.tsx src/redesign/VehicleScreen.tsx tests/redesign-vehicle.test.tsx
git commit -m "feat(redesign): v2 vehicle screen"
```

---

### Task 8: The road (Upcoming tab, v2)

**Files:**
- Modify: `src/redesign/model.ts` (add `roadFor`)
- Create: `src/redesign/Road.tsx`
- Modify: `src/redesign/Home.tsx` (the `upcoming` segment renders `Road` sections in v2)
- Modify: `src/i18n/catalog/en/redesign.ts` + 10 full catalogs
- Test: `tests/redesign-model.test.ts`, `tests/redesign-home.test.tsx`

**Interfaces:**
- Consumes: `VehicleView`, `byUrgency`, `whenLabel` (`src/redesign/copy.ts`), `ServiceSticker`, `Mascot`, `v2.*`.
- Produces:
  ```ts
  export type Road = { vehicleId: string; vehicleName: string; odometer?: number; ahead: DueState[]; behind: DueState[] };
  export function roadFor(view: VehicleView): Road;        // ahead: status !== "due", soonest first, max 6; behind: status === "due", worst first
  export function roads(views: readonly VehicleView[]): Road[];   // cars with any state; most urgent car first
  ```

- [ ] **Step 1: Write the failing tests:**

```ts
import { roadFor, roads } from "../src/redesign/model";

describe("the road", () => {
  test("overdue services are behind the car, the rest ahead in due order", () => {
    const v = view(car("a", 48210), [
      rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000),
      rec("Tire Rotation", "2026-08-01T00:00:00.000Z", 45000),
      rec("Brake Inspection", "2026-04-27T00:00:00.000Z", 44000),
    ]);
    const r = roadFor(v);
    expect(r.behind.map((s) => s.type)).toContain("Oil Change");
    expect(r.ahead.every((s) => s.status !== "due")).toBe(true);
    const order = r.ahead.map((s) => s.type);
    expect([...r.ahead].sort((a, b) => (a.dueAt ?? "~").localeCompare(b.dueAt ?? "~")).map((s) => s.type)).toEqual(order);
    expect(r.odometer).toBe(48210);
  });

  test("at most six signs ahead", () => {
    const many = ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter", "Cabin Air Filter", "Wiper Blades", "Battery Check", "Coolant Flush"]
      .map((type) => rec(type, "2026-10-01T00:00:00.000Z", 48000));
    expect(roadFor(view(car("a", 48210), many)).ahead.length).toBeLessThanOrEqual(6);
  });

  test("no odometer, no reading on the road", () => {
    expect(roadFor(view(car("a"), [rec("Oil Change", "2026-09-01T00:00:00.000Z")])).odometer).toBeUndefined();
  });

  test("most urgent car first; cars with nothing tracked are left off", () => {
    const fine = view(car("a", 1000), [rec("Oil Change", "2026-10-01T00:00:00.000Z", 900)]);
    const late = view(car("b", 48210), [rec("Oil Change", "2026-03-16T00:00:00.000Z", 41000)]);
    const empty = view(car("c"), []);
    expect(roads([fine, late, empty]).map((r) => r.vehicleId)).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement** in `src/redesign/model.ts`:

```ts
export type Road = { vehicleId: string; vehicleName: string; odometer?: number; ahead: DueState[]; behind: DueState[] };

const AHEAD_MAX = 6;

/** The Upcoming tab as a road: the car at its reading, what's next as signs
 *  ahead in the order it comes due, and anything overdue behind it. */
export function roadFor(view: VehicleView): Road {
  const sorted = [...view.states].sort(byUrgency);
  const ahead = sorted
    .filter((s) => s.status !== "due")
    .sort((a, b) => (a.dueAt ?? "~").localeCompare(b.dueAt ?? "~") || (a.dueOdometer ?? Infinity) - (b.dueOdometer ?? Infinity))
    .slice(0, AHEAD_MAX);
  return {
    vehicleId: view.vehicle.id,
    vehicleName: view.vehicle.name,
    odometer: view.vehicle.odometer,
    ahead,
    behind: sorted.filter((s) => s.status === "due"),
  };
}

export function roads(views: readonly VehicleView[]): Road[] {
  return views
    .filter((v) => v.states.length > 0)
    .sort((a, b) => (a.next && b.next ? byUrgency(a.next, b.next) : a.next ? -1 : b.next ? 1 : 0))
    .map(roadFor);
}
```

- [ ] **Step 4: Run the model tests.** Expected: PASS.

- [ ] **Step 5: Add copy:**

```ts
"redesign.road.here": "You’re here",
"redesign.road.behind": "Behind you",
```

  Translate into the 10 full catalogs and run the i18n test.

- [ ] **Step 6: Build `Road.tsx`.** Layout, top to bottom (furthest ahead at the top, as you'd see a road from the driver's seat):
  - A vertical asphalt strip, 56 pt wide, centred, colour `#2B2F3A`, radius 28, with a dashed centre line (8 × 3 pt white-at-60% dashes, 14 pt gap) drawn as a column of `View`s. No SVG: `react-native-svg` isn't in the binary.
  - Each `ahead` stop is a signpost row, alternating left and right of the strip: a white card (radius 18, ambient shadow) holding a `ServiceSticker` (40), the service name (15/600) and `whenLabel(s)` in `v2.value()` (amber for `soon`, accent for `ok`). A 2 pt stub joins card and strip.
  - Then the car: `Mascot` **still** (`animate={false}`; the loops have the page colour baked in and would show a box on the asphalt), size 96, on the strip. Beside it, "You’re here" in `v2.label()` and `formatNumber(odometer) + unit` in `v2.value()` (left out when `odometer` is undefined).
  - Then, if `behind` is non-empty, a "Behind you" label and the overdue stops in the same signpost style, with `redWash` card backgrounds and red `whenLabel` text.
  - One section per `Road`, with the car name as a `SectionTitle` when there's more than one.
  - Wrap in the existing scroll container. After first layout, `scrollToEnd({ animated: false })` so the car is in view, unless the user has scrolled.
  - Accessibility: every signpost is one accessible element, label `"{service}, {whenLabel}"`. The road strip and dashes are hidden (`accessibilityElementsHidden`).
  - Reduce Motion: no entrance. Otherwise signposts fade and rise 8 pt, staggered 40 ms, ease-out `tokens.motion.easeOut`, 220 ms, once per mount.

- [ ] **Step 7: Wire it in.** In `Home.tsx`'s `upcoming` branch, render `roads(views).map(r => <Road key={r.vehicleId} road={r} … />)` when `isDesignV2()`. Otherwise keep the existing list. An empty `roads` list shows the existing `redesign.upcoming.empty` text.

- [ ] **Step 8: Screen test.** With v2 on and the overdue-oil fixture, the Upcoming segment contains "You’re here" and a signpost labelled with "Brake Inspection". "Oil Change" appears after "You’re here" in render order. With v2 off, the old list renders.

- [ ] **Step 9: Run all tests and tsc, then commit.**

```bash
git add src/redesign src/i18n tests/redesign-model.test.ts tests/redesign-home.test.tsx
git commit -m "feat(redesign): v2 road on Upcoming"
```

---

### Task 9: The logged moment (v2)

**Files:**
- Modify: `src/redesign/model.ts` (add `nextFor`)
- Create: `src/redesign/LoggedMoment.tsx`
- Modify: `src/redesign/Home.tsx`, `src/redesign/VehicleScreen.tsx` (in v2, `LoggedMoment` replaces `CelebrateToast`)
- Modify: `src/i18n/catalog/en/redesign.ts` + 10 full catalogs
- Test: `tests/redesign-model.test.ts`, `tests/redesign-vehicle.test.tsx`

**Interfaces:**
- Consumes: `takeLogged()` (`src/mascot/celebrate.ts`, unchanged), `VehicleView`, `Mascot`, `v2.*`.
- Produces:
  ```ts
  export function nextFor(view: VehicleView, type: string): { dueOdometer?: number; dueAt?: string } | null;  // null when the type has no interval
  export function LoggedMoment(props: { service: string; next: { dueOdometer?: number; dueAt?: string } | null; visible: boolean; onDone: () => void }): JSX.Element | null;
  ```

- [ ] **Step 1: Write the failing tests:**

```ts
import { nextFor } from "../src/redesign/model";

test("after a log, next is the fresh due point", () => {
  const v = view(car("a", 48210), [rec("Oil Change", "2026-10-12T00:00:00.000Z", 48210)]);
  const n = nextFor(v, "Oil Change");
  expect(n).not.toBeNull();
  expect(n?.dueOdometer ?? n?.dueAt).toBeDefined();
  if (n?.dueOdometer !== undefined) expect(n.dueOdometer).toBeGreaterThan(48210);
});

test("a custom type with no interval has no next", () => {
  const v = view(car("a", 48210), [rec("Timing belt (my own)", "2026-10-12T00:00:00.000Z", 48210)]);
  expect(nextFor(v, "Timing belt (my own)")).toBeNull();
});
```

- [ ] **Step 2: Run and confirm they fail.**

- [ ] **Step 3: Implement:**

```ts
/** Where a service is next due, read off the view rebuilt after the log, so
 *  the logged screen says what the schedule will say. */
export function nextFor(view: VehicleView, type: string): { dueOdometer?: number; dueAt?: string } | null {
  const s = view.states.find((x) => x.type === type);
  if (!s || (s.dueOdometer === undefined && !s.dueAt)) return null;
  return { dueOdometer: s.dueOdometer, dueAt: s.dueAt };
}
```

- [ ] **Step 4: Add copy:**

```ts
"redesign.logged.title": "{{service}} logged.",
"redesign.logged.nextAt": "Next at {{reading}}",
"redesign.logged.nextBy": "Next by {{date}}",
"redesign.logged.done": "Done",
```

  Before adding `done`, check whether a shared "Done" key already exists (`grep -rn '"Done"' src/i18n/catalog/en`) and reuse it if so. Translate into the 10 full catalogs and run the i18n test.

- [ ] **Step 5: Build `LoggedMoment.tsx`.** A React Native `Modal` (`transparent`, `animationType="none"`, `statusBarTranslucent`) with a full-bleed `#3A64E0` view:
  - Centred column: `Mascot mood="celebrating" size={200}` **still** (the loop has the page baked in). It pops in from 0.94 via `Mascot`'s own mood pop. No hop: the user rejected hopping loops on 2026-10-12.
  - The title `t("redesign.logged.title", { service: serviceName(service) })` in `v2.greeting()`, white, centred.
  - When `next` is set, a line in `v2.value()` at 15 pt, `rgba(255,255,255,0.85)`, uppercased only through `v2.label()` rules (so not in ja/ko): `nextAt` with `formatNumber(dueOdometer) + unit` when there's a distance, otherwise `nextBy` with `formatShortDate(dueAt)`.
  - A white pill button at the bottom, label `done`, dark text, 52 pt tall, `accessibilityRole="button"`, which calls `onDone`.
  - Entrance: background fades in over 220 ms, content rises 12 pt with ease-out. Under Reduce Motion it fades only. No auto-dismiss: the user taps Done. VoiceOver focus goes to the title on open (`AccessibilityInfo.setAccessibilityFocus`).
  - No haptic: `app/vehicle/[id]/log.tsx:152` already fires `Success` on save, and a second one would double up.

- [ ] **Step 6: Wire it in.** Where `Home.tsx` and `VehicleScreen.tsx` render `CelebrateToast`, render `LoggedMoment` instead when `isDesignV2()`. Pass `next = nextFor(viewForLoggedVehicle, celebrated)` and set `onDone` to clear `celebrated`. The `celebrated` state and `takeLogged()` flow stay unchanged, so the signal is still consumed once by whichever screen focuses first.

- [ ] **Step 7: Screen test** (`tests/redesign-vehicle.test.tsx`). With v2 on, call `markLogged("a", "Oil Change")`, focus the vehicle screen, and expect a `Modal` with `visible` and the text "Oil Change logged.". Press Done and expect it gone. Focus again and expect it not to reappear. With v2 off, expect the toast.

- [ ] **Step 8: Run all tests and tsc, then commit.**

```bash
git add src/redesign src/i18n tests/redesign-model.test.ts tests/redesign-vehicle.test.tsx
git commit -m "feat(redesign): v2 full-screen logged moment"
```

---

### Task 10: The service explainer in v2

**Files:**
- Modify: `app/explain.tsx`
- Test: `tests/explain-sheet.test.tsx`

**Interfaces:**
- Consumes: `isDesignV2()`, `v2.*` (Task 3), `ServiceSticker` (Task 5). The explainer's own code (`src/explain/`, `explainPath`, `hasExplainer`, its actions and events) is unchanged.

The explainer already takes the page colour from `tokens`, so Task 4 warms it for free. What's left is its header, labels and schedule box.

- [ ] **Step 1: Write the failing test** in `tests/explain-sheet.test.tsx`, using the file's existing render helper and mocks. Add a `v2On` flag to its `../src/design/theme` mock, or add that mock in the same shape as Task 6's:

```tsx
test("v2 explainer leads with the service's sticker", () => {
  v2On = true;
  const tree = render({ type: "Oil Change" });
  expect(tree.root.findAll((n) => n.type === ServiceSticker)).toHaveLength(1);
  expect(tree.root.findAll((n) => n.type === Mascot)).toHaveLength(0);
});

test("without v2 the explainer is unchanged", () => {
  v2On = false;
  const tree = render({ type: "Oil Change" });
  expect(tree.root.findAll((n) => n.type === ServiceSticker)).toHaveLength(0);
});
```

- [ ] **Step 2: Run and confirm it fails.** `npx jest --selectProjects screens --testPathPattern explain-sheet`.

- [ ] **Step 3: Implement** in `app/explain.tsx`, when `isDesignV2()`:
  - Header: `<ServiceSticker type={type} size={56} />` in place of the 64 pt `Mascot`. The card is about the service, and the car already speaks on Today. The title uses `v2.greeting()`; the difficulty line uses `v2.label()`.
  - Section labels (`explain.schedule`, `explain.what`, `explain.why`, `explain.diy`) use `v2.label()`. That makes four on one screen, one over the three-per-screen limit, so drop the schedule label to `tokens.text.legend` and keep the other three.
  - Schedule box: a white card (`tokens.color.surface`, radius `tokens.radius.lg`, ambient shadow) instead of `surfaceHi`. Lines in `v2.value()` at 15 pt, with the overdue line in `#C42B30` (not `tokens.color.red`, which is 3.9:1 on white for small text).
  - Body copy, buttons, the disclaimer, actions and every explainer event stay as they are.

- [ ] **Step 4: Run** `npx jest --selectProjects screens --testPathPattern explain`, `npx jest`, `npx tsc --noEmit`.

- [ ] **Step 5: Commit.**

```bash
git add app/explain.tsx tests/explain-sheet.test.tsx
git commit -m "feat(explain): v2 explainer header and labels"
```

---

### Task 11: Device check, docs, stop

**Files:**
- Modify: `docs/DECISIONS.md` (`app_design` section)
- Modify: `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` (only if anything shipped)

- [ ] **Step 1: Build** the `design-v2-check` profile (`eas build --profile design-v2-check --platform ios`). Ask the user before starting a build that uses EAS credits/minutes.

- [ ] **Step 2: Walk the screens** in English, German (longest strings) and Japanese (system-font fallback): Today (overdue, due soon, all OK, nothing logged), Upcoming road (1 car, 2 cars, no odometer), vehicle screen, explainer opened from a care row, a History row, the log form and a due notification, then "Log this service" from an explainer → logged moment (shown once), log a service → logged moment, Reduce Motion on, largest Dynamic Type size. Screenshot each and fix what breaks.

- [ ] **Step 3: Check that arm B and plain arm A are unchanged.** On the `redesign-check` profile (A without v2) and a store-like classic build, Today and the vehicle screen must look exactly as before (compare with `research/redesign/before-after.jpg`, apart from Task 1's header fix).

- [ ] **Step 4: Update `docs/DECISIONS.md`.** Under `app_design`, record that v2 is built behind `isDesignV2()` / `design-v2-check`, what it contains, and that how it ships is decided after the `app_design` read (~11-03). Leading option: if A wins, test A v2 against A on fresh installs, with v2 never on during onboarding.

- [ ] **Step 5: Commit, then stop.** Do not publish an OTA or start an experiment. Hand back to the user with the screenshots.

```bash
git add docs/DECISIONS.md
git commit -m "docs(decisions): A v2 built, ships after read"
```
