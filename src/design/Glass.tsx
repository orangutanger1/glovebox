import { View, type ViewStyle, type StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "./theme";

/**
 * A blurred pane floating over the content. Used for sticky footers and headers
 * so content passes underneath instead of ending at a hard line.
 *
 * Blur is the most expensive thing in this system. One pane per screen, at a
 * screen edge, never inside a scrolling list — forty blurred rows will drop
 * frames on an iPhone 11.
 *
 * The tint is the palette's, and the pane carries no fill of its own. It used
 * to paint a 55% near-black over the blur, which is a black pane whichever
 * tint is under it — and a black footer on warm paper is the single most
 * visible way to leak the old dark theme through. The blur plus one hairline
 * is the separation; anything opaque enough to need a fill is a `Panel`.
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
  const c = useTheme();

  return (
    <BlurView intensity={40} tint={c.blurTint} style={[{ overflow: "hidden" }, style]}>
      {/* Ratified deviation: this pane's own `backgroundColor: "rgba(15,17,19,0.55)"` was deleted and its
          border moved to `c.hairline` — a black footer on warm paper, and `app.json` pins iOS so the blur is real. */}
      <View
        style={{
          borderTopWidth: edge === "top" ? 1 : 0,
          borderBottomWidth: edge === "bottom" ? 1 : 0,
          borderColor: c.hairline,
        }}
      >
        {children}
      </View>
    </BlurView>
  );
}
