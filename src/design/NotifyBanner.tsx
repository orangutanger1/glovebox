import { View, Text, Image } from "react-native";

const ICON = require("../../assets/icon.png");

/**
 * One iOS notification banner, drawn the way the system draws it.
 *
 * This is the one element on the glass that is not the app at all — it is the OS
 * speaking over the top of it — so it is deliberately built from none of the
 * app's instrument-panel materials. It is iOS's dark appearance: a translucent
 * charcoal capsule with a hairline lip, white title, dimmed body, and the
 * arrival time in the corner — the banner a driver actually sees, because a
 * phone showing this app is a phone in dark mode. It was drawn in the light
 * appearance first, which put a white card in the middle of a black screen and
 * read as an illustration of a notification rather than as one.
 *
 * It is still not built from the app's own metal: drawing it in the panel
 * materials is what made an even earlier version read as a feature card.
 *
 * The layout is the real one: a large rounded-square app icon on the left; the
 * bold title and the lighter body stacked beside it; the arrival time in the top
 * corner. No separate app-name label — the icon is the app's identity, the way
 * iOS shows it on the lock screen and in a dropped banner.
 *
 * The strings come from the caller because the only honest source for them is
 * the scheduler's own copy, rendered against the user's own car.
 */

// System label colours (iOS dark appearance), not the app's palette: this card
// is the OS's, and it has to look borrowed.
const LABEL = "#FFFFFF";
const SECONDARY = "rgba(235,235,245,0.6)";
const BODY = "rgba(235,235,245,0.78)";

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
        backgroundColor: "rgba(58,58,60,0.72)",
        // The lip the system's material catches light on. Without it the
        // capsule dissolves into a dark screen instead of floating over it.
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        // The banner's own drop shadow, softer and wider than the app's ambient
        // one — it is lit by the system, not by the panel above it.
        shadowColor: "#000",
        shadowOpacity: 0.45,
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
          style={{ fontSize: 15, lineHeight: 20, color: BODY }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
