import { useId, useState } from "react";
import {
  View,
  Text,
  TextInput,
  InputAccessoryView,
  Keyboard,
  Pressable,
  Platform,
} from "react-native";
import { Well } from "./Surface";
import { tokens } from "./tokens";

/**
 * An input recessed into the faceplate. The label above it is a legend, and a
 * numeric field's text is a readout — a mileage entry should look like the
 * odometer it mirrors.
 *
 * Focus lights the top border rather than adding a colored ring: the well is
 * catching more light, which is consistent with how every other surface here
 * signals state.
 */
export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  autoFocus,
  error,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
  autoFocus?: boolean;
  /** Shown under the field, in red. A field that silently refuses a value
   *  leaves the user retyping it, so every rejection has to be said out loud. */
  error?: string;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);

  // The iOS number pad has no return key, so a numeric field with no accessory
  // bar is a keyboard the user cannot put away.
  const accessoryId = useId().replace(/:/g, "");
  const needsAccessory = Platform.OS === "ios" && keyboardType === "numeric";
  const numeric = keyboardType === "numeric";

  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>{label}</Text>
      <Well
        focused={focused}
        // Red is reserved for overdue and destructive — a rejected value is
        // the third. The border carries it so the eye lands on the field, not
        // only on the sentence under it.
        style={error ? { borderColor: tokens.color.red } : undefined}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholderTextColor={tokens.color.textFaint}
          selectionColor={tokens.color.white}
          inputAccessoryViewID={needsAccessory ? accessoryId : undefined}
          style={{
            ...(numeric ? tokens.text.readout : tokens.text.body),
            color: tokens.color.text,
            paddingHorizontal: tokens.space.md,
            paddingVertical: tokens.space.sm + 2,
          }}
        />
      </Well>
      {error ? (
        <Text style={{ ...tokens.text.caption, color: tokens.color.red }}>{error}</Text>
      ) : null}
      {needsAccessory ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              backgroundColor: tokens.color.metalLo,
              borderTopWidth: 1,
              borderTopColor: tokens.color.hairline,
              alignItems: "flex-end",
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={12}>
              <Text style={{ ...tokens.text.legend, fontSize: 14, color: tokens.color.white }}>
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
