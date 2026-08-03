import { View, type ViewStyle, type StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { tokens } from "./tokens";

/**
 * A blurred pane floating over the metal. Used for sticky footers and headers
 * so content passes underneath instead of ending at a hard line.
 *
 * Blur is the most expensive thing in this system. One pane per screen, at a
 * screen edge, never inside a scrolling list — forty blurred rows will drop
 * frames on an iPhone 11.
 */
export function Glass({
  children,
  edge = "top",
  style,
}: {
  children: React.ReactNode;
  /** Which side faces the content, and therefore carries the hairline. */
  edge?: "top" | "bottom";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <BlurView intensity={40} tint="dark" style={[{ overflow: "hidden" }, style]}>
      <View
        style={{
          borderTopWidth: edge === "top" ? 1 : 0,
          borderBottomWidth: edge === "bottom" ? 1 : 0,
          borderColor: "rgba(255,255,255,0.06)",
          backgroundColor: "rgba(15,17,19,0.55)",
        }}
      >
        {children}
      </View>
    </BlurView>
  );
}
