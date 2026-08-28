import { View } from "react-native";
import { useTheme } from "./theme";

/**
 * A dashboard warning lamp. The only element in the app that glows, which is
 * what makes it mean something. Unlit is a hairline bulb — still visibly a
 * lamp, so the lit state has a baseline to contrast against.
 *
 * Two tones, because two different things light this bulb. `alarm` is the
 * default and the original meaning: something is overdue, so it lights in
 * `overdue` with a wash bloom behind it. `progress` is `StepLamps` counting
 * onboarding questions off, where red would be a warning about nothing — it
 * lights in the accent and does not bloom, since the palette has no accent
 * wash and a red halo behind an orange bulb is worse than no halo.
 */
export function Lamp({
  lit,
  size = 10,
  tone = "alarm",
}: {
  lit: boolean;
  size?: number;
  tone?: "alarm" | "progress";
}) {
  const c = useTheme();

  const glow = size * 2.6;
  const alarm = tone === "alarm";

  return (
    <View style={{ width: glow, height: glow, alignItems: "center", justifyContent: "center" }}>
      {lit && alarm ? (
        <View
          style={{
            position: "absolute",
            width: glow,
            height: glow,
            borderRadius: glow / 2,
            backgroundColor: c.overdueWash,
          }}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: lit ? (alarm ? c.overdue : c.accent) : c.hairline,
          borderWidth: 1,
          borderColor: c.hairline,
        }}
      />
    </View>
  );
}
