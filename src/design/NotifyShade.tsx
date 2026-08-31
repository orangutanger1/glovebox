import type { ReactNode } from "react";
import { View } from "react-native";
import { tokens } from "./tokens";

/**
 * The notification shade the app's own banner arrives into.
 *
 * A banner drawn alone on the glass is a card; a banner drawn between two
 * out-of-focus neighbours is a notification, because the thing that makes it
 * read as the OS is the stack it lands in. The neighbours carry no copy at all
 * — they are dimmed to the point of illegibility on purpose, so the eye has
 * exactly one message to read and no invented one to read wrongly.
 */
function GhostBanner() {
  const bar = (width: number | `${number}%`) => (
    <View
      style={{
        height: 8,
        width,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.06)",
      }}
    />
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        padding: 12,
        borderRadius: 22,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />
      <View style={{ flex: 1, gap: 6, paddingTop: 4 }}>
        {bar("55%")}
        {bar("90%")}
        {bar("70%")}
      </View>
    </View>
  );
}

/** The real banner, seated in the stack with a dimmed neighbour either side. */
export function NotifyShade({ children }: { children: ReactNode }) {
  return (
    <View style={{ gap: tokens.space.md }}>
      <GhostBanner />
      {children}
      <GhostBanner />
    </View>
  );
}
