import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StepLamps } from "../design/StepLamps";
import { useTheme } from "../design/theme";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import { setOnboardingStep } from ".";
import { track } from "../analytics";
import { previousRoute, quizStep, type OnboardingRoute } from "./flow";

/**
 * The frame every onboarding screen after the hook is built in.
 *
 * Before this existed each screen laid itself out by hand, and they disagreed:
 * welcome padded `xl` while the rest padded `md`, Skip was top-right on three
 * screens and absent on two, and the title landed at a different height every
 * time — so the flow flickered between layouts instead of feeling like one
 * object being stepped through. Every screen now gets the same gutter, the
 * same header band, the same title position and the same footer.
 *
 * The screen names its own route rather than its index. It is the only thing
 * it can know for certain about itself, and everything else — where Back goes,
 * whether this is a quiz question and which one — is derived from the flow
 * array. Reordering the flow used to mean renumbering every screen in it.
 *
 * Progress is shown on the quiz and nowhere else. The six questions are steps,
 * and a step count is the difference between an interview and an interrogation.
 * The screens after them are a read-through: putting "11 / 17" above a finding
 * about the user's own car invites them to measure how much is left rather
 * than read it, and there is nothing to measure anyway, since the flow can end
 * at the paywall.
 *
 * `subtitle` is the only muted line a screen may print, it is one short
 * sentence, and most screens pass none. Grey-on-black is the housing's own
 * colour, so a second grey paragraph under the component reads as disabled
 * text rather than as help, and a question that needs two sentences of it is
 * a question that needs rewriting.
 *
 * There is no Skip, and no screen has a way past its question. Skip existed
 * so a user could arrive in the app with a "My car" stub and no mileage — a
 * garage entry that looks broken and that nothing in the app can act on.
 */
