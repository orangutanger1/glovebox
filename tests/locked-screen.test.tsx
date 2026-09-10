import { act, createElement, type ReactElement } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The wall, which for a user with no entitlement is the entire app.
 *
 * Two things are asserted, and both of them are the kind of mistake that is
 * invisible in a simulator with a sandbox subscription already active. The
 * first is that a restore is reachable at all: a user who reinstalls, or
 * switches device, or whose receipt has not synced arrives here holding a live
 * subscription and no entitlement to show for it, and without that link their
 * only route back into an app they are paying for is the App Store. Guideline
 * 3.1.1 requires it and review looks for it on exactly this screen.
 *
 * The second is that a successful restore actually opens the app. A restore
 * that reports success and leaves the user on the wall is worse than no
 * restore at all.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));

let mockRestored = false;
const mockPresent = jest.fn(async (_offering?: string) => "dismissed");
jest.mock("../src/purchases", () => ({
  DISCOUNT_OFFERING: "discount",
  hasOffering: async () => true,
  presentOffering: (offering?: string) => mockPresent(offering),
  restore: async () => mockRestored,
}));
jest.mock("../src/review", () => ({ recordReviewEvent: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Warning: "warning" },
}));

import { setLanguage } from "../src/i18n";
import Locked from "../app/locked";

beforeAll(() => setLanguage("en"));

beforeEach(() => {
  mockReplace.mockClear();
  mockPresent.mockClear();
  mockRestored = false;
});

function render(Component: () => ReactElement): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Component));
  });
  return tree;
}

function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.type === "string")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"));
}

/** Every pressable on the screen, by shape: jest-expo's Pressable is a memo
 *  wrapper, so it cannot be found by the imported type. */
function pressables(tree: TestRenderer.ReactTestRenderer) {
  return tree.root.findAll((n) => typeof n.props.onPress === "function");
}

test("the wall says there is no free version rather than letting them find out", () => {
  const printed = texts(render(Locked)).join(" ");
  expect(printed).toContain("Wrenchy is a subscription.");
  expect(printed).toContain("There is no free version");
});

test("a restore is on the wall, not only in Settings", () => {
  // Settings is behind the wall. A subscriber whose entitlement has not synced
  // cannot reach it, so this is their only route back in.
  expect(texts(render(Locked))).toContain("Restore purchases");
});

test("a successful restore opens the app", async () => {
  mockRestored = true;
  const tree = render(Locked);
  const restore = pressables(tree).at(-1)!;
  await act(async () => {
    await restore.props.onPress();
  });
  expect(mockReplace).toHaveBeenCalledWith("/");
});

test("a restore that finds nothing says so and leaves the user where they are", async () => {
  const tree = render(Locked);
  const restore = pressables(tree).at(-1)!;
  await act(async () => {
    await restore.props.onPress();
  });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(texts(tree)).toContain("No purchase found.");
});

test("the buy button offers the introductory price where the dashboard has it", async () => {
  // This user has already declined the standard price at least once to be
  // standing here. Asking again with the same offering is the ask that already
  // failed.
  const tree = render(Locked);
  await act(async () => {
    await pressables(tree)[0].props.onPress();
  });
  expect(mockPresent).toHaveBeenCalledWith("discount");
});
