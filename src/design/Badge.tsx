import { View, Text } from "react-native";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * A stamped legend on the faceplate. Only `due` carries color — a red fill is
 * the app saying something is wrong, so `soon` and `ok` earn their weight from
 * contrast instead.
 */
export function Badge({ label, tone }: { label: string; tone: "due" | "soon" | "ok" }) {
  const c = useTheme();

  // Built here rather than at module scope: the palette is a hook read, and a
  // frozen table cannot answer which theme is on the glass.
  const TONE = {
    due: { bg: c.overdue, fg: "#FFFFFF", border: "rgba(255,255,255,0.35)" },
    soon: { bg: c.cardSunken, fg: c.ink, border: c.hairline },
    ok: { bg: c.cardSunken, fg: c.inkMuted, border: c.hairline },
  };
  const t = TONE[tone];

  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: tokens.radius.sm,
        paddingHorizontal: tokens.space.sm,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...tokens.text.caption, fontWeight: "600", color: t.fg }}>{label}</Text>
    </View>
  );
}
