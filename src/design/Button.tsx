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
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  function handlePress() {
    // Fire and forget: a failed haptic must never block the action.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
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
