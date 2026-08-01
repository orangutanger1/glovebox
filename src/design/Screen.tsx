import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "./tokens";

export function Screen({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <ScrollView contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.md }}>
        {title ? (
          <Text style={{ ...tokens.text.title, color: tokens.color.text }}>{title}</Text>
        ) : null}
        <View style={{ gap: tokens.space.md }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
