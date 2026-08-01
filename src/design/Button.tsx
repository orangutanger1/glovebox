import { Pressable, Text } from "react-native";
import { tokens } from "./tokens";

const BG = {
  primary: tokens.color.accent,
  secondary: tokens.color.surfaceAlt,
  danger: tokens.color.due,
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: BG[variant],
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        borderRadius: tokens.radius.md,
        paddingVertical: 14,
        alignItems: "center",
      })}
    >
      <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
