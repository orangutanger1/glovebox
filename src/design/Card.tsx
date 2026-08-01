import { View } from "react-native";
import { tokens } from "./tokens";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        padding: tokens.space.md,
        gap: tokens.space.sm,
      }}
    >
      {children}
    </View>
  );
}
