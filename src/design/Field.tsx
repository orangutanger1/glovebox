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
import { useTheme } from "./theme";
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
  onFocus,
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
  /** Fired when the user commits to typing here. Onboarding reports it: a
   *  keyboard opening is the expensive event in a flow whose whole problem was
   *  how much of it had to be typed. */
  onFocus?: () => void;
}) {
  const c = useTheme();

  const [focused, setFocused] = useState(false);

  // The iOS number pad has no return key, so a numeric field with no accessory
  // bar is a keyboard the user cannot put away.
  const accessoryId = useId().replace(/:/g, "");
  const needsAccessory = Platform.OS === "ios" && keyboardType === "numeric";
  const numeric = keyboardType === "numeric";

  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.caption, color: c.inkMuted }}>{label}</Text>
      <Well
        focused={focused}
        // Red is reserved for overdue and destructive — a rejected value is
        // the third. The border carries it so the eye lands on the field, not
        // only on the sentence under it.
        style={error ? { borderColor: c.overdue } : undefined}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholderTextColor={c.inkFaint}
          selectionColor={c.accent}
          inputAccessoryViewID={needsAccessory ? accessoryId : undefined}
          style={{
            ...(numeric ? tokens.text.readout : tokens.text.body),
            color: c.ink,
            paddingHorizontal: tokens.space.md,
            paddingVertical: tokens.space.sm + 2,
          }}
        />
      </Well>
      {error ? (
        <Text style={{ ...tokens.text.caption, color: c.overdue }}>{error}</Text>
      ) : null}
      {needsAccessory ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              backgroundColor: c.cardSunken,
              borderTopWidth: 1,
              borderTopColor: c.hairline,
              alignItems: "flex-end",
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={12}>
              <Text style={{ ...tokens.text.body, fontWeight: "600", color: c.ink }}>
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
