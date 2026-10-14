import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { tokens } from "../design/tokens";
import { v2 } from "../design/type";
import { useReduceMotion } from "../design/useReduceMotion";
import { t, formatNumber } from "../i18n";
import { distanceUnitLabel } from "../units/format";
import { serviceName } from "../schedule/names";
import { Mascot } from "../mascot/Mascot";
import type { Mood } from "../mascot/mood";
import type { DueState } from "../schedule/due";
import type { Road as RoadModel } from "./model";
import { whenLabel } from "./copy";
import { ServiceSticker } from "./stickers";
import { SectionTitle } from "./ui";
import { AMBER_TEXT, RED_TEXT } from "./HeroCard";

/** The blue accent darkened to 4.5:1 on white, for small text. */
const ACCENT_TEXT = "#3A64E0";
const ASPHALT = "#2B2F3A";
const STRIP = 56;
const DASH = { width: 3, height: 8, gap: 14 };
const STUB = 14;
const EASE = Easing.bezier(...tokens.motion.easeOut);

/**
 * A v2's Upcoming tab: karen's lily-pad path as a road. Read from the
 * driver's seat: what comes due furthest away is at the top, the car sits at
 * its reading, and anything overdue is behind it.
 *
 * Drawn with Views (react-native-svg is not in the binary). The car is the
 * still, never the loop: the loops have the page colour baked in and would
 * show as a box on the asphalt.
 */
export function Road({
  road,
  mood,
  showName,
  onCarLayout,
}: {
  road: RoadModel;
  mood: Mood;
  showName: boolean;
  /** The car's offset from the top of this road, once laid out. */
  onCarLayout?: (y: number) => void;
}) {
  const reduced = useReduceMotion();
  // Furthest ahead at the top.
  const ahead = [...road.ahead].reverse();
  let index = 0;

  return (
    <View style={{ gap: tokens.space.sm }}>
      {showName ? <SectionTitle>{road.vehicleName}</SectionTitle> : null}
      <View>
        {/* The asphalt and its centre line, under everything. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            marginLeft: -STRIP / 2,
            width: STRIP,
            borderRadius: STRIP / 2,
            backgroundColor: ASPHALT,
            overflow: "hidden",
            alignItems: "center",
            paddingTop: DASH.gap,
            gap: DASH.gap,
          }}
        >
          {Array.from({ length: 80 }, (_, i) => (
            <View
              key={i}
              style={{ width: DASH.width, height: DASH.height, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.6)" }}
            />
          ))}
        </View>

        <View style={{ paddingVertical: tokens.space.md, gap: tokens.space.md }}>
          {ahead.map((s) => (
            <Sign key={s.type} state={s} side={index % 2 === 0 ? "left" : "right"} order={index++} reduced={reduced} />
          ))}

          <View
            onLayout={(e) => onCarLayout?.(e.nativeEvent.layout.y)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <View style={{ flex: 1 }} />
            <Mascot mood={mood} size={96} />
            <View style={{ flex: 1, paddingLeft: tokens.space.sm, gap: 2 }}>
              <Text style={{ ...v2.label(), color: tokens.color.textMuted }}>{t("redesign.road.here")}</Text>
              {road.odometer !== undefined ? (
                <Text style={{ ...v2.value(), color: tokens.color.text }}>
                  {`${formatNumber(road.odometer)} ${distanceUnitLabel()}`}
                </Text>
              ) : null}
            </View>
          </View>

          {road.behind.length > 0 ? (
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }} />
              <View style={{ width: STRIP + STUB * 2 }} />
              <Text style={{ ...v2.label(), color: RED_TEXT, flex: 1 }}>{t("redesign.road.behind")}</Text>
            </View>
          ) : null}
          {road.behind.map((s) => (
            <Sign key={s.type} state={s} side={index % 2 === 0 ? "left" : "right"} order={index++} reduced={reduced} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Sign({
  state,
  side,
  order,
  reduced,
}: {
  state: DueState;
  side: "left" | "right";
  order: number;
  reduced: boolean;
}) {
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    const run = Animated.timing(enter, {
      toValue: 1,
      duration: tokens.motion.base,
      delay: order * 40,
      easing: EASE,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
    // Once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overdue = state.status === "due";
  const when = whenLabel(state);
  const tone = overdue ? RED_TEXT : state.status === "soon" ? AMBER_TEXT : ACCENT_TEXT;
  const card = (
    <View
      accessible
      accessibilityLabel={`${serviceName(state.type)}, ${when}`}
      style={{
        flexShrink: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.space.sm,
        padding: 10,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: overdue ? tokens.color.redWash : tokens.color.surface,
        ...(overdue ? {} : tokens.shadow.ambient),
      }}
    >
      <ServiceSticker type={state.type} size={40} />
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: tokens.color.text }} numberOfLines={2}>
          {serviceName(state.type)}
        </Text>
        <Text style={{ ...v2.value(), color: tone }}>{when}</Text>
      </View>
    </View>
  );
  const stub = <View style={{ width: STUB, height: 2, backgroundColor: tokens.color.hairlineLit }} />;

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
        {side === "left" ? (
          <>
            {card}
            {stub}
          </>
        ) : null}
      </View>
      <View style={{ width: STRIP }} />
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        {side === "right" ? (
          <>
            {stub}
            {card}
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}
