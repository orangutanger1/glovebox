import type { ReactNode } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StepLamps } from "../design/StepLamps";
import { tokens } from "../design/tokens";
import { setOnboardingStep } from ".";

/** Welcome is the hook and sits outside the count; these are the five steps
 *  that ask the user for something. */
export const ONBOARDING_STEPS = 5;

/** The flow in order, welcome first. Step N's screen is `FLOW[N]`, so the
 *  screen behind it is `FLOW[N - 1]` — the one thing a Back control needs. */
const FLOW = ["welcome", "vehicle", "odometer", "service", "ready", "reminders"];

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
 * The header band is a legend and a lamp row, which is the same pairing the
 * gauges use: a small uppercase label naming a value, and the value itself.
 *
 * There is no Skip and no per-step telltale. Skip existed so a user could
 * arrive in the app with a "My car" stub and no mileage — a garage entry that
 * looks broken and that nothing in the app can act on. The glyphs were PNGs
 * decoded per screen, so they popped in a beat after the title had already
 * laid out, which read as a stutter on every single step.
 */
export function OnboardingScreen({
  step,
  title,
  subtitle,
  footer,
  children,
  center = false,
}: {
  step: number;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children?: ReactNode;
  /** Screens with nothing to fill the middle read better optically centred
   *  than pinned under the title. */
  center?: boolean;
}) {
  const router = useRouter();
  const previous = FLOW[step - 1];

  /**
   * The flow was forward-only: a wrong year typed on step 1 could not be
   * corrected from step 2, because gestures are disabled here and no screen
   * drew a back control. The persisted step is rewound too, so quitting after
   * going back reopens the screen the user was actually looking at.
   */
  function onBack() {
    if (!previous) return;
    setOnboardingStep(previous);
    // `back()` keeps the screen behind us alive with its state; `replace` is
    // the fallback for a deep link that made this screen the first one.
    if (router.canGoBack()) router.back();
    else router.replace(`/onboarding/${previous}` as never);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      {/* Every material in this app is lit from above; the flat housing was
          the one surface that was not. The generated radial vignette could not
          be used — it arrived as an opaque JPEG with the falloff inverted — so
          the top light is a gradient in code, which also costs nothing. */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.05)", "transparent"]}
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
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.space.sm,
              minHeight: 28,
            }}
          >
            {previous ? (
              <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
                {({ pressed }) => (
                  <Text
                    style={{
                      ...tokens.text.legend,
                      color: pressed ? tokens.color.white : tokens.color.textMuted,
                    }}
                  >
                    {"‹ Back"}
                  </Text>
                )}
              </Pressable>
            ) : null}
            <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
              {`Step ${step} / ${ONBOARDING_STEPS}`}
            </Text>
            <StepLamps step={step} total={ONBOARDING_STEPS} />
          </View>

          {center ? <View style={{ flex: 1 }} /> : null}

          <View style={{ gap: tokens.space.sm }}>
            <Text style={{ ...tokens.text.hero, color: tokens.color.text }}>{title}</Text>
            {subtitle ? (
              <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{subtitle}</Text>
            ) : null}
          </View>

          {children}

          <View style={{ flex: 1 }} />
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
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
