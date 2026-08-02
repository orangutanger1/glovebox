import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Glass } from "./Glass";
import { tokens } from "./tokens";

/**
 * The housing every screen is mounted in.
 *
 * `footer` renders under a glass pane pinned to the bottom, so a primary
 * action stays reachable while the list scrolls behind it. Content gets bottom
 * padding to clear it — a button that covers the last row is the same class of
 * bug as a keyboard that covers the button.
 */
export function Screen({
  title,
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            padding: tokens.space.md,
            paddingBottom: footer ? tokens.space.xxl + tokens.space.lg : tokens.space.xl,
            gap: tokens.space.md,
          }}
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
        {footer ? (
          <Glass edge="top">
            <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>{footer}</View>
          </Glass>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
