import { Animated, Pressable, type PressableProps } from "react-native";
import { usePressScale } from "./press";

/**
 * A pressable that answers with the app's press language — scale to 0.97 and
 * back — instead of dimming.
 *
 * For anything that is a control but is not one of the built controls: a card
 * that opens a screen, a row that is really a link. Fading a card on press is
 * the tell of a prototype; it says the app is busy rather than that the tap
 * landed, and it is the one feedback the user reads as lag.
 */
export function PressableScale({
  children,
  style,
  disabled,
  ...rest
}: PressableProps & { children: React.ReactNode }) {
  const press = usePressScale(disabled ?? false);

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      <Animated.View style={[{ transform: [{ scale: press.scale }] }, style as never]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
