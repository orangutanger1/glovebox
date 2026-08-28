import { View, type ViewStyle, type StyleProp } from "react-native";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * The two surface primitives every control is built from.
 *
 * The previous version built depth from per-side border colours and a 3px
 * opaque band, because React Native has no inset shadow. It worked, and it
 * looked like 2013 — hard borders around every element is the most reliable
 * dated signal an interface can emit. Depth is now fill, one hairline, and a
 * soft shadow; a recess is a darker fill and no shadow.
 *
 * Both raised primitives are the same two nodes: an opaque shadow caster
 * outside, a clipping face inside. The shadow cannot share a node with
 * `overflow: hidden` — on iOS the two cancel each other out — and the caster
 * has to be opaque, or the shadow shows through its own child and a
 * translucent `style` fill composites over the screen instead of over the
 * card. That fill is also what lets iOS derive a `shadowPath` instead of
 * rasterising the alpha channel offscreen every frame.
 *
 * `shadowOpacity` is the only theme-dependent part of the shadow, so it is the
 * only part supplied here; the rest is `tokens.shadow.soft`.
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
  const c = useTheme();
  // Press lives on the caster so the face and its shadow move as one object:
  // scaling the face alone leaves the shadow behind at full size.
  return (
    <View
      style={{
        borderRadius: radius,
        backgroundColor: c.card,
        ...tokens.shadow.soft,
        shadowOpacity: pressed ? c.shadowOpacity * 0.4 : c.shadowOpacity,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }}
    >
      <View
        style={[
          {
            borderRadius: radius,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.hairline,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
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
  const c = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: c.cardSunken,
          borderWidth: 1,
          borderColor: focused ? c.accent : c.hairline,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A flat card surface — no press state. Cards and list containers. */
export function Panel({
  children,
  radius = tokens.radius.md,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        borderRadius: radius,
        backgroundColor: c.card,
        ...tokens.shadow.soft,
        shadowOpacity: c.shadowOpacity,
      }}
    >
      <View
        style={[
          {
            borderRadius: radius,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.hairline,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
