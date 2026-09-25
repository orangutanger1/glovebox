import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, type ErrorBoundaryProps } from "expo-router";
import * as QuickActions from "expo-quick-actions";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { getDb } from "../src/db/client";
import { DISCOUNT_OFFERING, hasOffering, initPurchases, isPro } from "../src/purchases";
import { prefetchPlans } from "../src/purchases/plans";
import {
  flushNow,
  identifyFromPurchases,
  initAnalytics,
  reportFatals,
  track,
} from "../src/analytics";
import { flushCrashes, initCrashReporting, reportCrash } from "../src/crash";
import { rescheduleAll } from "../src/notify";
import { watchNotificationOpens } from "../src/notify/opened";
import { isOnboarded, getOnboardingStep } from "../src/onboarding";
import { assignExperiments } from "../src/experiments";
import { isLocked, resolveGrandfathered } from "../src/paywall";
import { resumeRoute } from "../src/onboarding/flow";
import { recordLaunchAndMaybeAsk } from "../src/review";
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
import { initCurrency } from "../src/money";

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
    // The third channel, and the only one that can name a line: the other two
    // carry a Hermes bytecode offset in release. Same `step` label on all
    // three, so an issue and a row are the same incident.
    reportCrash(`boot:${step}`, e);
    flushNow();
    flushCrashes();
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
    reportCrash("render_error", error);
    flushNow();
    flushCrashes();
  }, [error]);

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
      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
        {error.message}
      </Text>
      <Pressable onPress={() => void retry()} hitSlop={12}>
        <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
          {t("layout.fatal.retry")}
        </Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [fatal, setFatal] = useState<string | null>(null);
  // Set synchronously beside `setFatal`: the quick-action hook delivers the
  // launch action in its own mount effect, in the same commit as the boot
  // effect, before the state above has re-rendered.
  const dead = useRef(false);
  // Set when a notification tap routed somewhere this launch. That launch has
  // a destination, the same as a quick action, and the win-back must not
  // replace it.
  const openedFromNotification = useRef(false);
  // Bumped when the language or the unit changes, and used as the tree's key:
  // every screen then rebuilds its sentences instead of keeping the ones it
  // formatted in the previous language.
  const [localeEpoch, setLocaleEpoch] = useState(0);

  useEffect(() => subscribeLocaleChanged(() => setLocaleEpoch((n) => n + 1)), []);


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
      // Before `reportFatals`, so the SDK's own global handler is underneath
      // ours and a fatal reaches both: the chain is called outward, and the
      // handler installed last is the one that runs first.
      initCrashReporting();
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
      reportCrash("boot:database", e);
      flushNow();
      flushCrashes();
      dead.current = true;
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
    // Same shape as the unit, and read into memory for the same reason: every
    // cost on the insights screen formats through it.
    boot("currency", initCurrency);
    boot("purchases", initPurchases);
    // Prices in hand before any paywall mounts. The sheet this replaced
    // fetched on the tap and took a median 3.5 s to appear.
    boot("plans", prefetchPlans);
    boot("identify", () => void identifyFromPurchases().catch(() => {}));
    boot("notifications", () => void rescheduleAll().catch(() => {}));
    // Taps on reminders and resume nudges, including the one that launched us.
    // Never unsubscribed: the root layout lives as long as the process.
    //
    // A tap on a check-in or a document reminder carries the screen it is
    // about. Only for a finished install: mid-onboarding there is no garage to
    // land in, and the redirect below owns the first screen.
    boot("notification_opens", () =>
      watchNotificationOpens((url) => {
        if (!isOnboarded()) return;
        openedFromNotification.current = true;
        router.push(url as Parameters<typeof router.push>[0]);
      })
    );

    // Stamped on every launch, and the value it hands back is the previous
    // one — the only measure of an absence the app has.
    const previousOpen = boot("open", recordOpen) ?? null;

    const onboarded = isOnboarded();

    // Counts the launch (a weak happiness signal too) and, on the third,
    // fifth and tenth, asks for a rating ten seconds in.
    boot("review", () => recordLaunchAndMaybeAsk(onboarded));

    // The coin is tossed once, for a fresh install only, before anything
    // routes on it: `resumeRoute` below reads the variant to decide which
    // screens exist. An install already mid-flow or finished keeps the flow
    // it started on and reports "unassigned". `boot` swallows a throw, and
    // an install that could not be assigned is on the control flow.
    boot("experiments", () => assignExperiments(!onboarded && getOnboardingStep() === null));

    // Stamped before anything can route on it, and only ever written once. An
    // install that had already finished onboarding when this build first ran
    // did so under a build that promised a free tier, and keeps it; everyone
    // else meets the wall. Doing this later — on the first wall, say — would
    // hand the decision to whichever screen happened to ask first on a launch
    // with no network.
    //
    // A failure here falls open. `boot` swallows the throw and hands back
    // undefined, and the only reasonable reading of "the database would not
    // answer" is that this user keeps their app: walling someone because a
    // write failed is the one outcome worth more than the subscription.
    const grandfathered = boot("grandfather", () => resolveGrandfathered(onboarded)) ?? true;

    if (!onboarded) {
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
        // `null` is a store that could not answer, and everything below reads
        // it the same way: no wall, no trial in the menu, no win-back. Each of
        // those is an ask, and an ask made of someone who may already be paying
        // is the one mistake worth more than the sale.
        void syncQuickActions(pro === false && hasOffer);

        // The wall, for a user who has no entitlement and was never promised a
        // free app. It comes before the win-back on purpose: both are launch
        // interruptions, and offering a lapsed subscriber "one more go" on top
        // of a screen they cannot get past is two asks stacked on one launch.
        //
        // Asked here rather than on every screen because the answer is only
        // ever "yes" at launch: a purchase made anywhere in the app replaces
        // this route, and a subscription cancelled inside Customer Center
        // keeps its entitlement until the period it was paid for runs out.
        if (isLocked({ isPro: pro, grandfathered, isOnboarded: true })) {
          router.replace("/onboarding/offer?walled=1");
          return;
        }

        // A launch that came from the menu is a launch with a destination. The
        // win-back would replace it with a screen the user did not ask for,
        // and its cooldown would then swallow the one chance to show it.
        if (QuickActions.initial || openedFromNotification.current) return;

        const due = shouldOfferWinback({
          lastOpenAt: previousOpen,
          lastShownAt,
          now: new Date(),
          isPro: pro !== false,
          hasOffer,
        });
        if (due) router.replace("/winback");
      })
      .catch(() => {
        // No store, no offer to make. The garage is already on screen.
      });
  }, []);

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
   *
   * Declared after the boot effect, and that order matters: effects run in
   * declaration order, and this one calls `isOnboarded()`, which opens the
   * database. Declared first, a cold launch from the menu ran the migration
   * here — outside `boot()` and the database try/catch — so a failed migration
   * on that launch was an uncaught throw rather than the fatal notice.
   */
  const onQuickAction = useCallback(
    (action: QuickActions.Action) => {
      // `isOnboarded` reads the database, and a database the boot effect
      // could not open throws again here. The failure is already reported
      // once; a menu tap is worth neither a second crash nor a second
      // `boot_failed` for the same incident. A ref, not `fatal`: the launch
      // action arrives before that state has re-rendered.
      if (dead.current) return;
      const onboarded = boot("quickaction", isOnboarded);
      if (!onboarded) return;
      track("quick_action", { action: action.id });
      if (action.id === QUICK_ACTION_FEEDBACK) void openFeedback();
      else if (action.id === QUICK_ACTION_TRIAL) router.navigate("/trial");
    },
    [router]
  );

  useQuickActionCallback(onQuickAction);

  // A dead database may not return early from here.
  //
  // This function is the root layout, which expo-router renders as the only
  // screen of its own root navigator (`Content` in ExpoRoot) — so whatever it
  // returns either contains the app's `<Stack>` or the app has no navigator at
  // all. Returning `null` while something resolves, which is what 1.1.0
  // shipped for the font load and 1.0.2 never did, left the router with a route
  // to render and nowhere to render it on **every cold launch**: the root slot
  // re-dispatched navigation state against a layout that mounts no navigator
  // until React gave up with "Maximum update depth exceeded". That throw
  // happens inside the commit driven from the C++ scheduler, so it reaches
  // `RCTFatal` rather than `ErrorUtils` — past every JavaScript `try`/`catch`
  // and error boundary — and under expo-updates the process aborts half a
  // second into launch with a crash report naming only
  // `ErrorRecovery.crash()`. Builds 17 through 20.
  //
  // The fatal state is drawn as an overlay over a mounted `<Stack>` instead.
  // Same pixels, no unmounted navigator.
  return <Chrome localeEpoch={localeEpoch} fatal={fatal} />;
}

