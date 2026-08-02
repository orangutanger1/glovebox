import { Pressable, Text } from "react-native";
import { tokens } from "./tokens";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: tokens.space.md,
        borderRadius: tokens.radius.pill,
        borderWidth: 1,
        borderColor: selected ? tokens.color.accent : tokens.color.border,
        backgroundColor: selected ? tokens.color.accent + "22" : "transparent",
      }}
    >
      <Text
        style={{
          ...tokens.text.body,
          color: selected ? tokens.color.accent : tokens.color.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
