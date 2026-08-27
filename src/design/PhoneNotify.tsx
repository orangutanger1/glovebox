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
 * the way it actually lands: a rounded handset with a dark wallpaper, a status
 * bar (dynamic-island pill centered, signal / wi-fi / battery at the corner),
 * the big clock and date below it, and the reminder sitting high under the
 * clock with the next service peeking out behind it — an iOS notification
 * stack, newest in front.
 *
 * The message does not drop in and lift away here. This is not a preview of the
 * event of one notification arriving — that is the plan screen's job — it is a
 * still handset whose stack cycles through the services it would carry. The
 * front card's service, body and timestamp cross-fade in place (the card behind
 * fading with it, held dim), so the reader reads "your car's X is due" against a
 * handful of real services rather than watching one animation loop.
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
  const next = count > 1 ? messages[(index + 1) % count] : null;
  // The card behind fades in step with the front one but never to full
  // strength — it is a card in a stack, not a second message competing to be
  // read.
  const peekOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

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

        {/* Status bar: the dynamic island centered, the signal / wi-fi /
            battery cluster top-right, the way iOS lays them out. The left stays
            empty — the lock screen carries no time there; the clock below is
            the time. */}
        <View style={{ height: 30, marginTop: 8, justifyContent: "center" }}>
          <View
            style={{
              position: "absolute",
              alignSelf: "center",
              width: 78,
              height: 24,
              borderRadius: 14,
              backgroundColor: "#000",
            }}
          />
          <View
            style={{
              position: "absolute",
              right: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Cellular />
            <Wifi />
            <Battery />
          </View>
        </View>

        {/* Date over the clock, the way the lock screen stacks them. */}
        <View style={{ alignItems: "center", marginTop: 14 }}>
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

        {/* The reminder sits high under the clock, with the next service in the
            rotation peeking out behind it — an iOS notification stack, newest in
            front. */}
        <View style={{ paddingHorizontal: 10, marginTop: 22 }}>
          <View>
            {next ? (
              <Animated.View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 16,
                  opacity: peekOpacity,
                }}
              >
                <NotifyBanner title={next.title} body={next.body} when={next.when} />
              </Animated.View>
            ) : null}
            <Animated.View style={{ opacity: fade }}>
              <NotifyBanner title={message.title} body={message.body} when={message.when} />
            </Animated.View>
          </View>
        </View>

        {/* iOS holds arrivals below the clock; the rest of the glass is empty. */}
        <View style={{ flex: 1 }} />

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

/** The status-bar glyphs, drawn from plain views — the app ships no icon set,
 *  and these are the OS's marks, not the app's. Muted white so they sit on the
 *  dark wallpaper without competing with the clock. */
const GLYPH = "rgba(255,255,255,0.9)";
const GLYPH_DIM = "rgba(255,255,255,0.5)";

function Cellular() {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 1.5 }}>
      {[3, 5, 7, 9].map((h) => (
        <View
          key={h}
          style={{ width: 3, height: h, borderRadius: 1, backgroundColor: GLYPH }}
        />
      ))}
    </View>
  );
}

function Wifi() {
  // No arcs without an icon set; a small upward fan reads as signal.
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderBottomWidth: 10,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: GLYPH,
      }}
    />
  );
}

function Battery() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 22,
          height: 11,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: GLYPH_DIM,
          padding: 1.5,
        }}
      >
        <View style={{ flex: 1, width: "70%", borderRadius: 1.5, backgroundColor: GLYPH }} />
      </View>
      <View
        style={{
          width: 1.5,
          height: 4,
          borderTopRightRadius: 1,
          borderBottomRightRadius: 1,
          backgroundColor: GLYPH_DIM,
          marginLeft: 0.5,
        }}
      />
    </View>
  );
}
