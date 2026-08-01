import { Pressable, View, Text } from "react-native";
import { tokens } from "./tokens";

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: tokens.space.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}
