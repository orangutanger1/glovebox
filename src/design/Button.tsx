import { Animated, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "./tokens";
import { usePressScale } from "./press";

/**
 * The primary control.
 *
 * It used to be a machined faceplate: a gradient face over a hard opaque band,
 * travelling 2px down into its housing on press. The travel was the right
 * instinct — opacity-only feedback is the most template-looking thing a button
 * can do — and the wrong material. What survives is the instinct: the button
 * answers a press by scaling to 0.97 over 120ms, which is felt rather than
 * watched, and is the same language every pressable surface in the app now
 * speaks.
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
  primary: tokens.color.white,
  secondary: tokens.color.surfaceHi,
  danger: tokens.color.red,
};

const FG = {
  primary: tokens.color.housing,
  secondary: tokens.color.text,
  danger: tokens.color.white,
};

const BORDER = {
  primary: "transparent",
  secondary: tokens.color.hairline,
  danger: "transparent",
};

/**
 * The unavailable face. A control that is not live yet is not a white button
 * turned down — dimming the lit face keeps the shape of something switched on
 * and reads as a rendering bug against a near-black background. It is a
 * surface with nothing on it, one step below the enabled secondary, so coming
 * alive is a real change of material rather than a change of opacity.
 */
const FACE_OFF = tokens.color.surface;
const FG_OFF = tokens.color.textFaint;

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
  // A blocked button still answers the press: the scale is the only thing
  // telling a user whose tap was swallowed that the tap was registered at all.
  const press = usePressScale();

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
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled && !reportsBlocked}
      // The button is still disabled as far as assistive technology is
      // concerned. Keeping it pressable is an instrumentation detail and must
      // not tell VoiceOver that the action is available.
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={{
          transform: [{ scale: press.scale }],
          borderRadius: tokens.radius.md,
          backgroundColor: disabled ? FACE_OFF : FACE[variant],
          borderWidth: 1,
          borderColor: disabled ? tokens.color.hairline : BORDER[variant],
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            ...tokens.text.body,
            fontWeight: "600",
            color: disabled ? FG_OFF : FG[variant],
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
