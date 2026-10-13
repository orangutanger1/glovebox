import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View, useWindowDimensions } from "react-native";
import { isRedesign } from "../design/theme";
import { tokens } from "../design/tokens";

/** The native splash, exactly as app.json draws it: the gauge, 160pt wide, on
 *  this colour. The curtain's first frame has to be the same picture or the
 *  hand-off reads as a flash. */
const SPLASH_ICON = require("../../assets/splash-icon.png");
const SPLASH_BG = "#0F1113";
const ICON = 160;

/** The iris, and the point in it where the page underneath is far enough in
 *  that the welcome intro can start moving: the two overlap rather than queue,
 *  so the launch reads as one move instead of two. */
const IRIS_MS = 560;
const HANDOFF_AT = 0.6;

type Phase = "pending" | "playing" | "done";
let phase: Phase = "pending";
let waiting: (() => void)[] = [];

function reveal() {
  if (phase === "done") return;
  phase = "done";
  const run = waiting;
  waiting = [];
  run.forEach((cb) => cb());
}

/**
 * Calls `cb` once the launch curtain has let go of the page, at once if it
 * already has or never will. Returns a cancel. Capped, so a curtain that never
 * reports (a test, a remount at the wrong moment) cannot hold the first screen.
 */
export function whenRevealed(cb: () => void, capMs = 1400): () => void {
  if (phase === "done") {
    cb();
    return () => {};
  }
  let fired = false;
  const once = () => {
    if (fired) return;
    fired = true;
    clearTimeout(timer);
    cb();
  };
  waiting.push(once);
  const timer = setTimeout(once, capMs);
  return () => {
    fired = true;
    clearTimeout(timer);
    waiting = waiting.filter((w) => w !== once);
  };
}

/** Test seam. */
export function resetLaunchCurtain(): void {
  phase = "pending";
  waiting = [];
}

/**
 * Arm A of `app_design`: the turn of the key between the native splash and the
 * light page.
 *
 * The splash is native and shared by both arms, so it stays the classic gauge
 * on near-black; arm B must launch exactly as it always has. Arm A's page is
 * light, and a dark splash cutting straight to it is a white flash. Instead the
 * curtain takes over the splash's exact picture and opens it: the gauge dips
 * and fades while a disc of the page colour grows from its centre until it
 * covers the screen, then the curtain lets go over a page of the same colour.
 *
 * Once per process: a language change remounts the stack, not this. Under
 * Reduce Motion the curtain cross-fades instead of opening.
 *
 * Decided a tick after mount, not at render: on a fresh install the arm is
 * written by the root layout's boot effect, which runs after this one.
 */
export function LaunchCurtain() {
  const [show, setShow] = useState(phase === "pending" && isRedesign());
  const { width, height } = useWindowDimensions();
  const disc = useRef(new Animated.Value(0)).current;
  const icon = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "pending") return;
    const t = setTimeout(() => {
      if (phase !== "pending") return;
      if (!isRedesign()) {
        reveal();
        return;
      }
      phase = "playing";
      setShow(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show) return;
    let alive = true;
    let handoff: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (!alive) return;
      reveal();
      setShow(false);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (!alive) return;
        if (reduced) {
          Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }).start(finish);
          return;
        }
        handoff = setTimeout(reveal, IRIS_MS * HANDOFF_AT);
        Animated.parallel([
          Animated.timing(icon, {
            toValue: 0,
            duration: 220,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
            useNativeDriver: true,
          }),
          Animated.timing(disc, {
            toValue: 1,
            duration: IRIS_MS,
            delay: 60,
            easing: Easing.bezier(0.65, 0, 0.35, 1),
            useNativeDriver: true,
          }),
        ]).start(finish);
      });
    return () => {
      alive = false;
      if (handoff) clearTimeout(handoff);
    };
  }, [show, disc, icon, fade]);

  if (!show) return null;
  // Big enough that its edge clears the screen's corners from the centre.
  const d = Math.ceil(2 * Math.hypot(width / 2, height / 2)) + 4;
  return (
    <Animated.View
      testID="launch-curtain"
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: SPLASH_BG,
        alignItems: "center",
        justifyContent: "center",
        opacity: fade,
      }}
    >
      <Animated.Image
        source={SPLASH_ICON}
        style={{
          width: ICON,
          height: ICON,
          opacity: icon,
          transform: [{ scale: icon.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
        }}
      />
      <View
        style={{ position: "absolute", width: d, height: d, alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View
          style={{
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: tokens.color.housing,
            transform: [{ scale: disc.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) }],
          }}
        />
      </View>
    </Animated.View>
  );
}
