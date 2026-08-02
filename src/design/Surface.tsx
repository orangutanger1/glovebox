import { View, Image, type ViewStyle, type StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { tokens } from "./tokens";

const METAL = require("../../assets/onboarding/metal.jpg");

/**
 * The brushed-aluminium grain every metal face carries.
 *
 * A two-stop vertical gradient is what a faceplate looks like in a spec, not
 * in life — the eye reads a perfectly smooth ramp as plastic. Six percent of a
 * real brush texture is below the threshold of "there is a photo here" and
 * above the threshold of "this is a machined surface", which is the whole
 * point. It tiles, so one 512px file covers every surface at every size.
 */
function Grain() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Image
        source={METAL}
        resizeMode="repeat"
        style={{ width: "100%", height: "100%", opacity: 0.06 }}
      />
    </View>
  );
}

/**
 * The two surface primitives every control is built from.
 *
 * `Raised` sits above the faceplate: lit on its top edge, with a hard opaque
 * band beneath it that shrinks when pressed, so the control visibly travels
 * into its housing. `Well` is the same bevel flipped — shadowed on top,
 * because a recess is below the surface, not above it.
 *
 * Getting the bevel backwards makes buttons look like holes, so the direction
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
  const edge = pressed ? tokens.material.edgePressed : tokens.material.edgeHeight;
  const travel = pressed ? tokens.material.pressTravel : 0;

  return (
    <View
      style={{
        borderRadius: radius,
        backgroundColor: tokens.color.edgeSolid,
        paddingBottom: edge,
        marginTop: travel,
        // The ambient shadow collapses under a pressed control — a button
        // resting in its housing casts almost nothing.
        ...tokens.shadow.ambient,
        shadowOpacity: pressed ? 0.2 : tokens.shadow.ambient.shadowOpacity,
      }}
    >
      <LinearGradient
        colors={[...tokens.material.metalFace]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          {
            borderRadius: radius,
            borderWidth: 1,
            borderTopColor: tokens.color.hairline,
            borderLeftColor: tokens.color.hairline,
            borderRightColor: tokens.color.hairline,
            borderBottomColor: tokens.color.edge,
            overflow: "hidden",
          },
          style,
        ]}
      >
        <Grain />
        {children}
      </LinearGradient>
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
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: tokens.color.housing,
          borderWidth: 1,
          // Flipped: dark on top, light on the bottom lip. This is what makes
          // it read as milled into the panel rather than stuck onto it.
          borderTopColor: focused ? tokens.color.hairlineLit : tokens.color.edge,
          borderLeftColor: tokens.color.edge,
          borderRightColor: tokens.color.edge,
          borderBottomColor: tokens.color.hairline,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A flat metal panel — no edge band, no travel. Cards and list containers. */
export function Panel({
  children,
  radius = tokens.radius.md,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  // The shadow lives on an outer view: on iOS, `overflow: hidden` and a shadow
  // on the same node cancel the shadow out.
  return (
    <View style={{ borderRadius: radius, ...tokens.shadow.ambient }}>
      <LinearGradient
        colors={[...tokens.material.metalFace]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          {
            borderRadius: radius,
            borderWidth: 1,
            borderTopColor: tokens.color.hairline,
            borderLeftColor: tokens.color.hairline,
            borderRightColor: tokens.color.hairline,
            borderBottomColor: tokens.color.edge,
            overflow: "hidden",
          },
          style,
        ]}
      >
        <Grain />
        {children}
      </LinearGradient>
    </View>
  );
}
