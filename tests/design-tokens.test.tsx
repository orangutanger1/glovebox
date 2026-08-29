import TestRenderer, { act } from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light" },
}));

/**
 * The palette a chip is drawn with is `ThemeProvider`'s output, and the
 * provider's one non-device input is the persisted mode — so that is where the
 * theme is driven from. Mocked at `themeState` rather than at `db/client`
 * because a chip test has no business booting sqlite to answer "which theme is
 * on the glass", and mocked rather than left to the context default because the
 * default is LIGHT: without the provider the dark row renders the light chip
 * and the two-row table only pretends to cover both themes.
 */
let mockStoredMode: ThemeMode = "light";
jest.mock("../src/design/themeState", () => ({
  getThemeMode: () => mockStoredMode,
  setThemeMode: () => {},
}));

/**
 * Everything below exists only so `app/_layout.tsx` can be rendered for the
 * status-bar test at the bottom of this file. `RootLayout` is the app's boot
 * sequence — database, purchases, analytics, notifications, quick actions —
 * and it is also the only place the palette decides the colour of the phone's
 * own glyphs, so there is no smaller unit to render. `Chrome` is not exported
 * and is deliberately not being exported to make this easier: the seam being
 * tested is the one the app actually mounts.
 *
 * The mocks are inert on purpose. None of the boot work is under test here;
 * the assertion is one prop on one element.
 */
jest.mock("expo-router", () => {
  const { createElement } = require("react");
  const Stack = ({ children }: { children?: React.ReactNode }) =>
    createElement("View", null, children);
  Stack.Screen = () => null;
  return {
    Stack,
    useRouter: () => ({ push: () => {}, replace: () => {}, navigate: () => {} }),
  };
});
jest.mock("react-native-gesture-handler", () => {
  const { createElement } = require("react");
  return {
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      createElement("View", null, children),
  };
});
jest.mock("expo-quick-actions", () => ({ initial: null }));
jest.mock("expo-quick-actions/hooks", () => ({ useQuickActionCallback: () => {} }));
/** Flipped by the boot test at the bottom of the file; loaded everywhere else. */
let mockFontsLoaded = true;
jest.mock("expo-font", () => ({ useFonts: () => [mockFontsLoaded, null] }));
let mockDbBoots = 0;
jest.mock("../src/db/client", () => ({
  getDb: () => {
    mockDbBoots += 1;
    return {};
  },
}));
jest.mock("../src/purchases", () => ({
  DISCOUNT_OFFERING: "discount",
  hasOffering: async () => false,
  initPurchases: () => {},
  isPro: async () => false,
}));
jest.mock("../src/analytics", () => ({
  identifyFromPurchases: async () => {},
  initAnalytics: () => {},
  reportFatals: () => {},
}));
jest.mock("../src/notify", () => ({ rescheduleAll: async () => {} }));
jest.mock("../src/onboarding", () => ({ isOnboarded: () => true, getOnboardingStep: () => null }));
jest.mock("../src/onboarding/flow", () => ({ resumeRoute: () => "welcome" }));
jest.mock("../src/review", () => ({ recordReviewEvent: () => {} }));
jest.mock("../src/winback", () => ({ recordOpen: () => null, getWinbackShownAt: () => null }));
jest.mock("../src/winback/state", () => ({ shouldOfferWinback: () => false }));
jest.mock("../src/quickactions", () => ({
  QUICK_ACTION_FEEDBACK: "feedback",
  QUICK_ACTION_TRIAL: "trial",
  syncQuickActions: async () => {},
}));
jest.mock("../src/feedback", () => ({ openFeedback: async () => {} }));
jest.mock("../src/i18n/preference", () => ({ bootLanguage: () => "en" }));
jest.mock("../src/units", () => ({ initDistanceUnit: () => {} }));

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { Badge } from "../src/design/Badge";
import { Card } from "../src/design/Card";
import { Chip } from "../src/design/Chip";
import { Glass } from "../src/design/Glass";
import { Lamp } from "../src/design/Lamp";
import { ListRow } from "../src/design/ListRow";
import { OdometerRoll } from "../src/design/OdometerRoll";
import { LIGHT, DARK } from "../src/design/palette";
import { ProgressBar } from "../src/design/ProgressBar";
import { ThemeProvider } from "../src/design/theme";
import { type ThemeMode } from "../src/design/themeState";
import { tokens } from "../src/design/tokens";
import { Wheel } from "../src/design/Wheel";
import RootLayout from "../app/_layout";

