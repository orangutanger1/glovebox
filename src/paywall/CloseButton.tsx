import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import { tokens } from "../design/tokens";
import { t } from "../i18n";

/**
 * The paywall's way out: a small ringed ✕ in the header's far corner.
 *
 * `delayMs` holds it back. The onboarding paywall used to print "Not now"
 * under the buy button, which is the first thing a reader scanning for an
 * exit finds and the last thing a screen asking for money should hand them
 * before they have read it. Now the screen opens with no exit drawn, and the
 * close fades in after a few seconds in the corner where a reader who has
 * decided to leave will look for it anyway. It is never withheld longer than
 * that: an exit that does not come is a screen the user force-quits, and a
 * force-quit is not a decline the funnel gets to count.
 *
 * Until it appears it is not on the tree at all, so it cannot be tapped by
 * accident or found by a screen reader before it is visible.
 */
export function CloseButton({
  onPress,
  disabled,
  delayMs = 0,
}: {
  onPress: () => void;
  disabled?: boolean;
  delayMs?: number;
}) {
  const [shown, setShown] = useState(delayMs === 0);
  const opacity = useRef(new Animated.Value(delayMs === 0 ? 1 : 0)).current;

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!shown || delayMs === 0) return;
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [shown, delayMs, opacity]);

  if (!shown) return null;

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t("paywall.close")}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: tokens.color.surfaceHi,
          borderWidth: 1,
          borderColor: tokens.color.hairline,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: tokens.color.text, fontSize: 16, lineHeight: 18 }}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}
