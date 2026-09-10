import { useRef } from "react";
import { Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/**
 * The one press language in the app: a pressable surface scales to 0.97 and
 * back, over 120ms, decelerating.
 *
 * It replaces the machined travel — a face moving 2px into a hard edge band —
 * that the old material needed to feel like a control. Scale costs nothing on
 * the GPU, works on any shape, and is the feedback the user reads as "the
 * phone heard me" without ever looking at it.
 *
 * A timing rather than a keyframe, so a press released mid-animation retargets
 * from wherever it is instead of snapping back to rest and starting over.
 */
export function usePressScale(disabled = false) {
  const scale = useRef(new Animated.Value(1)).current;

  function to(value: number) {
    if (disabled) return;
    Animated.timing(scale, {
      toValue: value,
      duration: tokens.motion.press,
      easing: Easing.bezier(...tokens.motion.easeOut),
      useNativeDriver: true,
    }).start();
  }

  return {
    scale,
    onPressIn: () => to(tokens.material.pressScale),
    onPressOut: () => to(1),
  };
}
