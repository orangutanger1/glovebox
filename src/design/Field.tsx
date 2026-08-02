import { useId } from "react";
import {
  View,
  Text,
  TextInput,
  InputAccessoryView,
  Keyboard,
  Pressable,
  Platform,
} from "react-native";
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
  // The iOS number pad has no return key, so a numeric field with no accessory
  // bar is a keyboard the user cannot put away.
  const accessoryId = useId().replace(/:/g, "");
  const needsAccessory = Platform.OS === "ios" && keyboardType === "numeric";

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
        inputAccessoryViewID={needsAccessory ? accessoryId : undefined}
        style={{
          ...tokens.text.body,
          color: tokens.color.text,
          backgroundColor: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.sm,
          padding: tokens.space.sm,
        }}
      />
      {needsAccessory ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              backgroundColor: tokens.color.surfaceAlt,
              borderTopWidth: 1,
              borderTopColor: tokens.color.border,
              alignItems: "flex-end",
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={12}>
              <Text
                style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.accent }}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
