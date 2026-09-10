import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/** How long one block takes to fill. The whole meter is this times its block
 *  count, so five years land in a beat over a second — long enough to read as
 *  accumulation, short enough that nobody waits for the total. */
const STEP_MS = 260;
/** Soft at both ends, flat through the middle: the meter starts, runs at a
 *  steady year-a-beat, and settles rather than stopping dead on the last one. */
const CURVE = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * A count of equal things, accumulating.
 *
 * This is what replaced a pair of bars on the cost screen — one bar a year, one
 * bar five years, the first drawn at exactly a fifth of the second. That is not
 * a comparison, it is a division sign drawn twice, and the reader who works out
 * that the short bar is a fifth of the long one has learned the number five.
 *
 * What is actually worth showing is that the yearly figure is not a yearly
 * event: it happens again, and again, and the total is the thing that gets big.
 * So the five years are five blocks in one track, and they fill one at a time
 * while the figure beside them counts up with them. The user watches the money
 * accumulate instead of being handed the sum.
 *
 * `onStep` reports how many blocks are full so the caller can print the running
 * total. It is driven off the same value that drives the blocks, so the number
 * and the meter cannot disagree — the same rule the loader's percentage follows.
 */
export function Segments({
  count,
  height = 26,
  tone = "metal",
  onStep,
}: {
  count: number;
  height?: number;
  /** `metal` states, `red` warns. Money the car costs whoever owns it is not a
   *  fault, so the cost screen is metal. */
  tone?: "metal" | "red";
  /** Called with 0…count as the blocks fill. Must be stable — wrap it in
   *  `useCallback`, or the listener is torn down and rebuilt every frame. */
  onStep?: (filled: number) => void;
}) {
  const run = useRef(new Animated.Value(0)).current;
  const blocks = Array.from({ length: Math.max(0, count) }, (_, i) => i);

  useEffect(() => {
    const anim = Animated.timing(run, {
      toValue: count,
      duration: count * STEP_MS,
      easing: CURVE,
      // JS-driven, because `onStep` reads this value from JS: a native-driven
      // value is the one place a listener and the thing it is listening to can
      // fall out of step, and the number printed beside this meter is the whole
      // reason the meter is animated at all.
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [run, count]);

  useEffect(() => {
    if (!onStep) return;
    let last = -1;
    const id = run.addListener(({ value }) => {
      const filled = Math.min(count, Math.floor(value));
      if (filled === last) return;
      last = filled;
      onStep(filled);
    });
    return () => run.removeListener(id);
  }, [run, onStep, count]);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 3,
        height,
        borderRadius: tokens.radius.sm,
        // The same sunken track every other meter in the app is drawn in, so
        // what fills it reads as sitting inside the surface.
        backgroundColor: tokens.color.sunken,
        borderWidth: 1,
        borderColor: tokens.color.hairline,
        overflow: "hidden",
        padding: 3,
      }}
    >
      {blocks.map((i) => (
        <Animated.View
          key={i}
          style={{
            flex: 1,
            borderRadius: 3,
            backgroundColor: tone === "red" ? tokens.color.red : tokens.color.text,
            // Each block owns one step of the run and ramps across it, so the
            // meter is a thing being filled rather than five lights switching
            // on. Clamped, so a block that has had its turn stays lit.
            opacity: run.interpolate({
              inputRange: [i, i + 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateY: run.interpolate({
                  inputRange: [i, i + 1],
                  outputRange: [4, 0],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
