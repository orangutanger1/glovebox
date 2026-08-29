import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, type ErrorBoundaryProps } from "expo-router";
import * as QuickActions from "expo-quick-actions";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { getDb } from "../src/db/client";
import { DISCOUNT_OFFERING, hasOffering, initPurchases, isPro } from "../src/purchases";
import {
  flushNow,
  identifyFromPurchases,
  initAnalytics,
  reportFatals,
  track,
} from "../src/analytics";
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
import { LIGHT } from "../src/design/palette";
import { ThemeProvider, useTheme } from "../src/design/theme";
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

/**
 * One step of the launch sequence, which reports its own failure instead of
 * ending the process.
 *
 * Everything in the boot effect is a side effect the app wants and no single
 * one of them is worth a launch. Unguarded, a throw in any of them is an
 * `RCTFatal`, and under `expo-updates` that is not even a termination the user
 * can describe: error recovery looks for a remote update, finds none for this
 * runtime version and aborts the process, so the iOS crash report names
 * `ErrorRecovery.crash()` and nothing about the JavaScript. A degraded launch —
 * no reminders rescheduled, no store, wrong language — is a bug report. A
 * launch that aborts in 470ms is a guessing game.
 *
 * The step's name is the payload: `boot_failed` with `step` says which one
 * without needing a stack to survive.
 */
function boot<T>(step: string, run: () => T): T | undefined {
  try {
    return run();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = (e instanceof Error ? (e.stack ?? "") : "").slice(0, 4000);
    // Both channels, because they fail differently: the SDK's queue survives
    // the process and arrives late, the raw POST is on the wire now and is
    // lost if there is no network. A launch failure is worth two attempts.
    reportRaw("boot_failed", { step, message, stack });
    track("boot_failed", { step, message, stack });
    flushNow();
    return undefined;
  }
}

/**
 * The bootstrap entry's POST, when the app is running under it.
 *
 * `index.js` hangs it on the global rather than exporting it: this module is
 * loaded by the graph that entry file requires, so an import would be a cycle,
 * and under jest or web there is no entry file at all.
 */
function reportRaw(event: string, properties: Record<string, unknown>): void {
  const send = (globalThis as { __wrenchyReport?: (e: string, p: unknown) => void })
    .__wrenchyReport;
  if (typeof send === "function") send(event, properties);
}

/**
 * A render-time throw, on the screen instead of in a crash report.
 *
 * expo-router renders this in place of the tree when a route throws while
 * rendering, which is the other half of the launch-crash problem: the global
 * handler above catches what the boot effect throws, and this catches what the
 * first screen throws. Both paths now end in a sentence the user can read back.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    const detail = { message: error.message, stack: (error.stack ?? "").slice(0, 4000) };
    reportRaw("render_error", detail);
    track("render_error", detail);
    flushNow();
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: LIGHT.base,
        alignItems: "center",
        justifyContent: "center",
        padding: tokens.space.xl,
        gap: tokens.space.md,
      }}
    >
      <StatusBar style="dark" />
      <Text style={{ ...tokens.text.heading, color: LIGHT.ink, textAlign: "center" }}>
        {t("layout.fatal.title")}
      </Text>
      <Text style={{ ...tokens.text.caption, color: LIGHT.inkFaint, textAlign: "center" }}>
        {error.message}
      </Text>
      <Pressable onPress={() => void retry()} hitSlop={12}>
        <Text style={{ ...tokens.text.body, color: LIGHT.ink }}>{t("layout.fatal.retry")}</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [fatal, setFatal] = useState<string | null>(null);
  // Bumped when the language or the unit changes, and used as the tree's key:
  // every screen then rebuilds its sentences instead of keeping the ones it
  // formatted in the previous language.
  const [localeEpoch, setLocaleEpoch] = useState(0);

  // The app renders either way: a font that fails to load must not hold the
  // splash screen, so `error` is read rather than ignored.
  const [fontsLoaded, fontError] = useFonts({
    "InstrumentSans-SemiBold": require("../assets/fonts/InstrumentSans-SemiBold.ttf"),
    "InstrumentSans-Bold": require("../assets/fonts/InstrumentSans-Bold.ttf"),
  });
  const fontsSettled = fontsLoaded || fontError !== null;

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
    // First, before anything that can throw. Neither call needs the database or
    // the store: PostHog keys its own anonymous id and `identifyFromPurchases`
    // joins it to RevenueCat later. Ordering them after `initPurchases`, which
    // is what shipped, meant a throw anywhere earlier in this effect killed the
    // launch with no handler installed and no client to report it — a crash
    // nobody would ever see the stack for, which is precisely what 1.1.0 (17)
    // did on TestFlight.
    boot("analytics", () => {
      initAnalytics();
      reportFatals();
    });

    try {
      getDb();
    } catch (e) {
      // A migration failure already rolled the file back. Say so instead of
      // rendering an empty screen the user can only read as "my records
      // are gone".
      reportRaw("boot_failed", { step: "database", message: String(e) });
      track("boot_failed", { step: "database", message: String(e) });
      flushNow();
      setFatal(String(e));
      return;
    }

    // Both settings live in the database, so this is the first moment either
    // can be honoured. The unit is read into memory here so no gauge has to
    // touch SQLite while it renders; the language only forces a remount when
    // the stored choice disagrees with the phone's, which is the one case where
    // strings are already on the glass in the wrong language.
    boot("language", () => {
      const fromPhone = getLanguage();
      if (bootLanguage() !== fromPhone) setLocaleEpoch((n) => n + 1);
    });
    boot("units", initDistanceUnit);
    boot("purchases", initPurchases);
    boot("identify", () => void identifyFromPurchases().catch(() => {}));
    // Weakest of the happiness signals and forgotten within a day. It is here
    // so that coming back repeatedly counts for something, never so that it
    // can trigger an ask on its own.
    boot("review", () => recordReviewEvent("app_open"));
    boot("notifications", () => void rescheduleAll().catch(() => {}));

    // Stamped on every launch, and the value it hands back is the previous
    // one — the only measure of an absence the app has.
    const previousOpen = boot("open", recordOpen) ?? null;

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

  // Neither the font load nor a dead database may return early from here.
  //
  // This function is the root layout, which expo-router renders as the only
  // screen of its own root navigator (`Content` in ExpoRoot) — so whatever it
  // returns either contains the app's `<Stack>` or the app has no navigator at
  // all. Returning `null` while the fonts resolve, which is what 1.1.0 shipped
  // and 1.0.2 never did, left the router with a route to render and nowhere to
  // render it on **every cold launch**: the root slot re-dispatched navigation
  // state against a layout that mounts no navigator until React gave up with
  // "Maximum update depth exceeded". That throw happens inside the commit
  // driven from the C++ scheduler, so it reaches `RCTFatal` rather than
  // `ErrorUtils` — past every JavaScript `try`/`catch` and error boundary —
  // and under expo-updates the process aborts half a second into launch with a
  // crash report naming only `ErrorRecovery.crash()`. Builds 17 through 20.
  //
  // Both states are drawn as overlays over a mounted `<Stack>` instead. Same
  // pixels, no unmounted navigator.
  return (
    <ThemeProvider>
      <Chrome localeEpoch={localeEpoch} fatal={fatal} ready={fontsSettled} />
    </ThemeProvider>
  );
}

/**
 * The database is gone and no screen can be trusted. Absolutely positioned
 * above the stack, opaque, and it swallows taps: the tree below it is mounted
 * but must not be reachable.
 */
