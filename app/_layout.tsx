import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import * as QuickActions from "expo-quick-actions";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { getDb } from "../src/db/client";
import { DISCOUNT_OFFERING, hasOffering, initPurchases, isPro } from "../src/purchases";
import { rescheduleAll } from "../src/notify";
import { isOnboarded, getOnboardingStep } from "../src/onboarding";
import { resumeRoute } from "../src/onboarding/flow";
import { recordReviewEvent } from "../src/review";
import { recordOpen, getWinbackShownAt } from "../src/winback";
import { shouldOfferWinback } from "../src/winback/state";
import { openFeedback } from "../src/feedback";
import {
  QUICK_ACTION_FEEDBACK,
  QUICK_ACTION_TRIAL,
  syncQuickActions,
} from "../src/quickactions";
import { tokens } from "../src/design/tokens";

export default function RootLayout() {
  const router = useRouter();
  const [fatal, setFatal] = useState<string | null>(null);

  /**
   * Home-screen menu taps, including the one that cold-launched the app.
   *
   * Handled here rather than through the package's `useQuickActionRouting`,
   * which its own source warns against using in a root layout, and which would
   * hand an https href to the router. A feedback row opens Safari; it is not a
   * route.
   *
   * Suppressed mid-onboarding: someone halfway through setup who taps "Try Pro
   * free" has no plan to buy Pro for yet, and dropping them on a paywall
   * abandons a half-written car.
   */
  const onQuickAction = useCallback(
    (action: QuickActions.Action) => {
      if (!isOnboarded()) return;
      if (action.id === QUICK_ACTION_FEEDBACK) void openFeedback();
      else if (action.id === QUICK_ACTION_TRIAL) router.navigate("/trial");
    },
    [router]
  );

  useQuickActionCallback(onQuickAction);

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
    // Weakest of the happiness signals and forgotten within a day. It is here
    // so that coming back repeatedly counts for something, never so that it
    // can trigger an ask on its own.
    recordReviewEvent("app_open");
    rescheduleAll().catch(() => {});

    // Stamped on every launch, and the value it hands back is the previous
    // one — the only measure of an absence the app has.
    const previousOpen = recordOpen();

    if (!isOnboarded()) {
      // Validated, not trusted: the persisted step names a screen that a
      // previous version of the app may have shipped and this one does not,
      // and redirecting to a route that no longer exists is a blank screen on
      // every launch with nothing the user can do about it.
      const step = resumeRoute(getOnboardingStep());
      router.replace(`/onboarding/${step}` as Parameters<typeof router.replace>[0]);
      return;
    }

    // Both answers are network-bound, so the garage renders first and the
    // win-back replaces it a beat later if it applies. Blocking the launch on
    // the store would mean a user with no signal staring at nothing. The same
    // pair decides whether the home-screen menu should be offering a trial.
    const lastShownAt = getWinbackShownAt();
    Promise.all([isPro(), hasOffering(DISCOUNT_OFFERING)])
      .then(([pro, hasOffer]) => {
        void syncQuickActions(!pro && hasOffer);

        // A launch that came from the menu is a launch with a destination. The
        // win-back would replace it with a screen the user did not ask for,
        // and its cooldown would then swallow the one chance to show it.
        if (QuickActions.initial) return;

        const due = shouldOfferWinback({
          lastOpenAt: previousOpen,
          lastShownAt,
          now: new Date(),
          isPro: pro,
          hasOffer,
        });
        if (due) router.replace("/winback");
      })
      .catch(() => {
        // No store, no offer to make. The garage is already on screen.
      });
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
          Nothing was deleted, and the database was restored to its last good state. Reopen the app.
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
        {/* The onboarding group owns its whole screen. Without this entry the
            root stack gave it a default header: the route name "onboarding"
            printed across the top, and a back chevron beside it that popped the
            entire group and dropped the user into the garage mid-setup —
            "finished" as far as the app was concerned, with a half-filled car
            already written. Onboarding now exits only through its last step. */}
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        {/* Both are arrived at by replacing whatever was on screen, so there
            is nothing behind them to swipe back to and no header worth
            hanging a chevron in. They print their own titles, or in the case
            of `trial` nothing at all — it is a native paywall on a blank
            housing, not a page. */}
        <Stack.Screen name="winback" options={{ headerShown: false }} />
        <Stack.Screen name="trial" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings", headerTitle: "" }} />
        <Stack.Screen name="intervals" options={{ title: "Service intervals", headerTitle: "" }} />
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