describe("an unselected chip is still visibly a control", () => {
  // The superseded spec's whole reason for existing: transparent-filled chips
  // over a near-black screen left users looking at bare text where a button
  // was. The metal is gone; the affordance must not go with it.
  test.each([
    ["light", LIGHT],
    ["dark", DARK],
  ] as const)("has a fill distinct from the screen in %s", (mode, palette) => {
    mockStoredMode = mode;
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ThemeProvider>
          <Chip label="Sedan" selected={false} onPress={() => {}} />
        </ThemeProvider>
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

    // Proof the provider is actually driving, and the assertion with teeth:
    // `cardSunken` differs between the palettes, so a light chip rendered in
    // the dark row fails here instead of passing the `base` check by accident.
    // It also rules out the other way to lose the affordance — a chip filled
    // with `card` on a `card` list is a control with no edge to it.
    expect(fills).toContain(palette.cardSunken);

    // The fill above is what the user sees; this is what draws it. A gradient
    // face was the metal, and a chip whose fill comes back from a gradient is
    // the bevel growing back under a passing colour assertion.
    const gradients = tree.root
      .findAll((n) => typeof n.type === "string")
      .filter((n) => String(n.type).includes("LinearGradient"));
    expect(gradients).toHaveLength(0);

    // Two rows, two roots: an unmounted renderer keeps a fiber tree alive past
    // teardown and jest force-exits the worker over it. Teardown is a React
    // update like any other, so it is wrapped too — an unwrapped unmount trades
    // the worker warning for an act warning.
    act(() => {
      tree.unmount();
    });
  });
});

describe("an overdue card keeps its opaque fill under the wash", () => {
  // `Card` passes the wash in through `Panel`'s `style`, which lands last in
  // the inner face's style array and therefore REPLACES the card fill rather
  // than tinting it. `Panel`'s shadow caster carries the opaque fill that the
  // wash then composites over; without it an overdue card is an 8% red film
  // over the screen with the drop shadow showing through it.
  test.each([
    ["light", LIGHT],
    ["dark", DARK],
  ] as const)("layers the wash over the card fill in %s", (mode, palette) => {
    mockStoredMode = mode;
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ThemeProvider>
          <Card status="overdue">
            <Text>Oil change</Text>
          </Card>
        </ThemeProvider>
      );
    });
    const fills = tree.root
      .findAll((n) => typeof n.type === "string")
      .flatMap((n) => {
        const style = n.props.style;
        const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
        return flat?.backgroundColor ? [flat.backgroundColor] : [];
      });
    expect(fills).toContain(palette.card);
    expect(fills).toContain(palette.overdueWash);
    expect(fills).toContain(palette.overdue);
    act(() => {
      tree.unmount();
    });
  });
});

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

const FILES = [
  ...sources(join(__dirname, "..", "src")),
  ...sources(join(__dirname, "..", "app")),
];

describe("the instrument-panel material system is gone", () => {
  test.each(["tokens.color", "tokens.material"])(
    "no source file mentions %s",
    (banned) => {
      const offenders = FILES.filter((f) => readFileSync(f, "utf8").includes(banned));
      expect(offenders).toEqual([]);
    }
  );
});

const MODES = [
  ["light", LIGHT],
  ["dark", DARK],
] as const;

/**
 * Every style value a rendered tree puts on a host node under one key.
 *
 * The two tests above inline this because they only look at
 * `backgroundColor`; the lamp and the glass are also judged on their border,
 * so the key is a parameter here. Style props arrive as arrays as often as
 * objects, and the last entry wins, which is exactly what `Object.assign`
 * does.
 */
function styleValues(tree: TestRenderer.ReactTestRenderer, key: string): unknown[] {
  return tree.root
    .findAll((n) => typeof n.type === "string")
    .flatMap((n) => {
      const style = n.props.style;
      const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      return flat?.[key] ? [flat[key]] : [];
    });
}

/**
 * Renders inside `ThemeProvider` with the stored mode set, because every
 * component below reads the palette out of context. A bare render always gets
 * the LIGHT default, which makes the dark row of a two-row table pass while
 * testing the light component twice.
 */
function renderThemed(mode: ThemeMode, node: React.ReactNode): TestRenderer.ReactTestRenderer {
  mockStoredMode = mode;
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<ThemeProvider>{node}</ThemeProvider>);
  });
  return tree;
}

