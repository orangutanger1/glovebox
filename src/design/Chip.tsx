import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * Selected is the accent; unselected is a sunken fill, never transparent.
 * `tests/design-tokens.test.tsx` holds that line — an unselected chip filled
 * with the screen colour is bare text where a control should be, which is the
 * bug the metal was introduced to fix and which must not return with it.
 */
export function Chip({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Drawn as a control that is not live yet, rather than hidden. */
  disabled?: boolean;
}) {
  const c = useTheme();

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled} accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <View
          style={{
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: tokens.space.md,
            borderRadius: tokens.radius.pill,
            backgroundColor: selected ? c.accent : c.cardSunken,
            borderWidth: 1,
            borderColor: selected ? c.accent : c.hairline,
            opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          }}
        >
          <Text
            style={{
              ...tokens.text.body,
              fontWeight: selected ? "600" : "400",
              color: selected ? c.onAccent : c.ink,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
