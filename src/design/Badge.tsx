import { View, Text } from "react-native";
import { tokens } from "./tokens";

/**
 * A status label. Only `due` carries colour — a red fill is the app saying
 * something is wrong, so `soon` and `ok` earn their weight from contrast
 * instead.
 *
 * `due` is a wash and a red label rather than a solid red block: at this size
 * a filled chip is a sticker, and the row it sits in already carries the
 * alarm. The badge names the state, it does not shout it.
 */
const TONE = {
  due: { bg: tokens.color.redWash, fg: tokens.color.red, border: "rgba(229,72,77,0.30)" },
  soon: { bg: tokens.color.surfaceHi, fg: tokens.color.text, border: tokens.color.hairline },
  ok: { bg: "transparent", fg: tokens.color.textMuted, border: tokens.color.hairline },
};

export function Badge({ label, tone }: { label: string; tone: "due" | "soon" | "ok" }) {
  const t = TONE[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: tokens.radius.pill,
        paddingHorizontal: tokens.space.sm + 2,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...tokens.text.caption, fontWeight: "500", color: t.fg }}>{label}</Text>
    </View>
  );
}
