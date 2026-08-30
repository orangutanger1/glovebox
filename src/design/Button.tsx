import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { tokens } from "./tokens";

/**
 * A machined control. The press must MOVE it — the face travels 2px down and
 * the hard edge under it shrinks 3px to 1px, so the button visibly seats into
 * its housing. Opacity-only feedback is the single most template-looking thing
 * a button can do and is deliberately not an option here.
 *
 * Primary is white, not red. Red is reserved for overdue and destructive.
 *
 * `disabled` deserves its own paragraph, because the plain version of it cost
 * this app a funnel. React Native's `Pressable` with `disabled` does not fire
 * `onPress` at all, so a user who taps a greyed-out Continue and then closes
 * the app produces no event of any kind: the drop-off is recorded as "viewed
 * the screen and left", which is indistinguishable from someone who read the
 * question and lost interest. The vehicle screen's validation loop was only
 * ever found because it happened to emit `year:invalid` on every refused tap —
 * one device left forty of them behind in 112 seconds. The gates on the other
 * quiz screens are silent by construction and would leave nothing at all.
 *
 * So a blocked press is still a press. `onBlockedPress` keeps the control
 * live, swallows the real action, and hands the screen back the fact that
 * someone tried. It also gives the user the feedback the greyed button was
 * withholding: a warning haptic, which is the difference between a control
 * that refused and a phone that did not register the tap.
 */

const FACE = {
  primary: ["#FFFFFF", "#D8DADE"] as const,
  secondary: tokens.material.metalFace,
  danger: ["#D4202C", "#A50E19"] as const,
};

const FG = {
  primary: tokens.color.housing,
  secondary: tokens.color.text,
  danger: tokens.color.white,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  onBlockedPress,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  /**
   * Called instead of `onPress` when the button is disabled and tapped. Supply
   * it and the control stays live so the tap can be counted; omit it and
   * `disabled` behaves exactly as it always did.
   */
  onBlockedPress?: () => void;
}) {
  const reportsBlocked = disabled && onBlockedPress !== undefined;

  function handlePress() {
    if (disabled) {
      // A refusal, told as one. Fire and forget, like the impact below: a
      // failed haptic must never block the report.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      onBlockedPress?.();
      return;
    }
    // Fire and forget: a failed haptic must never block the action.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled && !reportsBlocked}
      // The button is still disabled as far as assistive technology is
      // concerned. Keeping it pressable is an instrumentation detail and must
      // not tell VoiceOver that the action is available.
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {({ pressed }) => {
        const edge = pressed ? tokens.material.edgePressed : tokens.material.edgeHeight;
        return (
          <View
            style={{
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.color.edgeSolid,
              paddingBottom: disabled ? 0 : edge,
              marginTop: pressed ? tokens.material.pressTravel : 0,
              marginBottom: pressed ? tokens.material.pressTravel : 0,
              opacity: disabled ? 0.4 : 1,
              ...tokens.shadow.ambient,
              shadowOpacity: pressed || disabled ? 0.15 : tokens.shadow.ambient.shadowOpacity,
            }}
          >
            <LinearGradient
              colors={[...FACE[variant]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderTopColor:
                  variant === "primary" ? "rgba(255,255,255,0.9)" : tokens.color.hairline,
                borderLeftColor: tokens.color.hairline,
                borderRightColor: tokens.color.hairline,
                borderBottomColor: tokens.color.edge,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...tokens.text.legend,
                  fontSize: 14,
                  color: FG[variant],
                }}
              >
                {label}
              </Text>
            </LinearGradient>
          </View>
        );
      }}
    </Pressable>
  );
}
