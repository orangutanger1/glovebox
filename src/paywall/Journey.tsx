import { Text, View } from "react-native";
import { tokens } from "../design/tokens";
import { Icon, type IconName } from "../redesign/icons";

/**
 * Opal's paywall journey, for arm A of `app_design`: the benefit rows drawn as
 * stops on a line, each with its icon in a disc, the first one lit. The rows
 * are the same three facts the classic paywall prints (DECISIONS: benefit
 * rows for everyone) — only the drawing differs. A line reads as "this is
 * what happens next", where a list of ticks reads as "this is what you get".
 */
export function Journey({ points }: { points: { icon: IconName; title: string; subtitle: string }[] }) {
  return (
    <View>
      {points.map((point, i) => {
        const first = i === 0;
        const last = i === points.length - 1;
        return (
          <View key={point.title} style={{ flexDirection: "row", gap: tokens.space.md }}>
            <View style={{ alignItems: "center", width: 40 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: first ? tokens.color.accent : tokens.color.surface,
                  ...(first ? null : tokens.shadow.ambient),
                }}
              >
                <Icon name={point.icon} size={20} color={first ? tokens.color.onAccent : tokens.color.accent} />
              </View>
              {last ? null : (
                <View style={{ flex: 1, width: 2, borderRadius: 1, marginVertical: 4, backgroundColor: tokens.color.accentLine }} />
              )}
            </View>
            <View style={{ flex: 1, paddingTop: 8, paddingBottom: last ? 0 : tokens.space.lg, gap: 2 }}>
              <Text style={{ ...tokens.text.body, fontSize: 17, fontWeight: "700", color: tokens.color.text }}>
                {point.title}
              </Text>
              <Text style={{ ...tokens.text.caption, fontSize: 14, lineHeight: 20, color: tokens.color.textMuted }}>
                {point.subtitle}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
