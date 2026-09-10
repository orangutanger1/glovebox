import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/** Ease in, ease out, and hard through the middle — the standard cubic pair
 *  rather than React Native's own `Easing.inOut(Easing.cubic)`, which spends
 *  so long on the ramps that the bar looks stalled at both ends. */
const CURVE = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * A track with a bar filling it, for the one screen that makes the user wait.
 *
 * Sunken, not raised: the track sits below the surface it is drawn on, and the
 * fill is the only bright thing in it.
 *
 * It eases in and out rather than running flat. The first version was linear,
 * on the argument that a bar which accelerates is lying about the work — but
 * the wait it describes is not flat either. It starts as a machine picking the
 * job up and ends as one setting the answer down, and a constant-rate fill
 * across both reads as a countdown timer: something the app is waiting out
 * rather than something it is doing. The curve is symmetric, so the bar is
 * still at its own halfway point at the halfway moment and the readout beside
 * it never disagrees with the clock by more than the shape of the ramp.
 *
 * Width, not `scaleX`: a scaled bar grows from its centre unless it is nudged
 * back with a translate, and the two transforms disagree on a fractional
 * pixel. This runs once for a few seconds on a screen with nothing else
 * moving, so laying out is affordable and the geometry is exact.
 */
export function ProgressBar({
  duration,
  height = 6,
  onProgress,
}: {
  /** Milliseconds for the fill to cross the track. */
  duration: number;
  height?: number;
  /**
   * The same fill, as a whole percent, for a screen that wants to print it.
   *
   * Read off the driving `Animated.Value` rather than counted on a timer of
   * its own: two clocks for one bar drift, and a number that disagrees with
   * the bar beside it is worse than no number. Fires only when the rounded
   * value changes, so it is a hundred updates over the whole run and not one
   * per frame. Must be stable — wrap it in `useCallback`.
   */
  onProgress?: (percent: number) => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: CURVE,
      useNativeDriver: false,
    });
    run.start();
    return () => run.stop();
  }, [progress, duration]);

  useEffect(() => {
    if (!onProgress) return;
    let last = -1;
    const id = progress.addListener(({ value }) => {
      const percent = Math.round(value * 100);
      if (percent === last) return;
      last = percent;
      onProgress(percent);
    });
    return () => progress.removeListener(id);
  }, [progress, onProgress]);

  return (
    <View
      accessibilityRole="progressbar"
      style={{
        height,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.sunken,
        borderWidth: 1,
        borderColor: tokens.color.hairline,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.text,
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}