/**
 * The database is gone and no screen can be trusted. Absolutely positioned
 * above the stack, opaque, and it swallows taps: the tree below it is mounted
 * but must not be reachable.
 */
function FatalNotice({ detail }: { detail: string }) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: tokens.color.housing,
        alignItems: "center",
        justifyContent: "center",
        padding: tokens.space.xl,
        gap: tokens.space.md,
      }}
    >
      <Text style={{ ...tokens.text.heading, color: tokens.color.text, textAlign: "center" }}>
        {t("layout.fatal.title")}
      </Text>
      <Text style={{ ...tokens.text.body, color: tokens.color.textMuted, textAlign: "center" }}>
        {t("layout.fatal.body")}
      </Text>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
        {detail}
      </Text>
    </View>
  );
}

/**
 * The stack and its header chrome.
 *
 * `localeEpoch` is passed down because it is the tree's key; the router is
 * re-read rather than threaded, since `useRouter` is a hook and this is a
 * component.
 *
 * `fatal` is drawn over the stack rather than in place of it. See the note in
 * `RootLayout` for why nothing may take the navigator's place.
 */
function Chrome({ localeEpoch, fatal }: { localeEpoch: number; fatal: string | null }) {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        key={localeEpoch}
        screenOptions={{
          headerStyle: { backgroundColor: tokens.color.housing },
          headerTintColor: tokens.color.text,
          headerTitleStyle: { ...tokens.text.body, fontWeight: "600", color: tokens.color.text },
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
        {/* Every feature gate awaits this route through `openPaywall`; a full
            screen modal reads as the sheet it replaced, without the header
            or swipe-back a normal push would add. */}
        <Stack.Screen
          name="paywall"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        {/* No header, no back and no swipe. Being unable to leave without
            subscribing or restoring is what this screen is; a gesture out of
            it would drop the user into the garage it exists to close. */}
        <Stack.Screen name="trial" options={{ headerShown: false }} />
        {/* No header and no back: onboarding has already been completed by the
            time this mounts, so there is nothing behind it to return to. */}
        <Stack.Screen name="subscribed" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="catchup" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ title: t("layout.settings"), headerTitle: "" }} />
        <Stack.Screen name="intervals" options={{ title: t("layout.intervals"), headerTitle: "" }} />
        {/* Titled from the screen's own fragment rather than a `layout.*` key:
            the header and the h1 are the same word, and a second key for it is
            a second thing to translate and to let drift. */}
        <Stack.Screen name="insights" options={{ title: t("insights.title"), headerTitle: "" }} />
        <Stack.Screen name="language" options={{ title: t("language.title"), headerTitle: "" }} />
        <Stack.Screen name="vehicle/new" options={{ title: t("layout.addVehicle"), headerTitle: "" }} />
        {/* The one screen with no body title: it names the vehicle in the
            header instead, set from the row in the screen itself. */}
        <Stack.Screen name="vehicle/[id]" options={{ title: t("layout.vehicle") }} />
        <Stack.Screen
          name="vehicle/[id]/log"
          options={{ title: t("layout.logService"), headerTitle: "" }}
        />
        {/* Titled from the vehicle fragment for the same reason the fuel
            routes are: the header and the screen's own h1 say the same three
            words, and a `layout.*` twin of each is a second thing to keep in
            eleven languages. Blank header title because the body prints one. */}
        <Stack.Screen
          name="vehicle/[id]/edit"
          options={{ title: t("vehicle.edit.title"), headerTitle: "" }}
        />
        {/* Both fuel routes were missing from this list, and a route with no
            entry here gets no title at all — so the header printed the route
            pattern instead, which is how "vehicle/[id]/fuel/new" came to be the
            heading over Log fuel. Titled from the fuel fragment rather than new
            `layout.*` keys: the header and the screen's own h1 are the same
            words, and a second key for each is a second thing to translate.

            The form blanks its header title because it prints one in the body;
            the history does not print one, so its header keeps the text. */}
        <Stack.Screen
          name="vehicle/[id]/fuel/index"
          options={{ title: t("fuel.history.title") }}
        />
        <Stack.Screen
          name="vehicle/[id]/fuel/new"
          options={{ title: t("fuel.form.title"), headerTitle: "" }}
        />
        {/* Both print their own title in the body, like the other forms. */}
        <Stack.Screen
          name="vehicle/[id]/document"
          options={{ title: t("documents.form.title"), headerTitle: "" }}
        />
        <Stack.Screen name="checkin" options={{ title: t("checkin.title"), headerTitle: "" }} />
      </Stack>
      {fatal !== null && <FatalNotice detail={fatal} />}
    </GestureHandlerRootView>
  );
}