function FatalNotice({ detail }: { detail: string }) {
  const c = useTheme();

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: c.base,
        alignItems: "center",
        justifyContent: "center",
        padding: tokens.space.xl,
        gap: tokens.space.md,
      }}
    >
      <Text style={{ ...tokens.text.heading, color: c.ink, textAlign: "center" }}>
        {t("layout.fatal.title")}
      </Text>
      <Text style={{ ...tokens.text.body, color: c.inkMuted, textAlign: "center" }}>
        {t("layout.fatal.body")}
      </Text>
      <Text style={{ ...tokens.text.caption, color: c.inkFaint, textAlign: "center" }}>
        {detail}
      </Text>
    </View>
  );
}

/**
 * Everything the palette touches, one node below the provider.
 *
 * `RootLayout` renders `ThemeProvider`, so a `useTheme()` call up there reads
 * the context default rather than the chosen palette — every header would be
 * light-themed on a dark phone. Splitting the tree here is what makes the
 * status bar and the stack's header and content colours actually follow the
 * theme. `localeEpoch` is passed down because it is the tree's key; the router
 * is re-read rather than threaded, since `useRouter` is a hook and this is a
 * component.
 *
 * `ready` and `fatal` are drawn over the stack rather than in place of it. See
 * the note in `RootLayout` for why nothing may take the navigator's place.
 */
function Chrome({
  localeEpoch,
  fatal,
  ready,
}: {
  localeEpoch: number;
  fatal: string | null;
  ready: boolean;
}) {
  const c = useTheme();
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Inverted on purpose: a dark palette needs light glyphs. */}
      <StatusBar style={c.blurTint === "dark" ? "light" : "dark"} />
      <Stack
        key={localeEpoch}
        screenOptions={{
          headerStyle: { backgroundColor: c.base },
          headerTintColor: c.ink,
          headerTitleStyle: { ...tokens.text.heading, fontSize: 17, color: c.ink },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.base },
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
                <Text style={{ fontSize: 20, color: c.ink }}>⚙︎</Text>
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
      {/* The font gate, as a curtain rather than an absence: the type scale
          names two families that are still loading, and a screen that paints
          in the fallback face and reflows a frame later reads as a glitch. */}
      {!ready && fatal === null && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: c.base,
          }}
        />
      )}
      {fatal !== null && <FatalNotice detail={fatal} />}
    </GestureHandlerRootView>
  );
}
