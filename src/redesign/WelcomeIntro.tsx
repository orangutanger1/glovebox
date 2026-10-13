import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";
import { Mascot } from "../mascot/Mascot";
import { useReduceMotion } from "../design/useReduceMotion";
import { whenRevealed } from "./LaunchCurtain";

const WORDMARK = require("../../assets/intro/wordmark.png");
const WORDMARK_RATIO = 600 / 149;

/**
 * The car-care stickers that burst out from behind the car. Positions are
 * fractions of the stage, sizes in points, rotations in degrees; laid out as a
 * loose ring that leaves the car and the wordmark under it clear.
 */
const STICKERS = [
  { src: require("../../assets/intro/calendar.png"), x: 0.5, y: 0.05, size: 46, rot: -6 },
  { src: require("../../assets/intro/wrench.png"), x: 0.15, y: 0.13, size: 56, rot: -16 },
  { src: require("../../assets/intro/oil.png"), x: 0.85, y: 0.14, size: 54, rot: 10 },
  { src: require("../../assets/intro/tyre.png"), x: 0.09, y: 0.43, size: 50, rot: 0 },
  { src: require("../../assets/intro/plug.png"), x: 0.91, y: 0.42, size: 48, rot: 18 },
  { src: require("../../assets/intro/battery.png"), x: 0.15, y: 0.73, size: 50, rot: -8 },
  { src: require("../../assets/intro/fuel.png"), x: 0.86, y: 0.72, size: 50, rot: 9 },
  { src: require("../../assets/intro/cone.png"), x: 0.3, y: 0.87, size: 38, rot: -10 },
  { src: require("../../assets/intro/bell.png"), x: 0.7, y: 0.87, size: 38, rot: 12 },
] as const;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** When each beat of the intro starts, after the launch curtain hands over. */
export const INTRO = {
  car: 0,
  stickers: 140,
  stagger: 45,
  wordmark: 480,
  /** When the welcome copy and button under the stage may come in. */
  content: 680,
} as const;

/**
 * Arm A of `app_design`: the welcome stage — the app saying hello before it
 * asks anything.
 *
 * Built on the opening the reference apps share (egglu, Eden, karen): one
 * character on a plain page, its world popping in around it, the name landing
 * under it, and only then the line and the button. Here the car arrives first,
 * the things it looks after burst out from behind it into a ring, and the
 * wordmark settles beneath. Then the stickers drift, each on its own slow
 * cycle, so the page stays alive while the user reads without anything
 * bouncing for attention.
 *
 * Starts when the launch curtain lets go (at once when there was none).
 * Reduce Motion: everything fades in together and nothing drifts.
 */
export function WelcomeIntro({ width, height }: { width: number; height: number }) {
  const reduced = useReduceMotion();
  const car = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const burst = useRef(STICKERS.map(() => new Animated.Value(0))).current;
  const drift = useRef(STICKERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    let intro: Animated.CompositeAnimation | undefined;
    const cancel = whenRevealed(() => {
      if (reduced) {
        intro = Animated.parallel(
          [car, mark, ...burst].map((v) =>
            Animated.timing(v, { toValue: 1, duration: 280, useNativeDriver: true })
          )
        );
        intro.start();
        return;
      }
      intro = Animated.parallel([
        Animated.spring(car, {
          toValue: 1,
          delay: INTRO.car,
          damping: 14,
          stiffness: 170,
          mass: 1,
          useNativeDriver: true,
        }),
        ...burst.map((v, i) =>
          Animated.spring(v, {
            toValue: 1,
            delay: INTRO.stickers + i * INTRO.stagger,
            damping: 13,
            stiffness: 150,
            mass: 0.9,
            useNativeDriver: true,
          })
        ),
        Animated.timing(mark, {
          toValue: 1,
          delay: INTRO.wordmark,
          duration: 420,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]);
      intro.start();
      // A slow sine per sticker, out of step with its neighbours: 2.6–4.2 s a
      // cycle, a few points of travel. Started with the burst; it is too small
      // to read until the burst has settled.
      loops = drift.map((v, i) => {
        const half = 1300 + ((i * 370) % 800);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        v.setValue(i % 2 ? 1 : 0);
        loop.start();
        return loop;
      });
    });
    return () => {
      cancel();
      intro?.stop();
      loops.forEach((l) => l.stop());
    };
  }, [reduced, car, mark, burst, drift]);

  // Laid out for a stage about 470pt tall (a 6.1" phone); a shorter one
  // shrinks the ring and the car with it rather than crowding them.
  const k = Math.max(0.7, Math.min(1.1, height / 470));
  const carSize = Math.min(208, width * 0.52, height * 0.44);
  const cx = width / 2;
  const cy = height * 0.42;
  const markW = Math.min(176, width * 0.44, carSize * 0.86);

  return (
    <View pointerEvents="none" style={{ width, height }}>
      {STICKERS.map((s, i) => {
        const x = s.x * width;
        const y = s.y * height;
        const size = Math.round(s.size * k);
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              opacity: burst[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
              transform: [
                // From behind the car out to its place in the ring.
                { translateX: burst[i].interpolate({ inputRange: [0, 1], outputRange: [cx - x, 0] }) },
                { translateY: burst[i].interpolate({ inputRange: [0, 1], outputRange: [cy - y, 0] }) },
                { scale: burst[i].interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
                { rotate: burst[i].interpolate({ inputRange: [0, 1], outputRange: [`${s.rot - 40}deg`, `${s.rot}deg`] }) },
              ],
            }}
          >
            <Animated.View
              style={{
                transform: reduced
                  ? []
                  : [
                      { translateY: drift[i].interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) },
                      { rotate: drift[i].interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] }) },
                    ],
              }}
            >
              <Image source={s.src} style={{ width: size, height: size }} />
            </Animated.View>
          </Animated.View>
        );
      })}

      <Animated.View
        style={{
          position: "absolute",
          left: cx - carSize / 2,
          top: cy - carSize / 2,
          opacity: car.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: car.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        }}
      >
        <Mascot mood="happy" size={carSize} animate />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          left: cx - markW / 2,
          top: cy + carSize / 2 + 6,
          opacity: mark,
          transform: [{ translateY: mark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <Image
          source={WORDMARK}
          style={{ width: markW, height: markW / WORDMARK_RATIO }}
          accessibilityRole="header"
          accessibilityLabel="Wrenchy"
        />
      </Animated.View>
    </View>
  );
}
