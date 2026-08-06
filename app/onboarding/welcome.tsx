import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { useAdvance } from "../../src/onboarding/nav";
import { t } from "../../src/i18n";

const LIGHT = require("../../assets/onboarding/light.jpeg");
const LIGHT_RATIO = 1242 / 1663;

export default function Welcome() {
  const advance = useAdvance("welcome");
  // One driver. The cluster bulb-check flash used to run here and read as a
  // rendering fault rather than an ignition: a red bloom that appears, dies,
  // and appears again inside the first second is indistinguishable from a bug.
  const content = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(content, {
      toValue: 1,
      duration: 520,
      delay: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [content]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      {/* Full width, own aspect ratio, pinned to the top. Stretched to fill the
          screen instead, `cover` crops about a third off each side of a phone —
          and what it crops is exactly where the trail sweeps out of frame, which
          is the whole composition. The photograph is black at its edges, so the
          bottom of it and the housing are the same colour: no seam to hide. */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, aspectRatio: LIGHT_RATIO }}
      >
        <Image
          source={LIGHT}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        {/* The copy has to land on black, not on a highlight, or the headline
            fights the brightest part of the trail for the same pixels. */}
        <LinearGradient
          colors={["transparent", "rgba(15,17,19,0.85)", tokens.color.housing]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "45%" }}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <View style={{ flex: 1 }} />
        <Animated.View
          style={{
            paddingHorizontal: tokens.space.lg,
            paddingBottom: tokens.space.sm,
            gap: tokens.space.lg,
            opacity: content,
            transform: [
              { translateY: content.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          }}
        >
          {/* Bigger than `hero`: this is the one line on the one screen whose
              whole job is to land the problem before anything is asked. The
              "Glovebox" legend above it is gone — it named the app to someone
              who had just tapped its icon, and cost the headline its air. */}
          <Text
            style={{
              ...tokens.text.hero,
              fontSize: 38,
              lineHeight: 43,
              color: tokens.color.text,
            }}
          >
            {t("onboardingA.welcome.headline")}
          </Text>

          <View style={{ gap: tokens.space.sm }}>
            <Button label={t("onboardingA.welcome.start")} onPress={advance} />
            {/* Demoted from the headline slot: it answers an objection the
                user has not formed yet on the first screen. */}
            <Text
              style={{
                ...tokens.text.caption,
                color: tokens.color.textFaint,
                textAlign: "center",
              }}
            >
              {t("onboardingA.welcome.privacy")}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
