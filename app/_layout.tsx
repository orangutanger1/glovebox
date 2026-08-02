import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { getDb } from "../src/db/client";
import { initPurchases } from "../src/purchases";
import { rescheduleAll } from "../src/notify";
import { isOnboarded, getOnboardingStep } from "../src/onboarding";
import { tokens } from "../src/design/tokens";
import "../global.css";

export default function RootLayout() {
  const router = useRouter();

  // Runs once on mount, not gated on route state — depending on the route
  // here would produce a redirect loop.
  useEffect(() => {
    getDb();
    initPurchases();
    rescheduleAll();
    if (!isOnboarded()) {
      const step = getOnboardingStep() ?? "welcome";
      router.replace(`/onboarding/${step}` as Parameters<typeof router.replace>[0]);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tokens.color.bg },
          headerTintColor: tokens.color.text,
          contentStyle: { backgroundColor: tokens.color.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerRight: () => (
              <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
                <Text style={{ fontSize: 20, color: tokens.color.text }}>⚙︎</Text>
              </Pressable>
            ),
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
