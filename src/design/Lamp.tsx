import { View } from "react-native";
import { tokens } from "./tokens";

/**
 * A dashboard warning lamp. The only element in the app that glows, which is
 * what makes it mean something. Lit = red with a soft bloom behind it; unlit =
 * a dark recessed bulb, still visibly a lamp so the lit state has a baseline
 * to contrast against.
 */
export function Lamp({ lit, size = 10 }: { lit: boolean; size?: number }) {
  const glow = size * 2.6;

  return (
    <View style={{ width: glow, height: glow, alignItems: "center", justifyContent: "center" }}>
      {lit ? (
        <View
          style={{
            position: "absolute",
            width: glow,
            height: glow,
            borderRadius: glow / 2,
            backgroundColor: tokens.color.redGlow,
          }}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: lit ? tokens.color.red : tokens.color.edgeSolid,
          borderWidth: 1,
          borderColor: lit ? "rgba(255,255,255,0.35)" : tokens.color.edge,
        }}
      />
    </View>
  );
}
