import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import * as QuickActions from "expo-quick-actions";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { getDb } from "../src/db/client";
import { DISCOUNT_OFFERING, hasOffering, initPurchases, isPro } from "../src/purchases";
import { identifyFromPurchases, initAnalytics } from "../src/analytics";
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
import { getLanguage, initLanguage, t } from "../src/i18n";
import { bootLanguage } from "../src/i18n/preference";
import { subscribeLocaleChanged } from "../src/i18n/epoch";
import { initDistanceUnit } from "../src/units";

/**
 * The phone's language, resolved before the first component renders.
 *
 * Module scope rather than an effect because the fatal-database screen and the
 * stack's own titles call `t` during that first render, and a stored preference
 * cannot be read yet — `getDb()` may be about to throw, which is the one case
 * this screen exists for. The preference is applied a moment later in the boot
 * effect, which remounts the tree if it disagrees with the phone.
 */
initLanguage(null);

export default function RootLayout() {
  const router = useRouter();
  const [fatal, setFatal] = useState<string | null>(null);
  // Bumped when the language or the unit changes, and used as the tree's key:
  // every screen then rebuilds its sentences instead of keeping the ones it
  // formatted in the previous language.
  const [localeEpoch, setLocaleEpoch] = useState(0);

  useEffect(() => subscribeLocaleChanged(() => setLocaleEpoch((n) => n + 1)), []);

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

    // Both settings live in the database, so this is the first moment either
    // can be honoured. The unit is read into memory here so no gauge has to
    // touch SQLite while it renders; the language only forces a remount when
    // the stored choice disagrees with the phone's, which is the one case where
    // strings are already on the glass in the wrong language.
    const fromPhone = getLanguage();
    if (bootLanguage() !== fromPhone) setLocaleEpoch((n) => n + 1);
    initDistanceUnit();
    initPurchases();
    // After `initPurchases`, so the RevenueCat app user id exists to key on.
    initAnalytics();
    identifyFromPurchases().catch(() => {});
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
          {t("layout.fatal.title")}
        </Text>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted, textAlign: "center" }}>
          {t("layout.fatal.body")}
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
        key={localeEpoch}
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
            title: t("layout.garage"),
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
        <Stack.Screen name="settings" options={{ title: t("layout.settings"), headerTitle: "" }} />
        <Stack.Screen name="intervals" options={{ title: t("layout.intervals"), headerTitle: "" }} />
        <Stack.Screen name="language" options={{ title: t("language.title"), headerTitle: "" }} />
        <Stack.Screen name="vehicle/new" options={{ title: t("layout.addVehicle"), headerTitle: "" }} />
        {/* The one screen with no body title: it names the vehicle in the
            header instead, set from the row in the screen itself. */}
        <Stack.Screen name="vehicle/[id]" options={{ title: t("layout.vehicle") }} />
        <Stack.Screen
          name="vehicle/[id]/log"
          options={{ title: t("layout.logService"), headerTitle: "" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
