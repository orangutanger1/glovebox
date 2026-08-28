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
 * soft shadow; a recess is a darker fill and no shadow. The direction still
 * lives here and nowhere else.
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
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.hairline,
          shadowColor: "#000",
          shadowOpacity: pressed ? c.shadowOpacity * 0.4 : c.shadowOpacity,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
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
  // The shadow lives on an outer view: on iOS, `overflow: hidden` and a shadow
  // on the same node cancel the shadow out.
  return (
    <View
      style={{
        borderRadius: radius,
        shadowColor: "#000",
        shadowOpacity: c.shadowOpacity,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
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
