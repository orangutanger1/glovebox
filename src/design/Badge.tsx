import { View, Text } from "react-native";
import { tokens } from "./tokens";

const TONE = { due: tokens.color.due, soon: tokens.color.soon, ok: tokens.color.ok };

export function Badge({ label, tone }: { label: string; tone: "due" | "soon" | "ok" }) {
  return (
    <View
      style={{
        backgroundColor: TONE[tone] + "22",
        borderColor: TONE[tone],
        borderWidth: 1,
        borderRadius: tokens.radius.sm,
        paddingHorizontal: tokens.space.sm,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...tokens.text.caption, color: TONE[tone] }}>{label}</Text>
    </View>
  );
}