export function OnboardingScreen({
  route,
  title,
  subtitle,
  legend,
  footer,
  gateTimeoutMs,
  children,
  center = false,
  tone = "housing",
  onBack,
  banner,
}: {
  route: OnboardingRoute;
  title?: string;
  subtitle?: string;
  /** Overrides the quiz counter. Used by the paged symptoms screen. */
  legend?: ReactNode;
  /** A function instead of a node gates the footer on reading: it is called
   *  with `atBottom`, which is false until the user has scrolled to the end of
   *  the content (and true from the start when there is nothing to scroll),
   *  and `unlocked`, which is `atBottom` or the nudge timeout having elapsed. */
  footer?: ReactNode | ((state: { atBottom: boolean; unlocked: boolean }) => ReactNode);
  /**
   * How long a gated screen stays shut before it opens anyway, in ms.
   *
   * Opt-in per screen rather than global, and the whole reason it exists is
   * that the gate was a blocker. A user who has decided is not persuaded by a
   * dead button; they are taught that the app argues with taps. The label
   * still asks for the scroll after this elapses, so the affordance survives
   * and only the refusal goes away.
   */
  gateTimeoutMs?: number;
  children?: ReactNode;
  /** Screens with nothing to fill the middle read better optically centred
   *  than pinned under the title. */
  center?: boolean;
  /** `alarm` washes the housing red. Reserved for the symptoms screens, which
   *  are the app's only sustained warning state. */
  tone?: "housing" | "alarm";
  /** Handles Back inside the screen instead of leaving it. The symptoms pager
   *  is three cards on one route, and a Back that abandoned all three because
   *  the user wanted to re-read the first is a Back the user stops pressing. */
  onBack?: () => void;
  /** A node dropped over the very top of the screen, above the content and
   *  outside the scroll — where iOS delivers a notification banner. Non-
   *  interactive: it never intercepts the scroll or a tap beneath it. */
  banner?: ReactNode;
}) {
  const c = useTheme();

  const router = useRouter();
  const previous = previousRoute(route);
  const quiz = quizStep(route);

  // One event per screen arrival, emitted from the frame rather than from each
  // of the eighteen screens: the funnel has to stay complete when a screen is
  // added, and it will not if adding one means remembering to instrument it.
  // `route` is the only identity a screen knows about itself, which is exactly
  // what the funnel needs to order its steps.
  useEffect(() => {
    track("onboarding_step_viewed", { route, quiz_step: quiz?.step ?? null });
  }, [route, quiz?.step]);

  /**
   * Whether the content has been read to the end. Only wired up for a screen
   * that asks for it, so every other screen keeps a scroll handler-free
   * ScrollView.
   *
   * A gated screen starts closed and is opened by the first measurement, which
   * arrives with the first layout. Starting open would leave the control live
   * for the frames before anything has been measured, which is exactly the tap
   * an impatient user gets in first.
   */
  const gated = typeof footer === "function";
  const [atBottom, setAtBottom] = useState(!gated);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const offsetY = useRef(0);

  /**
   * The nudge. A gated screen that has been on the glass for `gateTimeoutMs`
   * stops refusing, whether or not the content was scrolled.
   *
   * The gate was written to stop a user tapping past an argument they had not
   * read. What it actually did was hand the most impatient users a dead
   * control at the exact moment the flow was asking them for trust, which
   * costs more than the paragraph it protected. The timer only ever unlocks:
   * `atBottom` is still reported separately, so the button can go on asking
   * for the scroll while no longer standing in the way of it.
   */
  const [nudged, setNudged] = useState(false);
  useEffect(() => {
    if (!gated || gateTimeoutMs === undefined) return;
    const timer = setTimeout(() => setNudged(true), gateTimeoutMs);
    return () => clearTimeout(timer);
  }, [gated, gateTimeoutMs]);

  // A tolerance is required in both directions: content one pixel taller than
  // the viewport is not something to scroll, and iOS rubber-banding means the
  // final offset is rarely exactly the bottom. Nothing is decided until both
  // heights are in, or the half-measured state (a viewport and no content)
  // reads as "there is nothing to scroll" and opens the gate immediately.
  const settle = useCallback(() => {
    if (contentHeight.current === 0 || viewportHeight.current === 0) return;
    const room = contentHeight.current - viewportHeight.current;
    setAtBottom(room <= 8 || offsetY.current >= room - 24);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      offsetY.current = contentOffset.y;
      contentHeight.current = contentSize.height;
      viewportHeight.current = layoutMeasurement.height;
      settle();
    },
    [settle]
  );

  const onScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.current = event.nativeEvent.layout.height;
      settle();
    },
    [settle]
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.current = height;
      settle();
    },
    [settle]
  );

  /**
   * The flow was forward-only: a wrong year typed on step 1 could not be
   * corrected from step 2, because gestures are disabled here and no screen
   * drew a back control. The persisted step is rewound too, so quitting after
   * going back reopens the screen the user was actually looking at.
   */
  function goBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (!previous) return;
    setOnboardingStep(previous);
    // `back()` keeps the screen behind us alive with its state; `replace` is
    // the fallback for a deep link that made this screen the first one.
    if (router.canGoBack()) router.back();
    else router.replace(`/onboarding/${previous}` as never);
  }

  // The title, the screen's own content, and the space around them.
  const body = (
    <>
      {center ? <View style={{ flex: 1 }} /> : null}

      {title || subtitle ? (
        <View style={{ gap: tokens.space.sm }}>
          {title ? (
            <Text style={{ ...tokens.text.hero, color: c.ink }}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={{ ...tokens.text.body, color: c.inkMuted }}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}

      {children}

      <View style={{ flex: 1 }} />
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.base }}>
      {/* Every material in this app is lit from above; the flat housing was
          the one surface that was not. The generated radial vignette could not
          be used — it arrived as an opaque JPEG with the falloff inverted — so
          the top light is a gradient in code, which also costs nothing. */}
      <LinearGradient
        pointerEvents="none"
        colors={
          tone === "alarm"
            ? [c.overdueWash, "transparent"]
            : [c.card, "transparent"]
        }
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: tokens.space.lg,
            paddingTop: tokens.space.md,
            gap: tokens.space.lg,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={gated ? onScroll : undefined}
          onLayout={gated ? onScrollLayout : undefined}
          onContentSizeChange={gated ? onContentSizeChange : undefined}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.space.sm,
              minHeight: 28,
            }}
          >
            {previous || onBack ? (
              <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button">
                {({ pressed }) => (
                  <Text
                    style={{
                      ...tokens.text.caption,
                      color: pressed ? c.ink : c.inkMuted,
                    }}
                  >
                    {`‹ ${t("onboardingC.back")}`}
                  </Text>
                )}
              </Pressable>
            ) : null}
            {legend ?? (
              quiz ? (
                <>
                  <Text style={{ ...tokens.text.caption, color: c.inkFaint }}>
                    {t("onboardingC.question", { step: quiz.step, total: quiz.total })}
                  </Text>
                  <StepLamps step={quiz.step} total={quiz.total} />
                </>
              ) : null
            )}
          </View>

          {body}
        </ScrollView>

        {footer ? (
          <View
            style={{
              paddingHorizontal: tokens.space.lg,
              paddingTop: tokens.space.md,
              paddingBottom: tokens.space.sm,
              gap: tokens.space.sm,
            }}
          >
            {gated
              ? (footer as (state: { atBottom: boolean; unlocked: boolean }) => ReactNode)({
                  atBottom,
                  unlocked: atBottom || nudged,
                })
              : footer}
          </View>
        ) : null}
        {banner ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              paddingHorizontal: tokens.space.md,
              paddingTop: tokens.space.sm,
            }}
          >
            {banner}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
