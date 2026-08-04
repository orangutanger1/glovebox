import { View, Text } from "react-native";
import { Chip } from "./Chip";
import { tokens } from "./tokens";

/**
 * A legend and the chips that answer it — the same legend/value pairing as a
 * gauge, with the value made of controls.
 *
 * Five screens ask a question this way, and before this they each rebuilt the
 * wrap row by hand with their own gap and their own label style. The chips
 * wrap rather than stack: a column of full-width buttons is the shape of every
 * quiz app there has ever been, and these labels are short enough to read as a
 * row of switches on a panel instead.
 */
export function ChipRow<T extends string>({
  legend,
  options,
  selected,
  onPress,
}: {
  legend?: string;
  options: readonly { value: T; label: string }[];
  /** Every selected value. Single-answer questions pass an array of one. */
  selected: readonly T[];
  onPress: (value: T) => void;
}) {
  return (
    <View style={{ gap: tokens.space.sm }}>
      {legend ? (
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{legend}</Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={selected.includes(o.value)}
            onPress={() => onPress(o.value)}
          />
        ))}
      </View>
    </View>
  );
}
