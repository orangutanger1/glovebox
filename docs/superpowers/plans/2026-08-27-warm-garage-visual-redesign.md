# Warm Garage Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brushed-metal instrument-panel visual system with a light-first warm consumer skin — two themes, modern materials, real display typography, and seven vehicle marks that double as the body-style control.

**Architecture:** `tokens.color` and `tokens.material` are deleted and replaced by two frozen palettes read through a `useTheme()` hook over a React context provided in `app/_layout.tsx`; `tokens.space`, `tokens.radius` and `tokens.text` stay static and keep every existing import site. Depth stops being per-side border trickery and becomes fill + hairline + soft shadow, with `expo-blur` for floating chrome. A new nullable `vehicles.body_style` column, set by a new tap-to-advance onboarding step, keys a single tint-driven PNG family used in the picker, on results, on the paywall, and on every garage card.

**Tech Stack:** React Native 0.86 / Expo 57, expo-router, expo-sqlite (raw SQL migrations), expo-font, expo-blur, expo-linear-gradient (retained for two uses only: the welcome hero scrim and the onboarding top light), expo-haptics, jest + react-test-renderer + better-sqlite3.

**Spec:** `docs/superpowers/specs/2026-08-27-warm-garage-visual-redesign-design.md`

## Global Constraints

- **Light palette, exact values:** `base #F7F4EF`, `card #FFFFFF`, `cardSunken #F2EEE8`, `ink #14161A`, `inkMuted #5C6068`, `inkFaint #8A8E96`, `hairline rgba(20,22,26,0.08)`, `accent #C2611A`, `onAccent #FFFFFF`, `soon #E08A1E`, `ok #1F7A5C`, `overdue #C1121F`, `overdueWash rgba(193,18,31,0.08)`.
- **Dark palette, exact values:** `base #101215`, `card #191C20`, `cardSunken #22262B`, `ink #F5F3EF`, `inkMuted rgba(245,243,239,0.60)`, `inkFaint rgba(245,243,239,0.38)`, `hairline rgba(255,255,255,0.08)`, `accent #E8933D`, `onAccent #101215`, `soon #F0A73C`, `ok #3E9B7A`, `overdue #E0313D`, `overdueWash rgba(224,49,61,0.14)`.
- **`overdue` is never a primary button.** Reserved for overdue state and destructive actions only. Carried over from the superseded spec.
- **No new runtime dependencies.** Specifically no `react-native-svg`, no vehicle-image API, no network call for imagery. The "no account, nothing leaves your phone" promise is load-bearing.
- **All imagery is transparent PNG at @3x only.** No `@1x`/`@2x` variants.
- **Vehicle marks are single flat ink colour on transparency** and are recoloured with React Native `tintColor`. Seven files, not fourteen.
- **Body style values, exactly:** `sedan` | `hatchback` | `coupe` | `wagon` | `suv` | `pickup` | `van`. `null` means unknown and renders the sedan mark with no "unknown" UI state.
- **i18n:** English (`src/i18n/catalog/en/`) is the floor. `tests/i18n.test.ts` asserts the 10 **BASE** catalogs (`de fr it es pt-BR nl sv pl ja ko`) have a key set **exactly equal** to `en`. Any new key must land in `en` **and all 10 BASE catalogs in the same commit** or the suite fails. The 5 OVERLAY catalogs (`en-GB en-AU en-CA fr-CA es-MX`) get a key only if the wording differs. *(This corrects the spec's §5 phrasing of "all 16 catalogs" — 16 is the store-locale count, not the catalog count.)*
- **Key namespacing:** `tests/i18n.test.ts` asserts every key starts with the name of the fragment that owns it. New onboarding keys go in `onboardingA`; new vehicle keys go in `vehicle`; new settings keys go in `settings`.
- **No literal distance units in copy.** `tests/i18n.test.ts` fails any value matching `/\b(miles|mileage)\b/i` outside the `unit.` fragment, with one grandfathered exception.
- **Adding an onboarding step breaks funnel comparability.** An entry must be appended to `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` in the **same commit** as the step, per that document's rule 4.
- **Store screenshots:** 6.9" / `IPHONE_69` / 1290×2796. Existing translated caption strings in `store/screenshot-captions.json` must not change.
- **Never restyle the RevenueCat paywall.** It is a native modal configured in the RevenueCat dashboard and is not stylable from this repo.
- **Run `npx tsc --noEmit` and `npx jest` before every commit.** Both must be clean.

## Asset Dependency

Tasks 9, 11 and 12 consume art the user generates from the prompts in the spec. Tasks 1–8 and 10 do **not** depend on any asset and should be completed first. Expected paths:

- `assets/vehicles/sedan.png`, `hatchback.png`, `coupe.png`, `wagon.png`, `suv.png`, `pickup.png`, `van.png` — 1200×640, transparent, single flat `#14161A`
- `assets/onboarding/welcome-light.png` — 1200×900, transparent
- `assets/icon.png`, `assets/splash-icon.png` — replacements for the existing files

If art has not arrived when Task 9 is reached, stop and report. Do **not** substitute placeholder rectangles, and do **not** ship a coloured `View` where a mark belongs.

## File Structure

**Created:**
- `src/design/palette.ts` — the two frozen palettes and the `Palette` type. No React, no imports from `./tokens`.
- `src/design/theme.tsx` — `ThemeProvider`, `useTheme`, `useThemeMode`. The only module that touches `useColorScheme`.
- `src/design/themeState.ts` — `getThemeMode` / `setThemeMode` over the `app_state` key `theme`.
- `src/vehicles/bodyStyles.ts` — `BODY_STYLES`, `type BodyStyle`, `isBodyStyle`. Pure data, no React, no db.
- `src/design/VehicleMark.tsx` — the tinted `Image` wrapper. The only module that knows the PNG paths.
- `app/onboarding/body.tsx` — the new step.
- `tests/theme.test.ts` — palette and persistence.
- `tests/design-tokens.test.ts` — the repo-wide guard that the metal is gone.
- `tests/body-style.test.ts` — column, accessors, mark fallback.

**Modified:** `src/design/tokens.ts`, all 18 files in `src/design/`, `app/_layout.tsx`, `app/index.tsx`, `app/settings.tsx`, `app/vehicle/[id].tsx`, `app/onboarding/{welcome,results,paywall,offer,vehicle}.tsx`, `src/onboarding/{Screen.tsx,flow.ts}`, `src/db/{schema.ts,vehicles.ts}`, `src/i18n/catalog/en/{onboardingA,vehicle,settings}.ts` + 10 BASE catalogs, `tests/{onboarding-screens.test.tsx,migrations.test.ts,onboarding-flow.test.ts,onboarding-run.test.ts,onboarding-state.test.ts,analytics.test.ts}`, `store/screenshot-captions.json` (notes only), `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md`.

**Deleted:** `assets/onboarding/metal.jpg`.

---

### Task 1: Theme plumbing

Two palettes, a context, and a persisted choice. No visual change is expected to be *correct* at the end of this task — components still reference the old token names and will be migrated in Tasks 2 and 3. This task ends green because the old `tokens.color` keys are kept as a temporary alias, which Task 3 deletes.

**Files:**
- Create: `src/design/palette.ts`, `src/design/theme.tsx`, `src/design/themeState.ts`, `tests/theme.test.ts`
- Modify: `src/design/tokens.ts`, `app/_layout.tsx`

**Interfaces:**
- Consumes: `getState` / `setState` from `src/db/state.ts` — `getState(key: string): string | null`, `setState(key: string, value: string): void`.
- Produces:
  - `type Palette = { base: string; card: string; cardSunken: string; ink: string; inkMuted: string; inkFaint: string; hairline: string; accent: string; onAccent: string; soon: string; ok: string; overdue: string; overdueWash: string; shadowOpacity: number; blurTint: "light" | "dark" }`
  - `LIGHT: Palette`, `DARK: Palette` from `src/design/palette.ts`
  - `type ThemeMode = "system" | "light" | "dark"`
  - `getThemeMode(): ThemeMode`, `setThemeMode(mode: ThemeMode): void` from `src/design/themeState.ts`
  - `ThemeProvider({ children }: { children: React.ReactNode })`, `useTheme(): Palette`, `useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void }` from `src/design/theme.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/theme.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/theme.test.ts`
Expected: FAIL — `Cannot find module '../src/design/palette'`

- [ ] **Step 3: Write the palettes**

Create `src/design/palette.ts`:

```ts
/**
 * The two palettes, and nothing else.
 *
 * Colour left `tokens.ts` when the app grew a second theme: a frozen object
 * read at module scope cannot answer "which theme is on the glass". Every
 * consumer reads a palette through `useTheme()`; nothing imports LIGHT or DARK
 * directly except the provider and its tests.
 *
 * `shadowOpacity` and `blurTint` live here because they are theme-dependent and
 * there is nowhere else honest to put them: a shadow that reads as depth on
 * warm paper is invisible on near-black, and vice versa.
 */
export type Palette = {
  /** The screen. Nothing else. */
  base: string;
  /** Raised surfaces: cards, buttons, list panels. */
  card: string;
  /** Recessed surfaces: input wells, unselected chips, gauge tracks. */
  cardSunken: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  hairline: string;
  /** The brand. Primary CTAs. */
  accent: string;
  /** Text and glyphs on top of `accent`. */
  onAccent: string;
  soon: string;
  ok: string;
  /** Reserved: overdue state and destructive actions. Never a primary button. */
  overdue: string;
  overdueWash: string;
  shadowOpacity: number;
  blurTint: "light" | "dark";
};

export const LIGHT: Palette = Object.freeze({
  base: "#F7F4EF",
  card: "#FFFFFF",
  cardSunken: "#F2EEE8",
  ink: "#14161A",
  inkMuted: "#5C6068",
  inkFaint: "#8A8E96",
  hairline: "rgba(20,22,26,0.08)",
  accent: "#C2611A",
  onAccent: "#FFFFFF",
  soon: "#E08A1E",
  ok: "#1F7A5C",
  overdue: "#C1121F",
  overdueWash: "rgba(193,18,31,0.08)",
  shadowOpacity: 0.06,
  blurTint: "light",
});

export const DARK: Palette = Object.freeze({
  base: "#101215",
  card: "#191C20",
  cardSunken: "#22262B",
  ink: "#F5F3EF",
  inkMuted: "rgba(245,243,239,0.60)",
  inkFaint: "rgba(245,243,239,0.38)",
  hairline: "rgba(255,255,255,0.08)",
  accent: "#E8933D",
  onAccent: "#101215",
  soon: "#F0A73C",
  ok: "#3E9B7A",
  overdue: "#E0313D",
  overdueWash: "rgba(224,49,61,0.14)",
  shadowOpacity: 0.35,
  blurTint: "dark",
});
```

The "share no value" test compares only the colour roles it finds equal; `shadowOpacity` (0.06 vs 0.35) and `blurTint` ("light" vs "dark") differ, so no exception list is needed.

- [ ] **Step 4: Write the persisted mode**

Create `src/design/themeState.ts`:

```ts
import { getState, setState } from "../db/state";

export type ThemeMode = "system" | "light" | "dark";

const MODES: readonly ThemeMode[] = ["system", "light", "dark"];

/**
 * Validated on read, not trusted. A build that once wrote a mode this version
 * does not have would otherwise resolve to `undefined` and render a themeless
 * tree — the same failure shape `resumeRoute` exists to prevent for routes.
 */
export function getThemeMode(): ThemeMode {
  const stored = getState("theme");
  return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : "system";
}

export function setThemeMode(mode: ThemeMode): void {
  setState("theme", mode);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/theme.test.ts`
Expected: PASS, 6 tests

- [ ] **Step 6: Write the provider**

Create `src/design/theme.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { DARK, LIGHT, type Palette } from "./palette";
import { getThemeMode, setThemeMode, type ThemeMode } from "./themeState";

const PaletteContext = createContext<Palette>(LIGHT);
const ModeContext = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  mode: "system",
  setMode: () => {},
});

/**
 * Light is the default, and `system` is the default *mode* — so a phone in dark
 * mode gets the dark palette without being asked, and a phone with no
 * preference gets light. The context default above is LIGHT rather than a
 * throwing sentinel because a component rendered outside the provider is a test
 * harness, and a themeless crash there teaches nothing about the component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode());
  const scheme = useColorScheme();

  const setMode = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    setModeState(next);
  }, []);

  const resolved = mode === "system" ? (scheme === "dark" ? DARK : LIGHT) : mode === "dark" ? DARK : LIGHT;
  const modeValue = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ModeContext.Provider value={modeValue}>
      <PaletteContext.Provider value={resolved}>{children}</PaletteContext.Provider>
    </ModeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(PaletteContext);
}

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  return useContext(ModeContext);
}
```

- [ ] **Step 7: Add the temporary alias to `tokens.ts`**

Task 3 deletes this. It exists so the repo type-checks between Task 1 and Task 3 without a single 20-file commit.

In `src/design/tokens.ts`, replace the `color` and `material` blocks with an import-based alias to the light palette, keeping every existing key name:

```ts
import { LIGHT } from "./palette";

export const tokens = {
  /**
   * TEMPORARY. Deleted in the materials migration — see
   * docs/superpowers/plans/2026-08-27-warm-garage-visual-redesign.md Task 3.
   * Every key here maps an old instrument-panel name onto the light palette so
   * the tree renders while components are migrated one file at a time.
   */
  color: {
    housing: LIGHT.base,
    metal: LIGHT.card,
    white: "#FFFFFF",
    red: LIGHT.overdue,
    text: LIGHT.ink,
    textMuted: LIGHT.inkMuted,
    textFaint: LIGHT.inkFaint,
    hairline: LIGHT.hairline,
    hairlineLit: LIGHT.hairline,
    edge: LIGHT.hairline,
    edgeSolid: LIGHT.cardSunken,
    metalHi: LIGHT.card,
    metalLo: LIGHT.cardSunken,
    redGlow: LIGHT.overdueWash,
    redWash: LIGHT.overdueWash,
  },
  material: {
    metalFace: [LIGHT.card, LIGHT.card] as const,
    edgeHeight: 0,
    edgePressed: 0,
    pressTravel: 0,
  },
  // ... space, radius, text, shadow unchanged below
};
```

Keep `space`, `radius`, `text` and `shadow` exactly as they are. Radius and spacing grow in Task 4.

- [ ] **Step 8: Wrap the tree**

In `app/_layout.tsx`, add `import { ThemeProvider } from "../src/design/theme";` and wrap the existing `GestureHandlerRootView` subtree so the provider sits above `Stack`. Do **not** move it above the fatal-database branch — that screen renders when `getDb()` throws, and `getThemeMode()` reads the database. The fatal screen keeps using literal palette values:

```tsx
import { LIGHT } from "../src/design/palette";
// ...in the `if (fatal)` branch, replace tokens.color.housing with LIGHT.base
// and tokens.color.text with LIGHT.ink, and `<StatusBar style="light" />`
// with `<StatusBar style="dark" />`.
```

- [ ] **Step 9: Verify the suite and types**

Run: `npx tsc --noEmit && npx jest`
Expected: clean, 354 tests (348 existing + 6 new)

- [ ] **Step 10: Commit**

```bash
git add src/design/palette.ts src/design/theme.tsx src/design/themeState.ts \
        src/design/tokens.ts app/_layout.tsx tests/theme.test.ts
git commit -m "feat: two palettes behind a theme context

Colour leaves tokens.ts, which cannot answer which theme is on the glass.
tokens.color keeps its old key names as a temporary alias onto the light
palette so the tree renders while components migrate one file at a time."
```

---

### Task 2: The two surface primitives and the four controls

`Raised` / `Well` / `Panel` stop being bevels and become fill + hairline + shadow. This is the task that deletes the metal.

**Files:**
- Modify: `src/design/Surface.tsx`, `src/design/Card.tsx`, `src/design/Button.tsx`, `src/design/Chip.tsx`
- Test: `tests/design-tokens.test.ts` (create)
- Delete: `assets/onboarding/metal.jpg`

**Interfaces:**
- Consumes: `useTheme(): Palette` from `src/design/theme.tsx` (Task 1); `tokens.radius`, `tokens.space` from `src/design/tokens.ts`.
- Produces: unchanged public props on all four components — `Raised({ children, pressed?, radius?, style })`, `Well({ children, radius?, focused?, style })`, `Panel({ children, radius?, style })`, `Card({ children, status? })`, `Button({ label, onPress, variant?, disabled? })`, `Chip({ label, selected, onPress, disabled? })`. No call site changes.

- [ ] **Step 1: Write the failing test**

Create `tests/design-tokens.test.ts`. This is the guard for the affordance regression named in spec §9. The repo-wide "no metal anywhere" guard is **not** written here — it cannot be green until Task 3 has migrated the remaining fourteen files, and a task must not commit a knowingly-red suite:

```ts
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light" },
}));

import { Chip } from "../src/design/Chip";
import { LIGHT, DARK } from "../src/design/palette";

describe("an unselected chip is still visibly a control", () => {
  // The superseded spec's whole reason for existing: transparent-filled chips
  // over a near-black screen left users looking at bare text where a button
  // was. The metal is gone; the affordance must not go with it.
  test.each([
    ["light", LIGHT],
    ["dark", DARK],
  ])("has a fill distinct from the screen in %s", (_name, palette) => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        createElement(Chip, { label: "Sedan", selected: false, onPress: () => {} })
      );
    });
    const fills = tree.root
      .findAll((n) => typeof n.type === "string")
      .flatMap((n) => {
        const style = n.props.style;
        const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
        return flat?.backgroundColor ? [flat.backgroundColor] : [];
      });
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      expect(fill).not.toBe("transparent");
      expect(fill).not.toBe(palette.base);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/design-tokens.test.ts`
Expected: FAIL in both themes — the unselected chip's fill is currently `[...tokens.material.metalFace]` on a `LinearGradient`, so the assertion finds no `backgroundColor` on the face at all and `fills.length` is 0.

- [ ] **Step 3: Rewrite `Surface.tsx`**

Replace the entire file. `Grain`, `LinearGradient` and the `METAL` require all go.

```tsx
import { View, type ViewStyle, type StyleProp } from "react-native";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * The two surface primitives every control is built from.
 *
 * The previous version built depth from per-side border colours and a 3px
 * opaque band, because React Native has no inset shadow. It worked, and it
 * looked like 2013 — hard borders around every element is the most reliable
 * dated signal an interface can emit. Depth is now fill, one hairline, and a
 * soft shadow; a recess is a darker fill and no shadow. The direction still
 * lives here and nowhere else.
 */

export function Raised({
  children,
  pressed = false,
  radius = tokens.radius.md,
  style,
}: {
  children: React.ReactNode;
  pressed?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.hairline,
          shadowColor: "#000",
          shadowOpacity: pressed ? c.shadowOpacity * 0.4 : c.shadowOpacity,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Well({
  children,
  radius = tokens.radius.sm,
  focused = false,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  focused?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: c.cardSunken,
          borderWidth: 1,
          borderColor: focused ? c.accent : c.hairline,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A flat card surface — no press state. Cards and list containers. */
export function Panel({
  children,
  radius = tokens.radius.md,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  // The shadow lives on an outer view: on iOS, `overflow: hidden` and a shadow
  // on the same node cancel the shadow out.
  return (
    <View
      style={{
        borderRadius: radius,
        shadowColor: "#000",
        shadowOpacity: c.shadowOpacity,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View
        style={[
          {
            borderRadius: radius,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.hairline,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Rewrite `Button.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * Primary is the accent, not white, and never red — red is reserved for
 * overdue and destructive.
 *
 * The previous version travelled 2px on press against a shrinking hard edge,
 * on the argument that opacity-only feedback is the most template-looking
 * thing a button can do. That argument was right about opacity alone and wrong
 * about the fix: scale plus opacity plus a haptic is the native-feeling
 * version, and it does not require a machined edge under every control.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const c = useTheme();

  const fill = { primary: c.accent, secondary: c.card, danger: c.overdue };
  const fg = { primary: c.onAccent, secondary: c.ink, danger: "#FFFFFF" };

  function handlePress() {
    // Fire and forget: a failed haptic must never block the action.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: tokens.radius.md,
            backgroundColor: fill[variant],
            borderWidth: 1,
            borderColor: variant === "secondary" ? c.hairline : "transparent",
            paddingVertical: 17,
            alignItems: "center",
            opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
            shadowColor: "#000",
            shadowOpacity: disabled ? 0 : c.shadowOpacity,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ ...tokens.text.body, fontWeight: "600", color: fg[variant] }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
```

Note the label loses `tokens.text.legend`: button labels stop being uppercase letterspaced. That is deliberate and is part of spec §3.

- [ ] **Step 5: Rewrite `Chip.tsx`**

```tsx
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * Selected is the accent; unselected is a sunken fill, never transparent.
 * `tests/design-tokens.test.ts` holds that line — an unselected chip filled
 * with the screen colour is bare text where a control should be, which is the
 * bug the metal was introduced to fix and which must not return with it.
 */
export function Chip({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Drawn as a control that is not live yet, rather than hidden. */
  disabled?: boolean;
}) {
  const c = useTheme();

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled} accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <View
          style={{
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: tokens.space.md,
            borderRadius: tokens.radius.pill,
            backgroundColor: selected ? c.accent : c.cardSunken,
            borderWidth: 1,
            borderColor: selected ? c.accent : c.hairline,
            opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          }}
        >
          <Text
            style={{
              ...tokens.text.body,
              fontWeight: selected ? "600" : "400",
              color: selected ? c.onAccent : c.ink,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 6: Rewrite `Card.tsx`**

```tsx
import { View } from "react-native";
import { Panel } from "./Surface";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * A card. `status="overdue"` adds the red stripe down the left edge — the
 * card-level equivalent of a lit lamp, readable at arm's length — plus a wash
 * over the fill, because a 3px stripe alone is invisible on warm paper in
 * daylight.
 */
export function Card({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: "overdue";
}) {
  const c = useTheme();
  return (
    <Panel style={status === "overdue" ? { backgroundColor: c.overdueWash } : undefined}>
      <View style={{ flexDirection: "row" }}>
        {status === "overdue" ? <View style={{ width: 4, backgroundColor: c.overdue }} /> : null}
        <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.sm }}>
          {children}
        </View>
      </View>
    </Panel>
  );
}
```

`tokens.space.card` (20) does not exist yet, so this uses `tokens.space.md` (16). Task 4 Step 4 adds the token; Task 4 Step 6 is where this line becomes `tokens.space.card`. Do not add the token early — `tokens.ts` is being edited by Task 3 in between, and two tasks editing the same object is how a scale ends up with both keys.

- [ ] **Step 7: Delete the texture**

```bash
git rm assets/onboarding/metal.jpg
```

- [ ] **Step 8: Run the whole suite**

Run: `npx tsc --noEmit && npx jest`
Expected: clean. The chip tests pass, and nothing else regressed — the four rewritten components kept their public props, so no call site changed.

- [ ] **Step 9: Commit**

```bash
git add src/design/Surface.tsx src/design/Card.tsx src/design/Button.tsx \
        src/design/Chip.tsx tests/design-tokens.test.ts
git commit -m "feat: fill, hairline and shadow replace the bevel

Depth stops being per-side border colours and a 3px opaque band. Chips keep
a sunken fill in both themes so an unselected control is still an object -
the bug the metal was introduced to fix, which must not return with it."
```

---

### Task 3: Migrate the remaining components and delete the alias

Fourteen files still read `tokens.color`. This task ends with the alias gone and `tests/design-tokens.test.ts` fully green.

**Files:**
- Modify: `src/design/{Screen,Glass,Field,ListRow,Badge,Gauge,Lamp,StepLamps,ProgressBar,ChipRow,Wheel,DateWheel,OdometerRoll,NotifyBanner}.tsx`, `src/design/tokens.ts`, `src/onboarding/Screen.tsx`, `app/index.tsx`, `app/settings.tsx`, `app/vehicle/[id].tsx`, `app/vehicle/new.tsx`, `app/vehicle/[id]/log.tsx`, `app/language.tsx`, `app/intervals.tsx`, `app/winback.tsx`, `app/trial.tsx`, `app/onboarding/*.tsx`
- Test: `tests/design-tokens.test.ts` (append the repo-wide banned-name guard — Step 1)

**Interfaces:**
- Consumes: `useTheme(): Palette` (Task 1); `Raised`, `Well`, `Panel` (Task 2).
- Produces: no public prop changes on any component.

- [ ] **Step 1: Write the repo-wide guard**

This is spec acceptance criterion 1 as a test. It is authored here rather than in Task 2 because Task 2 could not have made it pass.

Append to `tests/design-tokens.test.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Every .ts/.tsx file under src/ and app/, so a stray reference anywhere
 *  fails rather than only the ones a reviewer happened to open. */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

const FILES = [...sources("src"), ...sources("app")];

describe("the instrument-panel material system is gone", () => {
  test.each([
    "metalFace",
    "edgeSolid",
    "edgeHeight",
    "edgePressed",
    "pressTravel",
    "metalHi",
    "metalLo",
    "hairlineLit",
    "redGlow",
    "color.housing",
    "color.metal",
  ])("no source file mentions %s", (banned) => {
    const offenders = FILES.filter((f) => readFileSync(f, "utf8").includes(banned));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 1b: Run it to get the exact worklist**

Run: `npx jest tests/design-tokens.test.ts`
Expected: FAIL. Each failure lists the files still holding a banned name — `src/design/tokens.ts` plus the fourteen un-migrated components and screens. Work that list; do not work from memory.

- [ ] **Step 2: Migrate each file mechanically**

For every file in the list, the substitution is uniform:

- Add `import { useTheme } from "<relative>/design/theme";` and `const c = useTheme();` as the first line of the component body.
- Replace, without exception:

| Old | New |
| --- | --- |
| `tokens.color.housing` | `c.base` |
| `tokens.color.metal` | `c.card` |
| `tokens.color.text` | `c.ink` |
| `tokens.color.textMuted` | `c.inkMuted` |
| `tokens.color.textFaint` | `c.inkFaint` |
| `tokens.color.hairline`, `tokens.color.edge`, `tokens.color.hairlineLit` | `c.hairline` |
| `tokens.color.edgeSolid`, `tokens.color.metalLo` | `c.cardSunken` |
| `tokens.color.metalHi` | `c.card` |
| `tokens.color.red` | `c.overdue` |
| `tokens.color.redWash`, `tokens.color.redGlow` | `c.overdueWash` |
| `tokens.color.white` | `"#FFFFFF"` |
| `tokens.shadow.ambient` | `{ shadowColor: "#000", shadowOpacity: c.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }` |
| `[...tokens.material.metalFace]` on a `LinearGradient` | delete the gradient, use a `View` with `backgroundColor: c.card` |

Three files need a judgement beyond the table:

- **`Glass.tsx`** — set `tint={c.blurTint}` on the `BlurView` instead of the hardcoded `"dark"`, and keep `intensity={40}`.
- **`Gauge.tsx`** — the track becomes `c.cardSunken` and the fill takes the status colour: `due → c.overdue`, `soon → c.soon`, `ok → c.ok`. If it currently hardcodes white for the fill, that is the line to change.
- **`Lamp.tsx` / `StepLamps.tsx`** — an unlit lamp is `c.hairline`, a lit one is `c.accent`, an alarm lamp is `c.overdue`.

`app/onboarding/welcome.tsx` keeps its `LinearGradient` — that is the scrim under the hero headline, not a metal face.

- [ ] **Step 3: Delete the alias**

In `src/design/tokens.ts`, delete the `color` and `material` blocks and the `LIGHT` import entirely. Keep `space`, `radius`, `text`, `shadow`. The file's header comment must be rewritten — it currently describes the three-material model, which no longer exists:

```ts
/**
 * The measurements, and only the measurements.
 *
 * Colour lives in `palette.ts` and is read through `useTheme()`, because a
 * frozen module-scope object cannot answer which of two themes is on the glass.
 * What is left here is theme-independent: spacing, radius, and the type scale.
 */
```

- [ ] **Step 4: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: `tsc` clean — any remaining `tokens.color` reference is a type error naming its own file. All tests pass, including every banned-name case in `tests/design-tokens.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add -A src app tests
git commit -m "refactor: every surface reads the palette through useTheme

Deletes the tokens.color alias and the material block. tokens.ts is now
measurements only; a stray reference is a type error rather than a
silently light-themed component."
```

---

### Task 4: Typography and the spacing scale

**Files:**
- Create: `assets/fonts/InstrumentSans-SemiBold.ttf`, `assets/fonts/InstrumentSans-Bold.ttf` (downloaded, see Step 1)
- Modify: `src/design/tokens.ts`, `app/_layout.tsx`
- Test: `tests/design-tokens.test.ts` (add a case)

**Interfaces:**
- Consumes: nothing new.
- Produces: `tokens.text.hero`, `tokens.text.title`, `tokens.text.heading` each gain `fontFamily: "InstrumentSans-Bold"` (hero, title) or `"InstrumentSans-SemiBold"` (heading). `tokens.space` gains `card: 20`. `tokens.radius` becomes `{ sm: 10, md: 16, lg: 22, xl: 28, pill: 999 }`.

- [ ] **Step 1: Fetch the font**

Instrument Sans is SIL OFL. Download the static TTFs from the Google Fonts repository and place exactly two weights in `assets/fonts/`:

```bash
mkdir -p assets/fonts
curl -fsSL -o assets/fonts/InstrumentSans-SemiBold.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/static/InstrumentSans-SemiBold.ttf"
curl -fsSL -o assets/fonts/InstrumentSans-Bold.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/static/InstrumentSans-Bold.ttf"
ls -la assets/fonts
```

If either URL 404s, find the current path in the `google/fonts` repo under `ofl/instrumentsans/` — do not substitute a different typeface, and do not proceed with one weight.

- [ ] **Step 2: Write the failing test**

Append to `tests/design-tokens.test.ts`:

```ts
import { existsSync } from "node:fs";
import { tokens } from "../src/design/tokens";

describe("the type scale", () => {
  test("ships the two font files it names", () => {
    for (const family of ["InstrumentSans-SemiBold", "InstrumentSans-Bold"]) {
      expect(existsSync(`assets/fonts/${family}.ttf`)).toBe(true);
    }
  });

  test("puts the display face on display sizes and nowhere else", () => {
    expect(tokens.text.hero.fontFamily).toBe("InstrumentSans-Bold");
    expect(tokens.text.title.fontFamily).toBe("InstrumentSans-Bold");
    expect(tokens.text.heading.fontFamily).toBe("InstrumentSans-SemiBold");
    // Body, caption and readout stay on the system face: SF is a better UI
    // font than any webfont, and numbers need its tabular figures.
    expect("fontFamily" in tokens.text.body).toBe(false);
    expect("fontFamily" in tokens.text.caption).toBe(false);
    expect("fontFamily" in tokens.text.readout).toBe(false);
  });

  test("keeps tabular figures on every number style", () => {
    expect(tokens.text.readout.fontVariant).toEqual(["tabular-nums"]);
    expect(tokens.text.numeric.fontVariant).toEqual(["tabular-nums"]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest tests/design-tokens.test.ts -t "type scale"`
Expected: FAIL — `expected undefined to be "InstrumentSans-Bold"`

- [ ] **Step 4: Update the scale**

In `src/design/tokens.ts`:

```ts
  space: { xs: 4, sm: 8, md: 16, card: 20, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 },

  text: {
    hero: { fontSize: 34, fontFamily: "InstrumentSans-Bold", lineHeight: 41 },
    title: { fontSize: 28, fontFamily: "InstrumentSans-Bold", lineHeight: 34 },
    heading: { fontSize: 20, fontFamily: "InstrumentSans-SemiBold", lineHeight: 26 },
    body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
    // ... legend, readout, numeric unchanged
  },
```

`fontWeight` is dropped from the three display styles: the weight is in the file name, and passing both makes iOS synthesise a fake bold on top of a real one.

- [ ] **Step 5: Load the font**

In `app/_layout.tsx`:

```tsx
import { useFonts } from "expo-font";

// ...inside RootLayout, above the fatal branch:
  /**
   * Two files, and the app renders either way. A font that fails to load must
   * not hold the splash screen: the display face is a refinement, and trading
   * a legible system-font launch for a blank one is the wrong trade. `error`
   * is read rather than ignored so the fall-through is deliberate.
   */
  const [fontsLoaded, fontError] = useFonts({
    "InstrumentSans-SemiBold": require("../assets/fonts/InstrumentSans-SemiBold.ttf"),
    "InstrumentSans-Bold": require("../assets/fonts/InstrumentSans-Bold.ttf"),
  });
  const fontsSettled = fontsLoaded || fontError !== null;
```

Gate only the first paint on `fontsSettled`, not the boot effect — the database, purchases and analytics init must not wait on a typeface. If the existing code holds `expo-splash-screen` open, hide it when `fontsSettled` is true.

- [ ] **Step 6: Cut the uppercase legends**

Search for `tokens.text.legend` and remove it from everything except gauge readouts:

```bash
npx grep -rn "text.legend" src app || true
```

For each hit outside `src/design/Gauge.tsx` and the readout label inside `app/index.tsx`, replace with `{ ...tokens.text.caption, color: c.inkMuted }` and sentence-case the string if the *copy itself* is uppercase. **Do not change any catalog value** — the uppercase in the current UI comes from `textTransform`, not from the strings, and editing copy here would desync 11 catalogs.

Then apply the new padding token, which Step 4 introduced: in `src/design/Card.tsx`, change the inner `View`'s `padding: tokens.space.md` to `padding: tokens.space.card`. This is the one deliberate consumer of the new value — a card breathes at 20, and everything else in the app is still on the 4/8/16 rhythm.

- [ ] **Step 7: Run the tests**

Run: `npx tsc --noEmit && npx jest`
Expected: clean. `tests/onboarding-screens.test.tsx` may fail on asserted strings if any legend copy was sentence-cased — if so, the test's expectation is what changed, and updating it is correct.

- [ ] **Step 8: Commit**

```bash
git add assets/fonts src/design/tokens.ts src/design/Card.tsx app/_layout.tsx \
        tests/design-tokens.test.ts
git commit -m "feat: Instrument Sans on display sizes, legends cut back

expo-font was a dependency doing no work and the app ran on five system
sizes with an uppercase letterspaced label on every value. The uppercase
legend now appears on gauge readouts only; it was the loudest remaining
signal that this is shop software."
```

---

### Task 5: De-nest the garage card

**Files:**
- Modify: `app/index.tsx:87-217`
- Test: `tests/garage-card.test.tsx` (create)

**Interfaces:**
- Consumes: `Card`, `useTheme`, `VehicleMark` is **not** used yet — that is Task 9.
- Produces: no exported API change.

- [ ] **Step 1: Write the failing test**

Create `tests/garage-card.test.tsx` with the same `expo-router` / `db/client` / purchases mocks used at the top of `tests/onboarding-screens.test.tsx` (copy them verbatim — the harness is identical), then:

```tsx
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Pressable } from "react-native";
import Garage from "../app/index";
import { createVehicle } from "../src/db/vehicles";
import { setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
  createVehicle({ name: "2016 Honda Civic", odometer: 101475 });
});

test("a vehicle row is one tap target, not a card wrapping a button", () => {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Garage));
  });
  const pressables = tree.root.findAllByType(Pressable);
  // One per vehicle, plus the settings control and the primary footer action.
  // The old card nested an "Open and log a service" pill inside the card,
  // giving every vehicle two targets a tap could land on and three borders
  // between the reader and the number.
  const rowPressables = pressables.filter((p) =>
    p.findAll((n) => typeof n.type === "string")
      .some((n) => JSON.stringify(n.props.children ?? "").includes("Civic"))
  );
  expect(rowPressables).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/garage-card.test.tsx`
Expected: FAIL — `expected length 1, received 2`

- [ ] **Step 3: Restructure the row**

In `app/index.tsx`, wrap the whole `Card` in a single `Pressable` that routes to `/vehicle/${vehicle.id}`, delete the inner "Open and log a service" pill and its container, and put a single chevron glyph at the trailing edge of the header row. The status `Badge` and the odometer readout stay. Remove the now-unused catalog key reference — but **leave the key in the catalogs**; retiring 11 catalog entries is out of scope here and an unused key breaks nothing.

- [ ] **Step 4: Run tests**

Run: `npx tsc --noEmit && npx jest`
Expected: clean. `tests/onboarding-screens.test.tsx` does not render the garage, so it is unaffected.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx tests/garage-card.test.tsx
git commit -m "fix: the garage row is one tap target

A card containing a pill containing a label is three borders between the
reader and the number, and two places a tap can land for one intent."
```

---

### Task 6: The `body_style` column

**Files:**
- Create: `src/vehicles/bodyStyles.ts`
- Modify: `src/db/schema.ts`, `src/db/vehicles.ts`
- Test: `tests/migrations.test.ts`, `tests/body-style.test.ts` (create)

**Interfaces:**
- Consumes: `getDb` from `src/db/client.ts`.
- Produces:
  - `BODY_STYLES: readonly BodyStyle[]` and `type BodyStyle = "sedan" | "hatchback" | "coupe" | "wagon" | "suv" | "pickup" | "van"`, plus `isBodyStyle(value: string): value is BodyStyle`, from `src/vehicles/bodyStyles.ts`
  - `Vehicle` gains `body_style?: BodyStyle`
  - `createVehicle` accepts `body_style?: BodyStyle`
  - `updateVehicleIdentity(vehicleId, v: { name: string; make?: string; model?: string; year?: number; body_style?: BodyStyle })`
  - `setBodyStyle(vehicleId: string, style: BodyStyle): void`

- [ ] **Step 1: Write the failing tests**

Append to `tests/migrations.test.ts`:

```ts
test("migration 6 adds body_style and leaves existing rows unknown", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v1", "Civic", "2026-01-01T00:00:00.000Z"
  );
  applyMigrations(exec, MIGRATIONS.length);
  const row: any = db.prepare("SELECT body_style FROM vehicles WHERE id='v1'").get();
  // Nullable rather than defaulted: a row written before the column existed
  // has no body style, and claiming it is a sedan is a guess the garage would
  // then draw as a fact.
  expect(row.body_style).toBeNull();
});
```

Create `tests/body-style.test.ts` with the `db/client` mock from `tests/theme.test.ts`, then:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/migrations.test.ts tests/body-style.test.ts`
Expected: FAIL — `no such column: body_style`, and `Cannot find module '../src/vehicles/bodyStyles'`

- [ ] **Step 3: Add the migration**

Append to `MIGRATIONS` in `src/db/schema.ts`:

```ts
  // The body of the car, asked as one tap in onboarding and drawn everywhere
  // the vehicle appears. Nullable rather than defaulted: every row written
  // before this column has no answer, and defaulting them to "sedan" would
  // have the garage drawing a guess as a fact. Unknown falls back to the sedan
  // mark at render time, which is a drawing choice and reversible; a wrong
  // value on disk is neither.
  {
    version: 6,
    sql: `
      ALTER TABLE vehicles ADD COLUMN body_style TEXT;
    `,
  },
```

- [ ] **Step 4: Add the type and the accessors**

Create `src/vehicles/bodyStyles.ts`:

```ts
/**
 * The seven bodies, and the order they are offered in.
 *
 * Seven because seven drawings cover every car this app will meet, and because
 * a body style is the one fact about a vehicle that can be answered in a single
 * tap without typing. Order is roughly by prevalence, so the common answer is
 * the first thumb reach.
 */
export const BODY_STYLES = [
  "sedan",
  "hatchback",
  "coupe",
  "wagon",
  "suv",
  "pickup",
  "van",
] as const;

export type BodyStyle = (typeof BODY_STYLES)[number];

export function isBodyStyle(value: string): value is BodyStyle {
  return (BODY_STYLES as readonly string[]).includes(value);
}
```

In `src/db/vehicles.ts`: add `body_style?: BodyStyle` to the `Vehicle` type with a comment noting that absent means unknown; add `body_style` to `createVehicle`'s parameter type and to its `INSERT` column list and values; add `body_style` to `updateVehicleIdentity`'s parameter type and its `UPDATE` statement; and add:

```ts
/** The one-tap answer from onboarding, and the correction from the detail
 *  screen. Separate from updateVehicleIdentity because onboarding sets it
 *  without touching the name, make, model or year the previous step wrote. */
export function setBodyStyle(vehicleId: string, style: BodyStyle): void {
  getDb().runSync("UPDATE vehicles SET body_style = ? WHERE id = ?", [style, vehicleId]);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/migrations.test.ts tests/body-style.test.ts`
Expected: PASS. The existing `no migration contains a destructive statement` test also still passes — `ALTER TABLE ... ADD COLUMN` contains neither `DROP` nor `DELETE FROM`.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/vehicles.ts src/vehicles/bodyStyles.ts \
        tests/migrations.test.ts tests/body-style.test.ts
git commit -m "feat: vehicles.body_style, nullable

Seven values, one per drawing. Nullable so every existing row reads as
unknown rather than as a sedan the garage would then draw as a fact."
```

---

### Task 7: The catalog keys

Nine keys, in English and all ten BASE catalogs. This is its own task because it is the one commit that cannot be partial: `tests/i18n.test.ts` compares key sets for exact equality.

**Files:**
- Modify: `src/i18n/catalog/en/onboardingA.ts`, `src/i18n/catalog/en/vehicle.ts`, `src/i18n/catalog/en/settings.ts`, and all of `src/i18n/catalog/{de,fr,it,es,ptBR,nl,sv,pl,ja,ko}.ts`
- Test: `tests/i18n.test.ts`, `tests/localization-smoke.test.ts` (no edits — they already assert the requirement)

**Interfaces:**
- Produces these keys, consumed by Tasks 8, 9 and 10:
  - `onboardingA.body.title` — "What kind of car is it?"
  - `vehicle.body.sedan` `.hatchback` `.coupe` `.wagon` `.suv` `.pickup` `.van` — the seven labels
  - `settings.theme.label` — "Appearance"

- [ ] **Step 1: Run the parity suite to confirm the current baseline is green**

Run: `npx jest tests/i18n.test.ts`
Expected: PASS. Establish this before adding keys, so a failure after is unambiguously yours.

- [ ] **Step 2: Add the English keys**

In `src/i18n/catalog/en/onboardingA.ts`:

```ts
  // No subtitle. "What kind of car is it?" over seven pictures of cars needs
  // no gloss, and the frame allows at most one muted line anyway.
  "onboardingA.body.title": "What kind of car is it?",
```

In `src/i18n/catalog/en/vehicle.ts`:

```ts
  // The body of the car. Plain consumer words, not classification: an owner
  // says "hatchback", never "5-door B-segment". "Estate" and "wagon" split by
  // region, which is what the en-GB and en-AU overlays are for.
  "vehicle.body.sedan": "Sedan",
  "vehicle.body.hatchback": "Hatchback",
  "vehicle.body.coupe": "Coupe",
  "vehicle.body.wagon": "Wagon",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pickup",
  "vehicle.body.van": "Van",
```

In `src/i18n/catalog/en/settings.ts`:

```ts
  "settings.theme.label": "Appearance",
```

- [ ] **Step 3: Run the suite to see it fail with a precise list**

Run: `npx jest tests/i18n.test.ts -t "translates every key"`
Expected: FAIL for all 10 BASE languages, each diff naming the 9 missing keys.

- [ ] **Step 4: Translate into the ten BASE catalogs**

Add all 9 keys to each of `de fr it es pt-BR nl sv pl ja ko`. Use the terms an owner uses in that market, not a literal translation of the English:

| key | de | fr | it | es | pt-BR | nl | sv | pl | ja | ko |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `onboardingA.body.title` | Was für ein Auto ist es? | Quel type de voiture ? | Che tipo di auto è? | ¿Qué tipo de coche es? | Que tipo de carro é? | Wat voor auto is het? | Vilken typ av bil är det? | Jaki to samochód? | どんな車ですか？ | 어떤 차인가요? |
| `vehicle.body.sedan` | Limousine | Berline | Berlina | Sedán | Sedã | Sedan | Sedan | Sedan | セダン | 세단 |
| `vehicle.body.hatchback` | Schrägheck | Berline compacte | Utilitaria | Hatchback | Hatch | Hatchback | Halvkombi | Hatchback | ハッチバック | 해치백 |
| `vehicle.body.coupe` | Coupé | Coupé | Coupé | Cupé | Cupê | Coupé | Coupé | Coupé | クーペ | 쿠페 |
| `vehicle.body.wagon` | Kombi | Break | Station wagon | Familiar | Perua | Stationwagen | Kombi | Kombi | ワゴン | 왜건 |
| `vehicle.body.suv` | SUV | SUV | SUV | SUV | SUV | SUV | SUV | SUV | SUV | SUV |
| `vehicle.body.pickup` | Pick-up | Pick-up | Pick-up | Pickup | Picape | Pick-up | Pickup | Pickup | ピックアップ | 픽업트럭 |
| `vehicle.body.van` | Van | Monospace | Furgone | Furgoneta | Van | Bestelwagen | Skåpbil | Van | バン | 밴 |
| `settings.theme.label` | Erscheinungsbild | Apparence | Aspetto | Apariencia | Aparência | Weergave | Utseende | Wygląd | 外観 | 화면 스타일 |

No key here takes a placeholder and none is a plural entry, so the placeholder-parity and plural-category tests pass without further work.

- [ ] **Step 5: Add the two regional overlays that need different words**

In `src/i18n/catalog/enGB.ts` and `enAU.ts`:

```ts
  // A British or Australian owner says "estate", never "wagon", and "ute"
  // rather than "pickup" in Australia. The overlay exists for exactly this.
  "vehicle.body.wagon": "Estate",
```

and in `enAU.ts` additionally:

```ts
  "vehicle.body.pickup": "Ute",
```

- [ ] **Step 6: Run the full i18n suites**

Run: `npx jest tests/i18n.test.ts tests/localization-smoke.test.ts`
Expected: PASS. `localization-smoke` renders every string of every language, so a stray placeholder or an empty value surfaces here.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/catalog
git commit -m "i18n: nine keys for the body-style step and the theme row

Seven body labels in market terms rather than literal translations -
en-GB and en-AU take Estate, and en-AU takes Ute."
```

---

### Task 8: The body-style step

**Files:**
- Create: `app/onboarding/body.tsx`
- Modify: `src/onboarding/flow.ts`, `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md`
- Test: `tests/onboarding-screens.test.tsx`, `tests/onboarding-flow.test.ts`

The art does not exist yet, so this step renders the seven **labels** as chips. Task 9 replaces the chip content with the marks. Splitting it this way keeps the whole flow, its analytics and its tests landable without blocking on assets.

**Interfaces:**
- Consumes: `BODY_STYLES`, `type BodyStyle` (Task 6); `setBodyStyle` (Task 6); `getOnboardingVehicleId` from `src/onboarding`; `OnboardingScreen` from `src/onboarding/Screen`; `useAdvance` from `src/onboarding/nav`; `trackQuizAnswer(route: string, answer: Record<string, string | number | boolean | string[]>)` from `src/analytics`; keys from Task 7.
- Produces: route `"body"` in `FLOW` between `"vehicle"` and `"odometer"`, and in `QUIZ` — the quiz becomes 7 questions, so every `QUESTION n / 6` label becomes `n / 7` automatically via `quizStep`.

- [ ] **Step 1: Write the failing tests**

In `tests/onboarding-flow.test.ts`, add:

```ts
import { FLOW, QUIZ, nextRoute, previousRoute, quizStep } from "../src/onboarding/flow";

test("body sits between the car and the odometer", () => {
  expect(nextRoute("vehicle")).toBe("body");
  expect(nextRoute("body")).toBe("odometer");
  expect(previousRoute("odometer")).toBe("body");
});

test("the quiz is seven questions and body is the second", () => {
  expect(QUIZ).toHaveLength(7);
  expect(quizStep("body")).toEqual({ step: 2, total: 7 });
});
```

In `tests/onboarding-screens.test.tsx`, add the import `import OnboardingBody from "../app/onboarding/body";` and:

```tsx
describe("the body-style step", () => {
  test("offers seven bodies and no Continue button", () => {
    setOnboardingVehicleId(createVehicle({ name: "2016 Civic" }).id);
    const tree = render(OnboardingBody);
    const strings = stringsIn(tree.root);
    for (const label of ["Sedan", "Hatchback", "Coupe", "Wagon", "SUV", "Pickup", "Van"]) {
      expect(strings).toContain(label);
    }
    // The step costs one tap. A Continue button would make it two, for an
    // answer that is already unambiguous the moment it is given.
    expect(strings).not.toContain("Continue");
  });

  test("a tap records the body and advances", () => {
    const id = createVehicle({ name: "2023 F-150" }).id;
    setOnboardingVehicleId(id);
    const tree = render(OnboardingBody);
    const pickup = tree.root.findAll(
      (n) => typeof n.type !== "string" && n.props?.label === "Pickup"
    )[0];
    act(() => {
      pickup.props.onPress();
    });
    expect(getVehicle(id)?.body_style).toBe("pickup");
    expect(navigated.at(-1)).toBe("/onboarding/odometer");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/onboarding-flow.test.ts tests/onboarding-screens.test.tsx`
Expected: FAIL — `Cannot find module '../app/onboarding/body'`, and `nextRoute("vehicle")` returns `"odometer"`.

- [ ] **Step 3: Insert the route**

In `src/onboarding/flow.ts`, add `"body",` immediately after `"vehicle",` in `FLOW`, and after `"vehicle",` in `QUIZ`. Update the `FLOW` comment: "Six questions" becomes "Seven questions". Update the `QUIZ` doc comment's `QUESTION n / 6` to `n / 7`.

- [ ] **Step 4: Write the screen**

Create `app/onboarding/body.tsx`:

```tsx
import { View } from "react-native";
import { Chip } from "../../src/design/Chip";
import { tokens } from "../../src/design/tokens";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { setBodyStyle } from "../../src/db/vehicles";
import { BODY_STYLES, type BodyStyle } from "../../src/vehicles/bodyStyles";
import { trackQuizAnswer } from "../../src/analytics";
import { t } from "../../src/i18n";

/**
 * The body of the car, in one tap.
 *
 * Its own step rather than a third control on the vehicle screen: that screen's
 * own history is a version with three controls and about seventy tap targets
 * for two answers, and a seven-item grid would rebuild it. And its own step is
 * affordable here because it costs one tap and no typing — there is no
 * Continue, because an answer that is unambiguous the moment it is given does
 * not need confirming.
 *
 * This is also the only screen in the quiz that is mostly picture, which is
 * the point: it is where the flow stops looking like a form.
 */
export default function Body() {
  const advance = useAdvance("body");
  const vehicleId = getOnboardingVehicleId();

  function choose(style: BodyStyle) {
    // No vehicle means the user deep-linked past the screen that creates one.
    // Advancing without writing is right: the next screens do not need a body
    // style, and the detail screen can set it later.
    if (vehicleId) setBodyStyle(vehicleId, style);
    trackQuizAnswer("body", { body_style: style });
    advance();
  }

  return (
    <OnboardingScreen route="body" title={t("onboardingA.body.title")}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: tokens.space.sm,
          justifyContent: "center",
        }}
      >
        {BODY_STYLES.map((style) => (
          <Chip
            key={style}
            label={t(`vehicle.body.${style}`)}
            selected={false}
            onPress={() => choose(style)}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/onboarding-flow.test.ts tests/onboarding-screens.test.tsx`
Expected: PASS. If `tests/onboarding-run.test.ts` or `onboarding-state.test.ts` assert a step count or walk the flow array, they will also need the new route — fix those in this task, not later.

- [ ] **Step 6: Append the register entry**

Add to the end of `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md`, under `## The register`:

```markdown
### 2026-08-27 — a seventh quiz question

`body` was inserted between `vehicle` and `odometer`, asking the body style in
one tap. The quiz went from six questions to seven, so:

- Every `QUESTION n / 6` label became `n / 7`. Any analysis keyed on the
  printed step count is comparing two different denominators.
- Depth-in-flow comparisons across this line are meaningless. Use `route`.
- `vehicle` → `odometer` is no longer an adjacent pair. A funnel defined on
  those two steps silently measures a three-step span after this date and will
  read as a drop-off that did not happen.
- The new step's own drop-off is `route:body` → `route:odometer`. It costs one
  tap and no typing, so a large fall there is a signal that the seven labels
  are not legible, not that the question is unwelcome.
```

- [ ] **Step 7: Run the full suite and commit**

Run: `npx tsc --noEmit && npx jest`

```bash
git add app/onboarding/body.tsx src/onboarding/flow.ts tests \
        docs/superpowers/specs/2026-08-26-funnel-comparability-register.md
git commit -m "feat: ask the body style in one tap

A seventh quiz question, inserted after the car. Register entry in the
same commit: vehicle -> odometer is no longer an adjacent pair, and a
funnel defined on that pair now measures a three-step span."
```

---

### Task 9: The vehicle marks and the welcome hero

**Blocked on assets.** Verify all eight PNGs exist before starting.

**Files:**
- Create: `src/design/VehicleMark.tsx`
- Modify: `app/onboarding/body.tsx`, `app/onboarding/welcome.tsx`, `app/onboarding/results.tsx`, `app/onboarding/paywall.tsx`, `app/onboarding/offer.tsx`, `app/index.tsx`, `app/vehicle/[id].tsx`
- Test: `tests/body-style.test.ts` (add cases)

**Interfaces:**
- Consumes: `type BodyStyle`, `BODY_STYLES` (Task 6); `useTheme` (Task 1).
- Produces: `VehicleMark({ bodyStyle, width, tone }: { bodyStyle?: BodyStyle | null; width: number; tone?: "ink" | "muted" | "accent" })` from `src/design/VehicleMark.tsx`.

- [ ] **Step 1: Verify the assets**

```bash
ls -la assets/vehicles/ assets/onboarding/welcome-light.png
file assets/vehicles/*.png
```

Expected: seven PNGs plus the hero. Each vehicle PNG should report `1200 x 640` with an alpha channel (`RGBA`). If any is missing or opaque, stop and report — do not proceed.

- [ ] **Step 2: Write the failing test**

Append to `tests/body-style.test.ts`:

```tsx
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Image } from "react-native";
import { VehicleMark } from "../src/design/VehicleMark";

function mark(props: Parameters<typeof VehicleMark>[0]) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(VehicleMark, props));
  });
  return tree.root.findByType(Image);
}

test("draws a different source per body style", () => {
  const sources = BODY_STYLES.map((s) => mark({ bodyStyle: s, width: 120 }).props.source);
  expect(new Set(sources).size).toBe(BODY_STYLES.length);
});

test("an unknown body style falls back to the sedan rather than to nothing", () => {
  expect(mark({ bodyStyle: null, width: 120 }).props.source).toBe(
    mark({ bodyStyle: "sedan", width: 120 }).props.source
  );
  expect(mark({ bodyStyle: undefined, width: 120 }).props.source).toBe(
    mark({ bodyStyle: "sedan", width: 120 }).props.source
  );
});

test("is tinted rather than shipped twice per theme", () => {
  const style = mark({ bodyStyle: "suv", width: 120 }).props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  expect(flat.tintColor).toBeTruthy();
});

test("keeps the drawing's aspect ratio at any width", () => {
  const style = mark({ bodyStyle: "van", width: 300 }).props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  expect(flat.width).toBe(300);
  expect(flat.height).toBeCloseTo(300 * (640 / 1200), 1);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest tests/body-style.test.ts`
Expected: FAIL — `Cannot find module '../src/design/VehicleMark'`

- [ ] **Step 4: Write the component**

Create `src/design/VehicleMark.tsx`:

```tsx
import { Image } from "react-native";
import { useTheme } from "./theme";
import type { BodyStyle } from "../vehicles/bodyStyles";

/**
 * The seven drawings, and the only module that knows their paths.
 *
 * One flat ink colour on transparency, recoloured with `tintColor`, so a
 * theme costs nothing: fourteen files became seven. `require` at module scope
 * rather than a computed path because the Metro bundler resolves these
 * statically — a template string would resolve to nothing at runtime.
 */
const MARKS: Record<BodyStyle, number> = {
  sedan: require("../../assets/vehicles/sedan.png"),
  hatchback: require("../../assets/vehicles/hatchback.png"),
  coupe: require("../../assets/vehicles/coupe.png"),
  wagon: require("../../assets/vehicles/wagon.png"),
  suv: require("../../assets/vehicles/suv.png"),
  pickup: require("../../assets/vehicles/pickup.png"),
  van: require("../../assets/vehicles/van.png"),
};

/** The drawings' own proportion. Height is derived so no caller can squash one. */
const RATIO = 640 / 1200;

export function VehicleMark({
  bodyStyle,
  width,
  tone = "ink",
}: {
  /** Absent or null means the vehicle predates the question. Drawn as a sedan:
   *  a fallback drawing is reversible, and an empty space where the car should
   *  be reads as a failed image load. */
  bodyStyle?: BodyStyle | null;
  width: number;
  tone?: "ink" | "muted" | "accent";
}) {
  const c = useTheme();
  const tint = { ink: c.ink, muted: c.inkMuted, accent: c.accent }[tone];

  return (
    <Image
      source={MARKS[bodyStyle ?? "sedan"]}
      resizeMode="contain"
      style={{ width, height: width * RATIO, tintColor: tint }}
      accessibilityIgnoresInvertColors
    />
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/body-style.test.ts`
Expected: PASS

- [ ] **Step 6: Put the mark on the six surfaces**

- `app/onboarding/body.tsx` — replace the seven `Chip`s with seven `Pressable` tiles in a 2-column grid, each holding `<VehicleMark bodyStyle={style} width={132} tone="ink" />` above `t(`vehicle.body.${style}`)` in `tokens.text.body`. Keep `choose()` exactly as it is. Keep the label — a drawing alone is a guessing game, and the label is what the 10 catalogs translated.
- `app/onboarding/results.tsx` — `<VehicleMark bodyStyle={vehicle.body_style} width={240} tone="ink" />` above the existing headline.
- `app/onboarding/paywall.tsx` and `offer.tsx` — the same at `width={140}`, `tone="muted"`, above the price block.
- `app/index.tsx` — `width={64}`, `tone="muted"`, at the leading edge of each vehicle row's header. It must not become a second tap target: it lives inside the row's single `Pressable` from Task 5.
- `app/vehicle/[id].tsx` — `width={180}`, `tone="ink"`, in the header, plus a body-style row that calls `setBodyStyle` so the sedan fallback is correctable.

- [ ] **Step 7: Swap the welcome hero**

In `app/onboarding/welcome.tsx`, the existing `require("../../assets/onboarding/light.jpeg")` becomes theme-dependent: `light.jpeg` for dark, `welcome-light.png` for light. `LIGHT_RATIO` is `1242 / 1663` for the photo and `1200 / 900` for the illustration — read the ratio from whichever asset is selected rather than keeping one constant, or the illustration renders stretched.

- [ ] **Step 8: Run the suite**

Run: `npx tsc --noEmit && npx jest`
Expected: clean. The body-step test from Task 8 that asserted `label` props on `Chip` must be updated to find the tiles — the seven labels are still on the glass, so `stringsIn` assertions survive unchanged.

- [ ] **Step 9: Commit**

```bash
git add assets/vehicles assets/onboarding/welcome-light.png src/design/VehicleMark.tsx \
        app tests/body-style.test.ts tests/onboarding-screens.test.tsx
git commit -m "feat: seven vehicle marks carry the visual identity

One tint-driven family in the picker, on results, on the paywall, on every
garage card and on the detail header. By the paywall it is a drawing of the
car the user picked themselves, which is the whole argument for asking."
```

---

### Task 10: The appearance setting

**Files:**
- Modify: `app/settings.tsx`
- Test: `tests/theme.test.ts` (add a case)

**Interfaces:**
- Consumes: `useThemeMode()` (Task 1); `settings.theme.label` (Task 7).

- [ ] **Step 1: Write the failing test**

Append to `tests/theme.test.ts`:

```ts
test("a chosen mode is what the next launch reads", () => {
  // The provider seeds its state from getThemeMode() once, at mount. If
  // setMode did not write through, the choice would survive the session and
  // vanish on the next cold start - the failure users report as "it forgot".
  setThemeMode("dark");
  const { getThemeMode: fresh } = require("../src/design/themeState");
  expect(fresh()).toBe("dark");
});
```

- [ ] **Step 2: Run it**

Run: `npx jest tests/theme.test.ts`
Expected: PASS immediately — `setThemeMode` already writes through. This case exists as a regression guard, not as a red test. Note that in the commit message rather than inventing a failure.

- [ ] **Step 3: Add the row**

In `app/settings.tsx`, add a row next to the units and language rows that cycles `system → light → dark → system`, labelled `t("settings.theme.label")` with the current mode as its value. Follow the existing row pattern in that file exactly — same `Card`, same `Button`/pressable shape, same `msg` feedback convention. Unlike `onUnits`, this needs **no confirmation dialog**: nothing is rewritten on disk and the change is instantly visible and instantly reversible.

- [ ] **Step 4: Run and commit**

Run: `npx tsc --noEmit && npx jest`

```bash
git add app/settings.tsx tests/theme.test.ts
git commit -m "feat: an appearance row

Cycles system/light/dark. No confirmation: nothing is rewritten, and the
change is visible and reversible in one tap - unlike a unit switch, which
rewrites every stored reading."
```

---

### Task 11: Icon and splash

**Blocked on assets.**

**Files:**
- Modify: `assets/icon.png`, `assets/splash-icon.png`, `assets/android-icon-foreground.png`, `assets/android-icon-background.png`, `assets/android-icon-monochrome.png`, `app.json` or `app.config.js` (only if the splash background colour is set there)

- [ ] **Step 1: Verify and place the assets**

```bash
file assets/icon.png assets/splash-icon.png
```

Expected: `icon.png` is 1024×1024 and **opaque** — an iOS icon with an alpha channel is rejected at submission. `splash-icon.png` keeps whatever dimensions the current file has.

- [ ] **Step 2: Update the splash background**

The splash background is currently the dark housing colour. Find it:

```bash
npx grep -rn "backgroundColor" app.json app.config.js
```

Set it to `#F7F4EF` so the launch does not flash near-black before a light first screen. Update the Android adaptive-icon background to the accent `#C2611A` to match the iOS icon.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npx jest`
Expected: clean — no test reads an icon, so this is a regression check only.

```bash
git add assets app.json app.config.js
git commit -m "feat: accent icon and a light splash

The splash flashed near-black before a light first screen."
```

---

### Task 12: Re-shoot the store set at 6.9"

**Blocked on Tasks 1–11 shipping.** The frames must show the redesigned app.

**Files:**
- Create: `store/screenshots/<locale>/IPHONE_69/01..06-*.png` for all 16 locales
- Delete: `store/screenshots/*/IPHONE_65/`
- Modify: `store/screenshot-captions.json` (the `notes` object only)

- [ ] **Step 1: Capture the six base frames**

Run the app on a 6.9" device or simulator (iPhone 17 Pro Max or equivalent, 1290×2796) in **light mode**, with the seeded demo data the current frames use — 2016 Honda Civic at 101,475 mi with an overdue oil change, 2023 Ford F-150, 2025 Tesla Model S. Capture, in this order:

1. vehicle detail with the overdue oil change — the problem
2. the garage, three vehicles — the scope
3. the log sheet mid-entry — the effort
4. vehicle detail history — the record
5. the reminders state — the peace of mind
6. settings showing export — the trust

- [ ] **Step 2: Compose the frames**

Each frame: the panorama slice as background, the screenshot in one current-generation device frame at identical scale and position across all six, the caption above in Instrument Sans Bold. Frames 1–3 take `#14161A` caption ink; frames 4–6 take `#FFFFFF`.

- [ ] **Step 3: Keep the caption keys, change the order**

The filename prefix is the shipped order; the `ScreenShotAppStoreN` suffix is the identity the 16 locales' copy hangs off. Map the new order onto the existing keys:

| position | caption key | caption (en-US) |
| --- | --- | --- |
| 01 | `ScreenShotAppStore3` | Know before it's overdue. |
| 02 | `ScreenShotAppStore6` | Every car in one place. |
| 03 | `ScreenShotAppStore2` | Log a service in 15 seconds. |
| 04 | `ScreenShotAppStore1` | Your car's maintenance log. |
| 05 | `ScreenShotAppStore4` | Set up in under a minute |
| 06 | `ScreenShotAppStore5` | Take your data anywhere. |

Update the `frames` array in `store/screenshot-captions.json` to that order. **Do not touch any `locales.*.captions` value.**

- [ ] **Step 4: Localise the set**

Repeat for all 16 locales using each locale's existing caption strings. Re-check line wrapping on `de-DE`, `nl-NL` and `pl`, which that file's own notes flag as the longest.

- [ ] **Step 5: Note the change**

Add to `notes` in `store/screenshot-captions.json`:

```
"visualRefresh": "August 2026: re-authored at 6.9in / 1290x2796 on the Warm Garage light theme, replacing the 6.5in dark set. One current-generation device frame across all six - the old set mixed a notched frame on 01 with a Dynamic Island on 02. Order changed to problem-then-trust: overdue, garage, log sheet, history, reminders, export. Caption face is Instrument Sans Bold, matching the app; Cambay is retired. No caption string changed in any locale."
```

- [ ] **Step 6: Verify and commit**

```bash
find store/screenshots -name '*.png' | wc -l   # expect 96
file store/screenshots/en-US/IPHONE_69/*.png   # expect 1290 x 2796
git rm -r store/screenshots/*/IPHONE_65
git add store
git commit -m "chore: re-shoot the store set at 6.9in on the light theme

The old set was 6.5in and got upscaled, mixed two device generations
across frames 1 and 2, and had no narrative order. Captions unchanged in
all 16 locales - only the frame order and the art."
```

---

## Post-Plan Verification

After Task 12, before any release:

- [ ] `npx tsc --noEmit` clean
- [ ] `npx jest` clean
- [ ] `npx grep -rn "metalFace\|edgeSolid\|edgeHeight\|pressTravel\|color.housing\|color.metal" src app` returns nothing
- [ ] Every screen viewed in **both** themes on a device: welcome, all 7 quiz steps, analyzing, results, symptoms, help, reviews, notify, paywall, offer, garage, vehicle detail, log, settings, intervals, language, winback, trial
- [ ] A pre-upgrade install opened on the new build: existing vehicles show the sedan fallback, records intact, `body_style` correctable from the detail screen
- [ ] Font-failure path: rename one TTF, confirm the app renders in the system face rather than hanging on the splash
- [ ] Register entry present for the added step
