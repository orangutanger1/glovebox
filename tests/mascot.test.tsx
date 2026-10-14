import { act } from "react";
import { Image } from "react-native";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The loops have the page colour baked in, so the loop set must match the page
 * the car stands on: A's #F4F4F7, or A v2's warm page.
 */
let mockV2 = false;
jest.mock("../src/design/theme", () => ({ isRedesign: () => true, isDesignV2: () => mockV2 }));

import { Mascot } from "../src/mascot/Mascot";

function sourceOf(animate: boolean) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<Mascot mood="happy" size={100} animate={animate} />);
  });
  const src = tree.root.findByType(Image).props.source;
  act(() => tree.unmount());
  return src;
}

test("A's loop on A's page", () => {
  mockV2 = false;
  expect(sourceOf(true)).toBe(require("../assets/mascot/car-happy.gif"));
});

test("v2's loop, graded to the warm page, in v2", () => {
  mockV2 = true;
  expect(sourceOf(true)).toBe(require("../assets/mascot/v2/car-happy.gif"));
});

test("the still is the same in both", () => {
  mockV2 = true;
  expect(sourceOf(false)).toBe(require("../assets/mascot/car-happy.png"));
});