describe("the lamp's tone", () => {
  // `tone` is an *additive* prop: it was allowed in only because omitting it
  // reproduces the previous render exactly. Four call sites rely on that —
  // `Gauge`'s `lamp` prop, `app/index.tsx`, `app/onboarding/paywall.tsx` and
  // `app/onboarding/symptoms.tsx` — and none of them names a tone. Flip the
  // default and every one of them silently turns from an alarm into a
  // progress pip, which is the failure this table exists to catch.
  test.each(MODES)(
    "defaults to alarm, so a call site that names no tone still renders red in %s",
    (mode, palette) => {
      const tree = renderThemed(mode, <Lamp lit />);
      const fills = styleValues(tree, "backgroundColor");
      expect(fills).toContain(palette.overdueWash);
      expect(fills).toContain(palette.overdue);
      expect(fills).not.toContain(palette.accent);
      act(() => {
        tree.unmount();
      });
    }
  );

  test.each(MODES)("lights the accent with no red bloom for progress in %s", (mode, palette) => {
    const tree = renderThemed(mode, <Lamp lit tone="progress" />);
    const fills = styleValues(tree, "backgroundColor");
    expect(fills).toContain(palette.accent);
    expect(fills).not.toContain(palette.overdueWash);
    expect(fills).not.toContain(palette.overdue);
    act(() => {
      tree.unmount();
    });
  });

  // The lit bulb used to be rimmed in 35% white, a dark-theme rim light that
  // draws a grey ring on warm paper. One hairline in every state now.
  test.each(MODES)("rims the bulb in the hairline, lit or not, in %s", (mode, palette) => {
    for (const lit of [true, false]) {
      const tree = renderThemed(mode, <Lamp lit={lit} />);
      const borders = styleValues(tree, "borderColor");
      expect(borders.length).toBeGreaterThan(0);
      for (const border of borders) expect(border).toBe(palette.hairline);
      act(() => {
        tree.unmount();
      });
    }
  });
});

describe("the glass pane is blur, not a slab", () => {
  // It used to paint `rgba(15,17,19,0.55)` over the blur, which is a black
  // pane whichever tint is beneath it — a black sticky footer on warm paper.
  // The blur plus one hairline is the separation now, so the only fill in the
  // tree is the `transparent` that jest-expo's `BlurView` mock contributes.
  test.each(MODES)("contributes no opaque fill of its own in %s", (mode, palette) => {
    const tree = renderThemed(
      mode,
      <Glass edge="bottom">
        <Text>Log service</Text>
      </Glass>
    );
    for (const fill of styleValues(tree, "backgroundColor")) {
      expect(fill).toBe("transparent");
    }
    const borders = styleValues(tree, "borderColor");
    expect(borders).toContain(palette.hairline);
    act(() => {
      tree.unmount();
    });
  });
});

describe("the progress bar is visible in its own track", () => {
  // The migration table's literal answer for the fill was `card`, which is
  // `#FFFFFF` in a `#F2EEE8` track: a progress bar you cannot see. The fill
  // being *different from the track* is the whole assertion.
  test.each(MODES)("fills the sunken track with the accent in %s", (mode, palette) => {
    const tree = renderThemed(mode, <ProgressBar duration={1000} />);
    const fills = styleValues(tree, "backgroundColor");
    expect(fills).toContain(palette.cardSunken);
    expect(fills).toContain(palette.accent);
    expect(palette.accent).not.toBe(palette.cardSunken);
    act(() => {
      tree.unmount();
    });
  });
});

describe("the odometer is drawn on the theme's own surfaces", () => {
  // The drums kept `#08090B`, `#1A1D20` and `#2A1215` through the palette
  // migration because they were never `tokens.color` references: a near-black
  // well with near-black strips in it, on warm paper.
  test.each(MODES)("sinks the well and lifts the digit strips in %s", (mode, palette) => {
    const tree = renderThemed(mode, <OdometerRoll value={123456} />);
    const fills = styleValues(tree, "backgroundColor");
    expect(fills).toContain(palette.cardSunken);
    expect(fills).toContain(palette.card);
    // The tenths drum, tinted rather than filled — the wash composites over
    // the well, so it reads against the `card` strips beside it.
    expect(fills).toContain(palette.overdueWash);
    act(() => {
      tree.unmount();
    });
  });
});

