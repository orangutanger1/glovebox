import { View, Text } from "react-native";
import { tokens } from "./tokens";

/**
 * The affirmative mark. Green, never a lamp.
 *
 * A `Lamp` is red and glows, and it means the car needs something — it was
 * marking the three benefit lines on the paywall, so the app's only warning
 * signal was printed beside "A full log at resale". Red is reserved; a
 * confirmed, good thing gets a tick.
 *
 * The tick was white for the same reason the rest of the system is: no new
 * hues. That made the paywall's three consequences and the subscriber's two
 * unlocked rows read as body text with punctuation in front of them. A cluster
 * already has a second colour for exactly this meaning — the green telltale
 * that says a system is on — so the tick borrows it, and sits in a washed disc
 * so the mark is a fitting on the panel rather than a character in the line.
 */
export function Check({ size }: { size?: number }) {
  const glyph = size ?? tokens.text.body.fontSize;
  const disc = Math.round(glyph * 1.4);

  return (
    <View
      style={{
        width: disc,
        height: disc,
        borderRadius: disc / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.color.greenWash,
        borderWidth: 1,
        borderColor: tokens.color.greenGlow,
      }}
    >
      <Text
        style={{
          ...tokens.text.body,
          fontSize: glyph * 0.72,
          lineHeight: glyph * 0.9,
          fontWeight: "700",
          color: tokens.color.green,
        }}
      >
        ✓
      </Text>
    </View>
  );
}
