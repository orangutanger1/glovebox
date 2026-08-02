import { View, Text } from "react-native";
import { tokens } from "./tokens";
import { Lamp } from "./Lamp";

/**
 * A legend/readout pair — the app's signature element. Where a generic layout
 * writes "Odometer: 84,210" in a sentence, this puts a tracked uppercase
 * legend above a tabular-numeral readout, the way a cluster does.
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
    <View style={{ gap: 2, alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.xs }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>{legend}</Text>
        {lamp !== undefined ? <Lamp lit={lamp} /> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Text style={{ ...tokens.text.readout, color: tokens.color.text }}>{value}</Text>
        {unit ? (
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
