import { View, Text, TextInput } from "react-native";
import { tokens } from "./tokens";

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        autoFocus={autoFocus}
        placeholderTextColor={tokens.color.textMuted}
        style={{
          ...tokens.text.body,
          color: tokens.color.text,
          backgroundColor: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.sm,
          padding: tokens.space.sm,
        }}
      />
    </View>
  );
}
