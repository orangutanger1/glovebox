import { Animated, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "./tokens";
import { usePressScale } from "./press";
import { isRedesign } from "./theme";

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
  const redesign = isRedesign();
  const on = redesign ? tokens.color.accent : tokens.color.white;
  const onInk = redesign ? tokens.color.onAccent : tokens.color.housing;
  // Arm A: a white pill on the grey page, as the option cards are.
  const idle = redesign ? tokens.color.surface : tokens.color.surfaceHi;

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
              ? on
              : idle,
          borderColor: selected || redesign ? "transparent" : tokens.color.hairline,
          ...(redesign && !selected && !disabled ? tokens.shadow.ambient : null),
        }}
      >
        <Text
          style={{
            ...tokens.text.body,
            fontWeight: selected ? "600" : "400",
            color: disabled
              ? tokens.color.textFaint
              : selected
                ? onInk
                : tokens.color.text,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
