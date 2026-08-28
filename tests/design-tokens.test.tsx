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

import { Text } from "react-native";
import { Card } from "../src/design/Card";
import { Chip } from "../src/design/Chip";
import { LIGHT, DARK } from "../src/design/palette";
import { ThemeProvider } from "../src/design/theme";
import { type ThemeMode } from "../src/design/themeState";

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
