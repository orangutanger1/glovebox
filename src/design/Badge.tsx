import { View, Text } from "react-native";
import { tokens } from "./tokens";

/**
 * A stamped legend on the faceplate. Only `due` carries color — a red fill is
 * the app saying something is wrong, so `soon` and `ok` earn their weight from
 * contrast instead.
 */
const TONE = {
  due: { bg: tokens.color.red, fg: tokens.color.white, border: "rgba(255,255,255,0.35)" },
  soon: { bg: "rgba(0,0,0,0.35)", fg: tokens.color.text, border: tokens.color.hairline },
  ok: { bg: "rgba(0,0,0,0.25)", fg: tokens.color.textMuted, border: tokens.color.hairline },
};

export function Badge({ label, tone }: { label: string; tone: "due" | "soon" | "ok" }) {
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
      <Text style={{ ...tokens.text.legend, fontSize: 11, color: t.fg }}>{label}</Text>
    </View>
  );
}
