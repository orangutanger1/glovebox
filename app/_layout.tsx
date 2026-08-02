import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { getDb } from "../src/db/client";
import { initPurchases } from "../src/purchases";
import { rescheduleAll } from "../src/notify";
import { isOnboarded, getOnboardingStep } from "../src/onboarding";
import { tokens } from "../src/design/tokens";

export default function RootLayout() {
  const router = useRouter();
  const [fatal, setFatal] = useState<string | null>(null);

  // Runs once on mount, not gated on route state — depending on the route
  // here would produce a redirect loop.
  useEffect(() => {
    try {
      getDb();
    } catch (e) {
      // A migration failure already rolled the file back. Say so instead of
      // rendering an empty screen the user can only read as "my records
      // are gone".
      setFatal(String(e));
      return;
    }
    initPurchases();
    rescheduleAll().catch(() => {});
    if (!isOnboarded()) {
      const step = getOnboardingStep() ?? "welcome";
      router.replace(`/onboarding/${step}` as Parameters<typeof router.replace>[0]);
    }
  }, []);

  if (fatal) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.housing,
          alignItems: "center",
          justifyContent: "center",
          padding: tokens.space.xl,
          gap: tokens.space.md,
        }}
      >
        <StatusBar style="light" />
        <Text style={{ ...tokens.text.heading, color: tokens.color.text, textAlign: "center" }}>
          Glovebox could not open your records.
        </Text>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted, textAlign: "center" }}>
          Nothing was deleted — the database was restored to its last good state. Reopen the app.
          If this keeps happening, contact support before reinstalling, because reinstalling is what
          would actually lose the records.
        </Text>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
          {fatal}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tokens.color.housing },
          headerTintColor: tokens.color.text,
          headerTitleStyle: { ...tokens.text.legend, fontSize: 15, color: tokens.color.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: tokens.color.housing },
          // A chevron with no label. The default label is the previous route's
          // title, which is how the back button came to read "index".
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        {/* Screens built on <Screen> already print their own title in the body,
            so the header title is blanked rather than repeating it two lines
            up. Every screen still gets a `title` for the accessibility label —
            without one the route pattern shows through, which is where
            "vehicle/[id]" was coming from. */}
        <Stack.Screen
          name="index"
          options={{
            title: "Garage",
            headerTitle: "",
            headerRight: () => (
              <Pressable onPress={() => router.push("/settings")} hitSlop={12}>
                <Text style={{ fontSize: 20, color: tokens.color.text }}>⚙︎</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings", headerTitle: "" }} />
        <Stack.Screen name="vehicle/new" options={{ title: "Add vehicle", headerTitle: "" }} />
        {/* The one screen with no body title: it names the vehicle in the
            header instead, set from the row in the screen itself. */}
        <Stack.Screen name="vehicle/[id]" options={{ title: "Vehicle" }} />
        <Stack.Screen
          name="vehicle/[id]/log"
          options={{ title: "Log a service", headerTitle: "" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
