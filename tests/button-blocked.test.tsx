import { act } from "react";
import { createElement } from "react";
import TestRenderer from "react-test-renderer";

/**
 * A refused Continue still reports.
 *
 * This is the regression test for the funnel's largest blind spot rather than
 * for a visual detail. Five quiz screens grey their Continue out until the
 * question is answered, and React Native's `Pressable` with `disabled` fires
 * no `onPress` at all — so a user who taps a dead button and closes the app
 * left behind exactly one row, `onboarding_step_viewed`, which is the same row
 * somebody who read the question and lost interest produces. The two are
 * opposite problems and were indistinguishable.
 *
 * The vehicle screen's validation loop is the precedent: it was only ever
 * diagnosable because it happened to emit `year:invalid` on every refusal, and
 * one device left forty of them behind in 112 seconds. Nothing else in the
 * quiz emitted anything.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Warning: "warning" },
}));

import { Button } from "../src/design/Button";

function render(element: Parameters<typeof TestRenderer.create>[0]) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return tree;
}

/**
 * The `Pressable` the button is built on, found by shape rather than by type.
 *
 * `findByType(Pressable)` does not work under jest-expo: react-native's
 * Pressable is a `forwardRef`/memo wrapper, so the element in the tree is not
 * the imported symbol. The pressable is instead the outermost node carrying
 * both a press handler and the accessibility state the Button sets on it.
 */
function pressableOf(tree: TestRenderer.ReactTestRenderer) {
  return tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && n.props.accessibilityState !== undefined
  )[0];
}

function press(tree: TestRenderer.ReactTestRenderer) {
  const pressable = pressableOf(tree);
  act(() => {
    pressable.props.onPress();
  });
  return pressable;
}

describe("a disabled Button", () => {
  test("reports the blocked press instead of swallowing it", () => {
    const onPress = jest.fn();
    const onBlockedPress = jest.fn();
    const tree = render(
      createElement(Button, { label: "Continue", onPress, disabled: true, onBlockedPress })
    );

    const pressable = press(tree);

    // The action must not run — the gate is still a gate.
    expect(onPress).not.toHaveBeenCalled();
    expect(onBlockedPress).toHaveBeenCalledTimes(1);
    // And the control has to stay live, or `onPress` never reaches the handler
    // at all. This is the assertion that encodes the bug: `disabled` on the
    // Pressable is what made the drop-off silent.
    expect(pressable.props.disabled).toBe(false);
  });

  test("still tells assistive technology it is disabled", () => {
    const tree = render(
      createElement(Button, {
        label: "Continue",
        onPress: jest.fn(),
        disabled: true,
        onBlockedPress: jest.fn(),
      })
    );
    expect(pressableOf(tree).props.accessibilityState).toEqual({ disabled: true });
  });

  test("counts every refusal, because the repeat is the signal", () => {
    const onBlockedPress = jest.fn();
    const tree = render(
      createElement(Button, {
        label: "Continue",
        onPress: jest.fn(),
        disabled: true,
        onBlockedPress,
      })
    );
    for (let i = 0; i < 5; i += 1) press(tree);
    expect(onBlockedPress).toHaveBeenCalledTimes(5);
  });

  test("without a reporter, behaves exactly as it did before", () => {
    const onPress = jest.fn();
    const tree = render(createElement(Button, { label: "Continue", onPress, disabled: true }));
    // No `onBlockedPress`, so nothing is being counted and there is no reason
    // to keep the control live. The old behaviour is the default.
    expect(pressableOf(tree).props.disabled).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("an enabled Button", () => {
  test("runs the action and never the blocked reporter", () => {
    const onPress = jest.fn();
    const onBlockedPress = jest.fn();
    const tree = render(
      createElement(Button, { label: "Continue", onPress, disabled: false, onBlockedPress })
    );

    press(tree);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onBlockedPress).not.toHaveBeenCalled();
  });
});