describe("the drums, rows and badges paint nothing the palette does not own", () => {
  // Stated as ownership rather than as a list of banned hexes: the leftovers
  // swept here were hard-coded literals, and the next one to appear will be a
  // literal nobody thought to add to a banned list.
  test.each(MODES)("every fill in the swept components is a palette value in %s", (mode, palette) => {
    const owned = [
      ...Object.values(palette).filter((v): v is string => typeof v === "string"),
      "transparent",
    ];
    const nodes = [
      <Wheel values={[2020, 2021, 2022]} labels={["2020", "2021", "2022"]} value={2021} onChange={() => {}} />,
      <OdometerRoll value={123456} />,
      <ListRow title="Oil change" subtitle="1,000 over" status="overdue" onPress={() => {}} />,
      ...(["due", "soon", "ok"] as const).map((tone) => <Badge key={tone} label="Due" tone={tone} />),
    ];
    for (const node of nodes) {
      const tree = renderThemed(mode, node);
      const fills = styleValues(tree, "backgroundColor");
      expect(fills.length).toBeGreaterThan(0);
      for (const fill of fills) expect(owned).toContain(fill);
      act(() => {
        tree.unmount();
      });
    }
  });
});

describe("the phone's own glyphs invert against the palette", () => {
  // `RootLayout` renders `ThemeProvider`, so the status bar reads the palette
  // from `Chrome` one node below it. Get that wrong and the bar is not merely
  // the wrong colour — it is the theme's colour, i.e. black glyphs on a
  // near-black bar or white on warm paper, and the clock disappears.
  //
  // `RootLayout` is rendered rather than `Chrome`, which is not exported: the
  // provider/consumer split is the thing under test, so the seam has to be the
  // one the app mounts.
  test.each([
    ["light", LIGHT, "dark"],
    ["dark", DARK, "light"],
  ] as const)("uses %s-palette glyphs opposite the blur tint", (mode, palette, glyphs) => {
    mockStoredMode = mode;
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<RootLayout />);
    });
    const bars = tree.root.findAllByType(StatusBar);
    expect(bars).toHaveLength(1);
    expect(bars[0].props.style).toBe(glyphs);
    // Stated as the property and not as a copy of the implementation: with
    // only two possible values, "not the tint" pins it.
    expect(bars[0].props.style).not.toBe(palette.blurTint);
    act(() => {
      tree.unmount();
    });
  });
});

describe("the type scale", () => {
  test("ships the two font files it names", () => {
    for (const family of ["InstrumentSans-SemiBold", "InstrumentSans-Bold"]) {
      expect(existsSync(join(__dirname, "..", "assets", "fonts", `${family}.ttf`))).toBe(true);
    }
  });

  test("puts the display face on display sizes and nowhere else", () => {
    expect(tokens.text.hero.fontFamily).toBe("InstrumentSans-Bold");
    expect(tokens.text.title.fontFamily).toBe("InstrumentSans-Bold");
    expect(tokens.text.heading.fontFamily).toBe("InstrumentSans-SemiBold");
    // Body, caption and readout stay on the system face: it is the better UI
    // font, and numbers need its tabular figures.
    expect("fontFamily" in tokens.text.body).toBe(false);
    expect("fontFamily" in tokens.text.caption).toBe(false);
    expect("fontFamily" in tokens.text.readout).toBe(false);
  });

  test("does not ask iOS to synthesise a bold on top of a real one", () => {
    expect("fontWeight" in tokens.text.hero).toBe(false);
    expect("fontWeight" in tokens.text.title).toBe(false);
    expect("fontWeight" in tokens.text.heading).toBe(false);
  });

  test("keeps tabular figures on every number style", () => {
    expect(tokens.text.readout.fontVariant).toEqual(["tabular-nums"]);
    expect(tokens.text.numeric.fontVariant).toEqual(["tabular-nums"]);
  });

  // The uppercase letterspaced legend is the dashboard's signature and was
  // also on every form label, decline link and header title in the app.
  test("reserves the uppercase legend for gauge readouts", () => {
    const offenders = FILES.filter((f) => readFileSync(f, "utf8").includes("tokens.text.legend"));
    expect(offenders).toEqual([join(__dirname, "..", "src", "design", "Gauge.tsx")]);
  });
});

describe("the display face is a refinement, not a launch requirement", () => {
  test("holds the first paint until the fonts settle but boots the database anyway", () => {
    mockFontsLoaded = false;
    const booted = mockDbBoots;
    let tree!: TestRenderer.ReactTestRenderer;
    try {
      act(() => {
        tree = TestRenderer.create(<RootLayout />);
      });
      expect(tree.toJSON()).toBeNull();
      expect(mockDbBoots).toBe(booted + 1);
      act(() => {
        tree.unmount();
      });
    } finally {
      mockFontsLoaded = true;
    }
  });
});
