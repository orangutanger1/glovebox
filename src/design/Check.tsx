import { Text } from "react-native";
import { tokens } from "./tokens";

/**
 * The affirmative mark. White, never a lamp.
 *
 * A `Lamp` is red and glows, and it means the car needs something — it was
 * marking the three benefit lines on the paywall, so the app's only warning
 * signal was printed beside "A full log at resale". Red is reserved; a
 * confirmed, good thing gets a tick.
 */
export function Check({ size }: { size?: number }) {
  return (
    <Text style={{ ...tokens.text.body, fontSize: size, color: tokens.color.text }}>
      ✓
    </Text>
  );
}
