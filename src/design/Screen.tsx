import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "./tokens";

export function Screen({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.md }}
          // Without this the first tap on a button while the keyboard is up is
          // swallowed by the dismiss, and the button looks broken.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {title ? (
            <Text style={{ ...tokens.text.title, color: tokens.color.text }}>{title}</Text>
          ) : null}
          <View style={{ gap: tokens.space.md }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
