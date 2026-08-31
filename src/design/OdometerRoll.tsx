import { useEffect, useMemo, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { tokens } from "./tokens";

/**
 * A mechanical odometer that actually rolls.
 *
 * This replaces a photograph of drums. The photo had to be dimmed to 50% so it
 * would stop out-shouting the input under it, at which point it was a grey
 * smear that still cost 60KB and still popped in a frame late. Drawn in code it
 * is sharp at any density, costs nothing to decode, and — the point — it moves:
 * the screen demonstrates the number it is asking the user to go and read.
 *
 * Each wheel is a strip of digits translated upward. A wheel that must land on
 * `d` renders `spins` full 0-9 passes and then 0..d, so the travel is always
 * downward-reading (digits increase as the strip rises) like a real drum. The
 * wheels are staggered right-to-left with an ease-out, so the last digit is
 * still settling after the leading digits have stopped — which is what makes it
 * read as one linked mechanism instead of six independent counters.
 */

const DIGIT_HEIGHT = 40;
const DIGIT_WIDTH = 26;

/** Digits, most significant first, with no leading zero suppression — a drum
 *  odometer shows its leading zeros and that is half of what makes it one. */
function digitsOf(value: number, places: number): number[] {
  return String(Math.floor(value))
    .padStart(places, "0")
    .slice(-places)
    .split("")
    .map(Number);
}

function Wheel({
  digit,
  delay,
  duration,
  spins,
}: {
  digit: number;
  delay: number;
  duration: number;
  /** Full 0-9 passes before the landing digit. Zero while the user is typing:
   *  a drum that spun three times per keystroke is a slot machine. */
  spins: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  // `spins` full passes before the landing digit. Three reads as a drum being
  // spun; fewer looks like a counter ticking up, more makes the user wait. Zero
  // is the typed case, where the wheel is a display and must simply arrive.
  const strip = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < spins; i++) for (let d = 0; d <= 9; d++) out.push(d);
    for (let d = 0; d <= digit; d++) out.push(d);
    return out;
  }, [digit, spins]);

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      // Out-quint, not out-cubic: the wheel should arrive fast and creep the
      // last few degrees, the way a drum does against its detent.
      easing: Easing.out(Easing.poly(5)),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, strip.length, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(strip.length - 1) * DIGIT_HEIGHT],
  });

  return (
    <View style={{ width: DIGIT_WIDTH, height: DIGIT_HEIGHT, overflow: "hidden" }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {strip.map((d, i) => (
          <Text
            key={i}
            style={{
              height: DIGIT_HEIGHT,
              lineHeight: DIGIT_HEIGHT,
              textAlign: "center",
              fontSize: 30,
              fontWeight: "600",
              fontVariant: ["tabular-nums"],
              color: tokens.color.text,
            }}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function OdometerRoll({
  value,
  places = 6,
  live = false,
}: {
  /** The reading the drums settle on. */
  value: number;
  places?: number;
  /**
   * The drums are showing a number the user is typing, not a demonstration.
   *
   * The screen used to roll a random six-figure reading above a field holding
   * the user's own — two different numbers, one above the other, on a screen
   * whose only job is a single reading. Driven from the field, the drums have
   * to move like a display and not like an intro: no full passes, no stagger,
   * and short enough that the next keystroke is not queued behind it.
   */
  live?: boolean;
}) {
  const digits = digitsOf(value, places);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 20 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#08090B",
          borderRadius: tokens.radius.sm,
          borderWidth: 1,
          // An inset well: shadowed on its top edge, lit on its bottom. The
          // raised controls in this app are the exact inverse.
          borderTopColor: tokens.color.edge,
          borderLeftColor: tokens.color.edge,
          borderRightColor: tokens.color.edge,
          borderBottomColor: tokens.color.hairline,
          paddingHorizontal: 6,
          paddingVertical: 4,
          gap: 2,
          overflow: "hidden",
        }}
      >
        {digits.map((d, i) => (
          <View
            key={i}
            style={{
              backgroundColor: i === places - 1 ? "#2A1215" : "#1A1D20",
              borderRadius: 3,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Wheel
              digit={d}
              spins={live ? 0 : 3}
              // Right-to-left stagger: the tenths wheel is the last to settle.
              delay={live ? 0 : 120 + (places - 1 - i) * 90}
              duration={live ? 220 : 1100 + (places - 1 - i) * 260}
            />
            {/* Curvature. A flat digit on a flat rectangle is a number in a
                box; shaded top and bottom, it is a cylinder seen edge-on. */}
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0.75)", "transparent", "rgba(0,0,0,0.75)"]}
              locations={[0, 0.5, 1]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/** A plausible reading for the drums to land on, so the demo is not the same
 *  number every launch. Six figures, never a suspiciously round one. */
export function randomOdometerReading(): number {
  return 20000 + Math.floor(Math.random() * 160000);
}
