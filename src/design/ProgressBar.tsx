import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { tokens } from "./tokens";

/**
 * A machined slot with a bar filling it, for the one screen that makes the
 * user wait.
 *
 * Inset, not raised: the track is shadowed on its top edge, which is how every
 * well in this design system is drawn, and the fill is the only lit thing in
 * it. Linear easing on purpose. A progress bar that accelerates at the end is
 * telling the user something about the work that is not true.
 *
 * Width, not `scaleX`: a scaled bar grows from its centre unless it is nudged
 * back with a translate, and the two transforms disagree on a fractional
 * pixel. This runs once for a few seconds on a screen with nothing else
 * moving, so laying out is affordable and the geometry is exact.
 */
export function ProgressBar({
  duration,
  height = 6,
}: {
  /** Milliseconds for the fill to cross the track. */
  duration: number;
  height?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    run.start();
    return () => run.stop();
  }, [progress, duration]);

  return (
    <View
      accessibilityRole="progressbar"
      style={{
        height,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.edgeSolid,
        borderTopWidth: 1,
        borderTopColor: tokens.color.edge,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.hairline,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.metalHi,
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}
