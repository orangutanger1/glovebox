import { View, Text, Image } from "react-native";

const ICON = require("../../assets/icon.png");

/**
 * One iOS notification banner, drawn the way the system draws it.
 *
 * This is the one element on the glass that is not the app at all — it is the OS
 * speaking over the top of it — so it is deliberately built from none of the
 * app's instrument-panel materials. A notification renders in the system
 * appearance, not the app's: a light, near-opaque rounded card with a soft drop
 * shadow, floating above whatever is behind it. Drawing it in the app's own dark
 * metal is exactly what made an earlier version read as a feature card.
 *
 * The layout is the real one: a large rounded-square app icon on the left; the
 * bold title and the lighter body stacked beside it; the arrival time in the top
 * corner. No separate app-name label — the icon is the app's identity, the way
 * iOS shows it on the lock screen and in a dropped banner.
 *
 * The strings come from the caller because the only honest source for them is
 * the scheduler's own copy, rendered against the user's own car.
 */

// System label colours (iOS light appearance), not the app's palette: this card
// is the OS's, and it has to look borrowed.
const LABEL = "#1c1c1e";
const SECONDARY = "rgba(60,60,67,0.6)";

export function NotifyBanner({
  title,
  body,
  when,
}: {
  title: string;
  body: string;
  when: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 22,
        // iOS continuous corners; ignored on platforms that lack it.
        borderCurve: "continuous",
        backgroundColor: "rgba(250,250,252,0.96)",
        // The banner's own drop shadow, softer and wider than the app's ambient
        // one — it is lit by the system, not by the panel above it.
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      <Image
        source={ICON}
        style={{ width: 38, height: 38, borderRadius: 9 }}
        accessibilityIgnoresInvertColors
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {/* Title bold, up to two lines, the way iOS truncates a collapsed
              banner; the timestamp sits in the top corner beside it. */}
          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              fontSize: 15,
              lineHeight: 20,
              fontWeight: "600",
              color: LABEL,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 18,
              color: SECONDARY,
              marginLeft: 8,
              marginTop: 1,
            }}
          >
            {when}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ fontSize: 15, lineHeight: 20, color: "rgba(60,60,67,0.85)" }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
