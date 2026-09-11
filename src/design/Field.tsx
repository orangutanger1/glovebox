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

/** The height of every well, whichever type sits in it. A comfortable tap
 *  target, and the number that makes a text field and a numeric one the same
 *  size on a screen that shows both. */
const FIELD_HEIGHT = 48;

/**
 * An input. It sits one value below the background, so the field is a place
 * text goes rather than a box drawn around some. The label above it is a
 * legend, and a numeric field's text is a readout — a mileage entry should
 * look like the odometer it mirrors.
 *
 * Focus brightens the hairline rather than adding a coloured ring. Colour in
 * this app means something, and "the cursor is here" is not one of the things
 * it means.
 */
export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  autoFocus,
  autoCapitalize,
  autoCorrect,
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
  /** Passed through to the input. A car's make and model are proper nouns and
   *  short model codes, and iOS lower-casing "GTI" or autocorrecting "Kia" to
   *  "Kai" writes the wrong car into the garage. */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  /** Shown under the field, in red. A field that silently refuses a value
   *  leaves the user retyping it, so every rejection has to be said out loud. */
  error?: string;
  onBlur?: () => void;
  /** Fired when the user commits to typing here. Onboarding reports it: a
   *  keyboard opening is the expensive event in a flow whose whole problem was
   *  how much of it had to be typed. */
  onFocus?: () => void;
}) {
  const [focused, setFocused] = useState(false);

  // The iOS number pad has no return key, so a numeric field with no accessory
  // bar is a keyboard the user cannot put away.
  const accessoryId = useId().replace(/:/g, "");
  const needsAccessory = Platform.OS === "ios" && keyboardType === "numeric";
  const numeric = keyboardType === "numeric";

  return (
    <View style={{ gap: tokens.space.sm }}>
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
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholderTextColor={tokens.color.textFaint}
          selectionColor={tokens.color.white}
          inputAccessoryViewID={needsAccessory ? accessoryId : undefined}
          style={{
            ...(numeric ? tokens.text.readout : tokens.text.body),
            // The type scale's line height is for paragraphs. iOS lays a
            // TextInput's text against the top of its line box rather than
            // centring it in it, so a line height taller than the glyphs sits
            // the value low in the well and leaves a gap under the label —
            // visible on every text field, because `body` carries one, and on
            // no numeric field, because `readout` does not. A single-line
            // input takes the size and the weight; the box does the spacing.
            lineHeight: undefined,
            color: tokens.color.text,
            paddingHorizontal: tokens.space.md,
            // A fixed box the text is centred in, rather than one grown from
            // the glyphs: a 16pt name field and a 24pt mileage readout are
            // then the same height, and two fields side by side line up
            // whatever is typed into them.
            minHeight: FIELD_HEIGHT,
            paddingVertical: 0,
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
              backgroundColor: tokens.color.surfaceHi,
              borderTopWidth: 1,
              borderTopColor: tokens.color.hairline,
              alignItems: "flex-end",
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm,
            }}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={12}>
              <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.white }}>
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
