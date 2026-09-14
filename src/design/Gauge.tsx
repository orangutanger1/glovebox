import { View, Text } from "react-native";
import { tokens } from "./tokens";
import { Lamp } from "./Lamp";

/**
 * A legend/readout pair — the app's signature element. Where a generic layout
 * writes "Odometer: 84,210" in a sentence, this stacks a quiet label above a
 * large tabular-numeral figure, so the number is what the eye lands on and the
 * label is there for the second look.
 *
 * The legend and the readout never appear apart.
 */
export function Gauge({
  legend,
  value,
  unit,
  lamp,
  align = "left",
}: {
  legend: string;
  value: string;
  unit?: string;
  /** Omit for gauges with no alarm state. `false` renders an unlit bulb. */
  lamp?: boolean;
  align?: "left" | "right";
}) {
  return (
    <View
      style={{
        gap: 2,
        flexShrink: 1,
        alignItems: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.xs }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>{legend}</Text>
        {lamp !== undefined ? <Lamp lit={lamp} /> : null}
      </View>
      {/* The readout may shrink and wrap — a long vehicle name is a value
          too, and a gauge that will not give way rams into its neighbour. */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, flexShrink: 1 }}>
        <Text style={{ ...tokens.text.readout, color: tokens.color.text, flexShrink: 1 }}>
          {value}
        </Text>
        {unit ? (
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
