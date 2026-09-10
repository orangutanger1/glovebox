import { Animated, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "./tokens";
import { usePressScale } from "./press";

/**
 * A pill toggle. Flat: a surface when off, white when on, with the label
 * carrying the state change in weight as well as in colour. The chip has to be
 * a visible object first and a selection second — an unselected chip filled
 * with `transparent` leaves the user looking at bare text where a control is.
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
  /** Drawn as a control that is not live yet, rather than hidden. A row that
   *  appears once the row above it is answered changes the shape of the
   *  question after the user has already read it. */
  disabled?: boolean;
}) {
  const press = usePressScale(disabled);

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
    >
      <Animated.View
        style={{
          transform: [{ scale: press.scale }],
          minHeight: 44,
          justifyContent: "center",
          paddingHorizontal: tokens.space.md,
          borderRadius: tokens.radius.pill,
          borderWidth: 1,
          backgroundColor: disabled
            ? tokens.color.surface
            : selected
              ? tokens.color.white
              : tokens.color.surfaceHi,
          borderColor: selected ? "transparent" : tokens.color.hairline,
        }}
      >
        <Text
          style={{
            ...tokens.text.body,
            fontWeight: selected ? "600" : "400",
            color: disabled
              ? tokens.color.textFaint
              : selected
                ? tokens.color.housing
                : tokens.color.text,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
