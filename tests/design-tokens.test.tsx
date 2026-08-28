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

    // The fill above is what the user sees; this is what draws it. A gradient
    // face was the metal, and a chip whose fill comes back from a gradient is
    // the bevel growing back under a passing colour assertion.
    const gradients = tree.root
      .findAll((n) => typeof n.type === "string")
      .filter((n) => String(n.type).includes("LinearGradient"));
    expect(gradients).toHaveLength(0);
  });
});
