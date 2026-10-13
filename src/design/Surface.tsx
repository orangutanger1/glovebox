import { View, type ViewStyle, type StyleProp } from "react-native";
import { tokens } from "./tokens";
import { isRedesign } from "./theme";

/**
 * The three surface primitives every control is built from.
 *
 * They used to be machined: a lit top edge, a dark bottom edge, a hard opaque
 * band underneath that shrank on press, and six percent of a brushed-metal
 * photograph over the whole thing. That was a convincing faceplate and a dated
 * interface — the housing was the loudest thing on every screen.
 *
 * All three are now flat, and separated only by value:
 *
 *   `Panel`  a surface holding content, one step above the background.
 *   `Raised` the same surface for something pressable, which answers a press
 *            by lifting one value rather than by travelling into the screen.
 *   `Well`   below the background: an input, a track, an empty socket.
 *
 * There is exactly one border colour in the system and every one of these
 * draws it on all four sides. A per-side border is what made the old surfaces
 * three-dimensional, so the direction no longer needs to live anywhere.
 */

export function Raised({
  children,
  pressed = false,
  radius = tokens.radius.md,
  style,
}: {
  children: React.ReactNode;
  pressed?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: pressed ? tokens.color.surfaceHi : tokens.color.surface,
          borderWidth: 1,
          borderColor: pressed ? tokens.color.hairlineLit : tokens.color.hairline,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Well({
  children,
  radius = tokens.radius.sm,
  focused = false,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  focused?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const redesign = isRedesign();
  return (
    <View
      style={[
        {
          borderRadius: redesign ? 16 : radius,
          borderCurve: "continuous",
          backgroundColor: tokens.color.sunken,
          borderWidth: redesign ? 1.5 : 1,
          // Arm A: focus is the accent. On a light page a brighter hairline is
          // invisible, and the accent is already "where you are" there.
          borderColor: focused
            ? redesign
              ? tokens.color.accent
              : tokens.color.hairlineLit
            : redesign
              ? "transparent"
              : tokens.color.hairline,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A surface holding content. Cards and list containers. */
export function Panel({
  children,
  radius,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (isRedesign()) {
    // Arm A: Bevel's white card, lifted by a soft shadow instead of outlined.
    // iOS drops the shadow of a view that clips, so the clip is a second view.
    const r = radius ?? tokens.radius.xl;
    return (
      <View style={[{ borderRadius: r, backgroundColor: tokens.color.surface, ...tokens.shadow.ambient }, style]}>
        <View style={{ borderRadius: r, borderCurve: "continuous", overflow: "hidden" }}>{children}</View>
      </View>
    );
  }
  return (
    <View
      style={[
        {
          borderRadius: radius ?? tokens.radius.md,
          backgroundColor: tokens.color.surface,
          borderWidth: 1,
          borderColor: tokens.color.hairline,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
