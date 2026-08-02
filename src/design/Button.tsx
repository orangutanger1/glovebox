import { Pressable, Text } from "react-native";
import { tokens } from "./tokens";

const BG = {
  primary: tokens.color.accent,
  secondary: tokens.color.surfaceAlt,
  danger: tokens.color.due,
};

// Bone fill needs dark text. Getting this wrong ships an unreadable primary button.
const FG = {
  primary: tokens.color.onAccent,
  secondary: tokens.color.text,
  danger: tokens.color.text,
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
        opacity: disabled ? 0.4 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        borderRadius: tokens.radius.md,
        paddingVertical: 16,
        alignItems: "center",
      })}
    >
      <Text style={{ ...tokens.text.body, fontWeight: "600", color: FG[variant] }}>
        {label}
      </Text>
    </Pressable>
  );
}
