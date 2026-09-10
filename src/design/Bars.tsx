import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/**
 * One row of a comparison.
 *
 * `fraction` is the row's share of the longest bar in the group, computed by
 * the caller, because only the caller knows whether two rows are on the same
 * scale. `value` is the figure printed at the end of the bar, already
 * formatted — a chart that formats its own numbers is a chart that formats
 * money without knowing the currency.
 */
export type Bar = {
  key: string;
  label: string;
  value: string;
  /** 0 to 1. Clamped, because a caller dividing by zero should get an empty
   *  track rather than a bar running off the panel. */
  fraction: number;
  /** `metal` is the neutral reading. `red` is the state the app warns about
   *  and `green` the one it confirms — the same two meanings they carry
   *  everywhere else, spent here on a comparison the user is meant to read as
   *  worse and better. */
  tone?: "metal" | "red" | "green";
};

const FILL = {
  metal: tokens.color.metalHi,
  red: tokens.color.red,
  green: tokens.color.green,
} as const;

/** How long a bar takes to reach its length, and how far apart the rows start.
 *  Slow enough to be a movement rather than a repaint, staggered so the eye
 *  reads the rows in order instead of watching one block resize. */
const GROW_MS = 620;
const STAGGER_MS = 140;

/**
 * A horizontal bar chart, drawn in the panel's own materials.
 *
 * There is no chart library in this app and this is the reason there does not
 * need to be one: every comparison the flow makes is two or four rows on one
 * scale, and that is a track, a fill and a number. A library would arrive with
 * its own type ramp, its own greys and its own idea of what a gridline is, and
 * the first thing it would do is break the one visual rule the app has.
 *
 * The bars grow on mount, once. This is the only animation in the flow that is
 * not describing a wait: it is describing a difference, and a difference that
 * arrives already drawn is a picture, while one that grows in front of you is
 * a measurement being taken.
 */
export function Bars({ bars, height = 10 }: { bars: Bar[]; height?: number }) {
  return (
    <View style={{ gap: tokens.space.md }}>
      {bars.map((bar, i) => (
        <Row key={bar.key} bar={bar} height={height} delay={i * STAGGER_MS} />
      ))}
    </View>
  );
}

function Row({ bar, height, delay }: { bar: Bar; height: number; delay: number }) {
  const grow = useRef(new Animated.Value(0)).current;
  const fraction = Math.max(0, Math.min(1, bar.fraction));

  useEffect(() => {
    const run = Animated.timing(grow, {
      toValue: 1,
      duration: GROW_MS,
      delay,
      // Decelerating, unlike the loader's linear fill. That bar is a clock and
      // must not imply the wait is speeding up; this one is a value settling
      // on its length.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    run.start();
    return () => run.stop();
  }, [grow, delay]);

  return (
    <View style={{ gap: tokens.space.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted, flexShrink: 1 }}>
          {bar.label}
        </Text>
        <Text
          style={{
            ...tokens.text.legend,
            ...tokens.text.numeric,
            color: tokens.color.text,
          }}
        >
          {bar.value}
        </Text>
      </View>
      {/* The same inset well the loader's track is drawn in: shadowed on the
          top edge, so the fill reads as sitting in the panel rather than on
          it. */}
      <View
        style={{
          height,
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.edgeSolid,
          borderTopWidth: 1,
          borderTopColor: tokens.color.edge,
          borderBottomWidth: 1,
          borderBottomColor: tokens.color.hairline,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: tokens.radius.pill,
            backgroundColor: FILL[bar.tone ?? "metal"],
            width: grow.interpolate({
              inputRange: [0, 1],
              // A row worth printing is worth seeing: a zero stays visibly zero,
              // but anything above it keeps a sliver so a small number is a
              // short bar rather than an empty track.
              outputRange: ["0%", `${fraction === 0 ? 0 : Math.max(3, fraction * 100)}%`],
            }),
          }}
        />
      </View>
    </View>
  );
}
