import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The launch curtain is arm A's hand-off from the native splash. What matters
 * is that it never holds the first screen: the classic arm lets go at once, and
 * a waiter is released by the cap even if the curtain never reports.
 */
let mockRedesign = false;
jest.mock("../src/design/theme", () => ({ isRedesign: () => mockRedesign, isDesignV2: () => false }));

import { LaunchCurtain, resetLaunchCurtain, whenRevealed } from "../src/redesign/LaunchCurtain";

beforeEach(() => {
  jest.useFakeTimers();
  resetLaunchCurtain();
});

afterEach(() => {
  jest.useRealTimers();
});

test("classic arm: nothing drawn, waiters released on the next tick", () => {
  mockRedesign = false;
  const cb = jest.fn();
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<LaunchCurtain />);
  });
  whenRevealed(cb);
  expect(tree.root.findAllByProps({ testID: "launch-curtain" })).toHaveLength(0);
  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(cb).toHaveBeenCalledTimes(1);
  // Once revealed, later waiters fire synchronously.
  const late = jest.fn();
  whenRevealed(late);
  expect(late).toHaveBeenCalledTimes(1);
});

test("redesign arm: the curtain covers the first frame", () => {
  mockRedesign = true;
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<LaunchCurtain />);
  });
  expect(tree.root.findAllByProps({ testID: "launch-curtain" }).length).toBeGreaterThan(0);
});

test("a waiter is released by the cap when no curtain ever reports", () => {
  const cb = jest.fn();
  whenRevealed(cb, 500);
  jest.advanceTimersByTime(499);
  expect(cb).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(cb).toHaveBeenCalledTimes(1);
});

test("a cancelled waiter never fires", () => {
  const cb = jest.fn();
  const cancel = whenRevealed(cb, 500);
  cancel();
  jest.advanceTimersByTime(1000);
  expect(cb).not.toHaveBeenCalled();
});
