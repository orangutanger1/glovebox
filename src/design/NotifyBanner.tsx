import { View, Text, Image } from "react-native";
import { tokens } from "./tokens";

const ICON = require("../../assets/icon.png");

/**
 * One iOS notification, drawn by the app.
 *
 * Deliberately not built from `Panel` or `Raised`. Everything else in this
 * product is a machined faceplate; this is the one element on the glass that
 * is not the app at all, and drawing it in the app's own material would make
 * it read as a feature card — which is exactly the misunderstanding a preview
 * of a notification must not create. Rounded, frosted-light, system-shaped.
 *
 * No blur: the blur budget is one pane per screen and the footer already
 * spends it. A flat white wash at 10% reads the same at this size.
 *
 * The strings come from the caller because the only honest source for them is
 * the scheduler's own copy, rendered against the user's own car.
 */
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
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: tokens.color.hairline,
        backgroundColor: "rgba(255,255,255,0.10)",
        padding: tokens.space.md,
        gap: tokens.space.xs,
        ...tokens.shadow.ambient,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space.sm,
        }}
      >
        <Image
          source={ICON}
          style={{ width: 18, height: 18, borderRadius: 4 }}
          accessibilityIgnoresInvertColors
        />
        <Text
          style={{
            ...tokens.text.legend,
            color: tokens.color.textMuted,
            flex: 1,
          }}
        >
          Wrenchy
        </Text>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
          {when}
        </Text>
      </View>
      {/* Two lines and one, the way iOS truncates a collapsed banner — and the
          reason the animated container above can hold a fixed height while the
          messages inside it change every two seconds. */}
      <Text
        numberOfLines={2}
        style={{
          ...tokens.text.body,
          fontWeight: "600",
          color: tokens.color.text,
        }}
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        style={{ ...tokens.text.caption, color: tokens.color.textMuted }}
      >
        {body}
      </Text>
    </View>
  );
}
