import { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";
import { isDesignV2 } from "../design/theme";
import { useReduceMotion } from "../design/useReduceMotion";
import type { Mood } from "./mood";

const STILL: Record<Mood, number> = {
  happy: require("../../assets/mascot/car-happy.png"),
  "heads-up": require("../../assets/mascot/car-heads-up.png"),
  worried: require("../../assets/mascot/car-worried.png"),
  sleepy: require("../../assets/mascot/car-sleepy.png"),
  celebrating: require("../../assets/mascot/car-celebrating.png"),
};

// Idle loops of three to four seconds made from the stills with an
// image-to-video model and graded back to their colours
// (design-source/mascot/anim/grade.py). The car stays planted: it blinks,
// glances, sways or dozes, and never hops — the first set bounced on its
// suspension, and a hero that jumps every four seconds reads as nagging. Each has
// the page colour baked in, so they only go on the page, never on a card.
const LOOP: Record<Mood, number> = {
  happy: require("../../assets/mascot/car-happy.gif"),
  "heads-up": require("../../assets/mascot/car-heads-up.gif"),
  worried: require("../../assets/mascot/car-worried.gif"),
  sleepy: require("../../assets/mascot/car-sleepy.gif"),
  celebrating: require("../../assets/mascot/car-celebrating.gif"),
};

// The loops frame the car a little smaller than the stills do (room for the
// sparkles and the sway); drawn this much larger, the car is the same size either way.
// The same loops graded to A v2's warm page (`grade.py <out_dir> F6F3EE`).
const LOOP_V2: Record<Mood, number> = {
  happy: require("../../assets/mascot/v2/car-happy.gif"),
  "heads-up": require("../../assets/mascot/v2/car-heads-up.gif"),
  worried: require("../../assets/mascot/v2/car-worried.gif"),
  sleepy: require("../../assets/mascot/v2/car-sleepy.gif"),
  celebrating: require("../../assets/mascot/v2/car-celebrating.gif"),
};

const LOOP_SCALE = 1.14;

/**
 * The car, in one of its five moods.
 *
 * `animate` plays the mood's idle loop — the car blinks, glances, sways,
 * worries, dozes, always with its wheels on the ground.
 * Only heroes on the page get it; on a card or in a list the still is used,
 * and under Reduce Motion the still is used everywhere. A change of mood pops
 * in from 0.94 so the swap reads as the car reacting rather than an image
 * being replaced.
 */
export function Mascot({ mood, size, animate = false }: { mood: Mood; size: number; animate?: boolean }) {
  const reduced = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) return;
    pop.setValue(0.94);
    const run = Animated.spring(pop, { toValue: 1, damping: 9, stiffness: 180, mass: 1, useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [mood, reduced, pop]);

  const loop = animate && !reduced;
  const drawn = loop ? size * LOOP_SCALE : size;
  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessible
      accessibilityRole="image"
    >
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Image
          key={loop ? "loop" : "still"}
          source={loop ? (isDesignV2() ? LOOP_V2 : LOOP)[mood] : STILL[mood]}
          style={{ width: drawn, height: drawn }}
        />
      </Animated.View>
    </View>
  );
}
