import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * Primary is the accent, not white, and never red — red is reserved for
 * overdue and destructive.
 *
 * The previous version travelled 2px on press against a shrinking hard edge,
 * on the argument that opacity-only feedback is the most template-looking
 * thing a button can do. That argument was right about opacity alone and wrong
 * about the fix: scale plus opacity plus a haptic is the native-feeling
 * version, and it does not require a machined edge under every control.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const c = useTheme();

  const fill = { primary: c.accent, secondary: c.card, danger: c.overdue };
  const fg = { primary: c.onAccent, secondary: c.ink, danger: "#FFFFFF" };

  function handlePress() {
    // Fire and forget: a failed haptic must never block the action.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: tokens.radius.md,
            backgroundColor: fill[variant],
            borderWidth: 1,
            borderColor: variant === "secondary" ? c.hairline : "transparent",
            paddingVertical: 17,
            alignItems: "center",
            opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
            shadowColor: "#000",
            shadowOpacity: disabled ? 0 : c.shadowOpacity,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ ...tokens.text.body, fontWeight: "600", color: fg[variant] }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
