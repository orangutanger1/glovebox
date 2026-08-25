import { View, Text, ScrollView } from "react-native";
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
  scroll = false,
  disabled = false,
}: {
  legend?: string;
  options: readonly { value: T; label: string }[];
  /** Every selected value. Single-answer questions pass an array of one. */
  selected: readonly T[];
  onPress: (value: T) => void;
  /** One scrolling line instead of a wrapping block. For the answer sets that
   *  are long but ordered — twenty-six model years wrap into six rows of
   *  identical four-digit numbers, which is a wall rather than a control. */
  scroll?: boolean;
  /** The whole row is drawn but not live. Used where the second half of a
   *  two-part question has to be visible before the first half is answered. */
  disabled?: boolean;
}) {
  const chips = options.map((o) => (
    <Chip
      key={o.value}
      label={o.label}
      selected={selected.includes(o.value)}
      onPress={() => onPress(o.value)}
      disabled={disabled}
    />
  ));

  return (
    <View style={{ gap: tokens.space.sm }}>
      {legend ? (
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{legend}</Text>
      ) : null}
      {scroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // The chips are inside the screen's vertical ScrollView; without
          // this the outer one claims the gesture and the row cannot be moved.
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexDirection: "row", gap: tokens.space.sm }}
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {chips}
        </View>
      )}
    </View>
  );
}
