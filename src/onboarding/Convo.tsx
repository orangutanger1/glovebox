import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { tokens } from "../design/tokens";
import { useReduceMotion } from "../design/useReduceMotion";
import { isDesignV2 } from "../design/theme";
import { v2 } from "../design/type";
import { Mascot } from "../mascot/Mascot";
import { Icon } from "../redesign/icons";
import { t } from "../i18n";
import { convoLine } from "./convoLine";
import type { OnboardingRoute } from "./routes";

const EASE = Easing.bezier(...tokens.motion.easeOut);

/**
 * The pinned top of an arm-A onboarding screen: Bevel's round white back
 * button, and on the quiz a thin progress line in place of the lamps. The line
 * starts where the previous question left it and fills one step on arrival,
 * so moving forward is felt; it is the only progress the flow shows, and only
 * on the six questions (see `OnboardingScreen` on why the story gets none).
 */
export function ConvoHeader({
  onBack,
  progress,
  legend,
  trailing,
}: {
  onBack?: () => void;
  progress: { step: number; total: number } | null;
  legend?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <View
      style={{
        ...tokens.layout.column,
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.space.md,
        paddingHorizontal: tokens.space.lg,
        paddingTop: tokens.space.sm,
        paddingBottom: tokens.space.sm,
        minHeight: 56,
      }}
    >
      {onBack ? <RoundBack onPress={onBack} /> : <View style={{ width: 40 }} />}
      <View style={{ flex: 1, justifyContent: "center" }}>
        {legend ?? (progress ? <ProgressLine step={progress.step} total={progress.total} /> : null)}
      </View>
      {trailing ? <View>{trailing}</View> : <View style={{ width: 40 }} />}
    </View>
  );
}

export function RoundBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("redesign.back")}
    >
      {({ pressed }) => (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? tokens.color.surfaceHi : tokens.color.surface,
            ...tokens.shadow.ambient,
          }}
        >
          <Icon name="back" size={20} color={tokens.color.text} />
        </View>
      )}
    </Pressable>
  );
}

function ProgressLine({ step, total }: { step: number; total: number }) {
  const reduced = useReduceMotion();
  const fill = useRef(new Animated.Value((reduced ? step : step - 1) / total)).current;
  useEffect(() => {
    const run = Animated.timing(fill, {
      toValue: step / total,
      duration: 420,
      delay: 120,
      easing: EASE,
      useNativeDriver: false,
    });
    run.start();
    return () => run.stop();
  }, [fill, step, total]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
      accessibilityLabel={t("onboardingC.question", { step, total })}
      style={{ height: 6, borderRadius: 3, backgroundColor: tokens.color.sunken, overflow: "hidden" }}
    >
      <Animated.View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: tokens.color.accent,
          width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}

/**
 * The car and its line. The car loops in its mood; the bubble arrives a beat
 * after the screen does, as a reply would, and is announced to VoiceOver as
 * what it is — a line of text, not an image.
 */
export function ConvoStage({ route, say, size = 96 }: { route: OnboardingRoute; say?: string | null; size?: number }) {
  const line = useMemo(() => convoLine(route), [route]);
  const text = say === undefined ? line.say : say;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
      <Mascot mood={line.mood} size={size} animate />
      {text ? <Bubble text={text} /> : null}
    </View>
  );
}

export function Bubble({ text, tail = "left" }: { text: string; tail?: "left" | "bottom" }) {
  const reduced = useReduceMotion();
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(enter, { toValue: 1, duration: 260, delay: 180, easing: EASE, useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [enter, reduced]);

  return (
    <Animated.View
      style={{
        flexShrink: 1,
        opacity: enter,
        transform: [
          { translateX: tail === "left" ? enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) : 0 },
          { translateY: tail === "bottom" ? enter.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) : 0 },
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: tokens.color.surface,
          borderRadius: 20,
          borderCurve: "continuous",
          paddingHorizontal: tokens.space.md,
          paddingVertical: 12,
          ...tokens.shadow.ambient,
        }}
      >
        {/* A v2 sets the car's line in the display face. v2 is never on
            during onboarding (a pinned check build only), so the funnel is
            untouched. */}
        <Text
          style={{ ...tokens.text.body, fontWeight: "500", ...(isDesignV2() ? v2.bubble() : {}), color: tokens.color.text }}
        >
          {text}
        </Text>
      </View>
      {/* The tail: a small square turned 45°, tucked under the bubble's edge. */}
      <View
        style={
          tail === "left"
            ? { position: "absolute", left: -5, top: "50%", marginTop: -6, width: 12, height: 12 }
            : { position: "absolute", bottom: -5, alignSelf: "center", width: 12, height: 12 }
        }
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: tokens.color.surface,
            transform: [{ rotate: "45deg" }],
          }}
        />
      </View>
    </Animated.View>
  );
}
