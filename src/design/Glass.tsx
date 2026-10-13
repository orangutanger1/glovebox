import { View, type ViewStyle, type StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { tokens } from "./tokens";
import { isRedesign } from "./theme";

/**
 * A blurred pane floating over the content beneath it. Used for sticky footers and headers
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
  if (isRedesign()) {
    // Arm A of `app_design`: a pinned footer is a white sheet with rounded
    // top corners lifted off the grey page, as the onboarding plan sheet is.
    // No blur: on a light page a frosted pane reads as a rendering fault.
    const sheet = edge === "top";
    return (
      <View
        style={[
          {
            backgroundColor: tokens.color.surface,
            borderTopLeftRadius: sheet ? 28 : 0,
            borderTopRightRadius: sheet ? 28 : 0,
            shadowColor: "#1A1D3A",
            shadowOpacity: 0.1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: sheet ? -6 : 6 },
          },
          style,
        ]}
      >
        <View style={{ paddingTop: sheet ? tokens.space.sm : 0 }}>{children}</View>
      </View>
    );
  }
  return (
    <BlurView intensity={40} tint="dark" style={[{ overflow: "hidden" }, style]}>
      <View
        style={{
          borderTopWidth: edge === "top" ? 1 : 0,
          borderBottomWidth: edge === "bottom" ? 1 : 0,
          borderColor: tokens.color.hairline,
          backgroundColor: "rgba(10,11,13,0.60)",
        }}
      >
        {children}
      </View>
    </BlurView>
  );
}
