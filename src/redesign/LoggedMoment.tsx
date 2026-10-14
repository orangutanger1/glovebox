import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, Text, View, findNodeHandle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokens } from "../design/tokens";
import { v2 } from "../design/type";
import { useReduceMotion } from "../design/useReduceMotion";
import { t, formatNumber, formatShortDate, getLanguage } from "../i18n";
import { distanceUnitLabel } from "../units/format";
import { serviceName } from "../schedule/names";
import { Mascot } from "../mascot/Mascot";

/** The accent darkened so white text on it reaches ~5:1 (#4C7DFF is 3.6:1). */
const MOMENT_BLUE = "#3A64E0";
const EASE = Easing.bezier(...tokens.motion.easeOut);

/**
 * A v2's "logged" moment, in place of arm A's toast: a full-colour screen with
 * the celebrating car, "Oil Change logged." and when it is next due. It stays
 * until Done; logging is the one thing the app exists for, and it earns a
 * screen of its own.
 *
 * The car is the still (the loops have the page colour baked in) and pops in
 * through `Mascot`'s own mood pop; it never hops. No haptic: the log form
 * already fires the success one on save.
 */
export function LoggedMoment({
  service,
  next,
  visible,
  onDone,
}: {
  /** The service type as logged (not its display name). */
  service: string;
  next: { dueOdometer?: number; dueAt?: string } | null;
  visible: boolean;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReduceMotion();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(reduced ? 0 : 12)).current;
  const title = useRef<Text>(null);

  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    rise.setValue(reduced ? 0 : 12);
    const run = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: tokens.motion.base, easing: EASE, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: tokens.motion.base, easing: EASE, useNativeDriver: true }),
    ]);
    run.start();
    const node = title.current ? findNodeHandle(title.current) : null;
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
    return () => run.stop();
  }, [visible, reduced, fade, rise]);

  if (!visible) return null;

  const line = next
    ? next.dueOdometer !== undefined
      ? t("redesign.logged.nextAt", { reading: `${formatNumber(next.dueOdometer)} ${distanceUnitLabel()}` })
      : next.dueAt
        ? t("redesign.logged.nextBy", { date: formatShortDate(next.dueAt) })
        : null
    : null;
  // Uppercase only where v2's labels are (not in Japanese or Korean).
  const upper = v2.label().textTransform === "uppercase" && !["ja", "ko"].includes(getLanguage());

  return (
    <Modal transparent animationType="none" statusBarTranslucent visible onRequestClose={onDone}>
      <Animated.View style={{ flex: 1, backgroundColor: MOMENT_BLUE, opacity: fade }}>
        <Animated.View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: tokens.space.lg,
            gap: tokens.space.md,
            transform: [{ translateY: rise }],
          }}
        >
          <Mascot mood="celebrating" size={200} />
          <Text
            ref={title}
            accessibilityRole="header"
            style={{ ...v2.greeting(), color: tokens.color.onAccent, textAlign: "center" }}
          >
            {t("redesign.logged.title", { service: serviceName(service) })}
          </Text>
          {line ? (
            <Text
              style={{
                ...v2.value(),
                fontSize: 15,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                ...(upper ? { textTransform: "uppercase" as const, letterSpacing: 1.2 } : {}),
              }}
            >
              {line}
            </Text>
          ) : null}
        </Animated.View>
        <View style={{ paddingHorizontal: tokens.space.lg, paddingBottom: insets.bottom + tokens.space.lg }}>
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 26,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...tokens.text.body, fontWeight: "600", color: "#16161A" }}>{t("redesign.logged.done")}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
