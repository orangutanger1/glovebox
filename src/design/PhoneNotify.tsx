import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NotifyBanner } from "./NotifyBanner";

/**
 * An iPhone lock screen with a reminder on it, drawn to scale.
 *
 * The soft-ask before it needs the user to picture the thing they are opting
 * into, and the honest picture of a notification is not a card floating on the
 * app's own dark metal — it is the OS's own card, on the OS's own lock screen,
 * the way it actually lands: a rounded handset with a dark wallpaper, the big
 * clock and the date near the top, a dynamic-island pill, and the banner sitting
 * in the lower third where iOS stacks arrivals.
 *
 * The message does not drop in and lift away here. This is not a preview of the
 * event of one notification arriving — that is the plan screen's job — it is a
 * still handset whose single banner cycles through the services it would carry.
 * The service, the body and the timestamp cross-fade in place, so the reader
 * reads "your car's X is due" against a handful of real services rather than
 * watching one animation loop.
 */

export type NotifyRotation = { title: string; body: string; when: string };

/** Long enough to read a two-line banner, short enough that the next service is
 *  worth waiting for. The fade is a quick dissolve, not a transition the eye has
 *  to follow. */
const HOLD_MS = 2600;
const FADE_MS = 320;

/** The handset, in points. Everything inside is laid out against this width so
 *  the mockup scales as one object. */
const WIDTH = 208;
const HEIGHT = WIDTH * 2.06;
const BEZEL = 7;

export function PhoneNotify({
  messages,
  time = "9:41",
  date,
}: {
  messages: NotifyRotation[];
  time?: string;
  date: string;
}) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const count = messages.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % count);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, HOLD_MS);
    return () => clearInterval(timer);
  }, [count, fade]);

  const message = messages[index % Math.max(count, 1)];
  if (!message) return null;

  return (
    <View
      style={{
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 46,
        borderCurve: "continuous",
        backgroundColor: "#000",
        padding: BEZEL,
        // The handset's own drop shadow, lifting it off the housing.
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
        elevation: 16,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 40,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        {/* The wallpaper. A dark graphite gradient, lit from the top, so the
            light system banner reads as sitting over it. */}
        <LinearGradient
          colors={["#2A3340", "#141A22", "#0B0E13"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* The dynamic island. */}
        <View
          style={{
            alignSelf: "center",
            marginTop: 10,
            width: 78,
            height: 24,
            borderRadius: 14,
            backgroundColor: "#000",
          }}
        />

        {/* Date over the clock, the way the lock screen stacks them. */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {date}
          </Text>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 62,
              fontWeight: "700",
              lineHeight: 68,
              letterSpacing: -1,
              fontVariant: ["tabular-nums"],
            }}
          >
            {time}
          </Text>
        </View>

        {/* The banner sits in the lower third, where iOS stacks arrivals. */}
        <View style={{ flex: 1 }} />
        <Animated.View style={{ opacity: fade, paddingHorizontal: 10, marginBottom: 26 }}>
          <NotifyBanner title={message.title} body={message.body} when={message.when} />
        </Animated.View>

        {/* The home indicator. */}
        <View
          style={{
            alignSelf: "center",
            width: 100,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.7)",
            marginBottom: 9,
          }}
        />
      </View>
    </View>
  );
}
