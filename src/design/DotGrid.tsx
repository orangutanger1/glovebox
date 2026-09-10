import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/**
 * A count, drawn as the things being counted.
 *
 * The comparison screens used to draw "3 of 12" as a bar filled a quarter of
 * the way. A bar is the right shape for a magnitude nobody can count — money,
 * distance, time — and the wrong one for twelve services, because a quarter of
 * a bar has to be converted back into "three" by the reader before it means
 * anything, and the number was printed beside it anyway. Twelve dots with
 * three of them lit is the same fact with no conversion in it: the eye counts
 * three, and it counts the nine that are dark at the same time, which is the
 * half of the claim a bar cannot show at all.
 *
 * Lit dots are studs seated in the faceplate. Unlit ones are the empty sockets
 * they sit in — the same recessed hole the answer cards use, so a missing
 * service reads as a fitting that has not been filled rather than as a dot
 * someone forgot to colour in.
 */
export function DotGrid({
  total,
  filled,
  tone = "green",
  columns = 4,
  size = 14,
  delay = 0,
}: {
  total: number;
  /** How many of them are lit, counted from the first. */
  filled: number;
  /** `green` confirms, `red` warns, `metal` states. The same three meanings
   *  they carry everywhere else in the app. */
  tone?: "green" | "red" | "metal";
  columns?: number;
  size?: number;
  /** Milliseconds before this grid starts seating its studs. Two grids being
   *  compared are read left then right, so the right one waits. */
  delay?: number;
}) {
  const dots = Array.from({ length: Math.max(0, total) }, (_, i) => i);

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: tokens.space.xs + 2,
        width: columns * (size + tokens.space.xs + 2),
      }}
    >
      {dots.map((i) => (
        <Dot
          key={i}
          lit={i < filled}
          tone={tone}
          size={size}
          // 40ms apart. Fast enough that twelve of them are seated inside half
          // a second, slow enough that the eye is walked along the count
          // instead of shown a block of colour arriving.
          delay={delay + i * 40}
        />
      ))}
    </View>
  );
}

const FILL = {
  green: tokens.color.green,
  red: tokens.color.red,
  metal: tokens.color.metalHi,
} as const;

const GLOW = {
  green: tokens.color.greenGlow,
  red: tokens.color.redGlow,
  metal: tokens.color.hairline,
} as const;

/** Long enough to be a part being seated rather than a pixel changing colour,
 *  short enough that a grid of twelve is finished before the eye has left it. */
const SEAT_MS = 190;

function Dot({
  lit,
  tone,
  size,
  delay,
}: {
  lit: boolean;
  tone: "green" | "red" | "metal";
  size: number;
  delay: number;
}) {
  const seat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!lit) return;
    const run = Animated.timing(seat, {
      toValue: 1,
      duration: SEAT_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [seat, lit, delay]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        // The empty ring, always drawn. An unfilled one is the point of the
        // picture.
        backgroundColor: tokens.color.sunken,
        borderWidth: 1,
        borderColor: tokens.color.hairline,
      }}
    >
      {lit ? (
        <Animated.View
          style={{
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            backgroundColor: FILL[tone],
            borderWidth: 1,
            borderColor: GLOW[tone],
            opacity: seat,
            // From 0.6, never from nothing: a stud that scales out of an empty
            // hole is a graphic being drawn, not a part being fitted.
            transform: [
              { scale: seat.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          }}
        />
      ) : null}
    </View>
  );
}
