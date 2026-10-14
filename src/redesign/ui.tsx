import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useReduceMotion } from "../design/useReduceMotion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokens } from "../design/tokens";
import { PressableScale } from "../design/PressableScale";
import { Mascot } from "../mascot/Mascot";
import { Icon, type IconName } from "./icons";
import { ServiceSticker } from "./stickers";
import { isDesignV2 } from "../design/theme";

/**
 * The redesign's parts, on Bevel's light page. Shape rule: cards 24, rows
 * inside cards 14, every action a pill. One accent (the mascot's blue) for
 * progress and the active state; actions are the black pill. Red is overdue,
 * orange is due soon, and nothing else.
 */

const EASE = Easing.bezier(...tokens.motion.easeOut);

/**
 * Bevel's card: white on the grey page, lifted by a soft shadow rather than
 * outlined. `accent` and `alarm` tint the face for the one card on a screen
 * that is about something good or something overdue. iOS drops the shadow of
 * a view that clips, so the clip is an inner view.
 */
export function GlassCard({
  children,
  style,
  padded = true,
  tone = "neutral",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: "neutral" | "accent" | "alarm";
}) {
  const face = tone === "accent" ? "#EEF3FF" : tone === "alarm" ? "#FFF2F2" : tokens.color.surface;
  return (
    <View
      style={[
        { borderRadius: tokens.radius.xl, backgroundColor: face, ...tokens.shadow.ambient },
        style,
      ]}
    >
      <View
        style={[
          { borderRadius: tokens.radius.xl, borderCurve: "continuous", overflow: "hidden" },
          padded ? { padding: tokens.space.md + 4, gap: tokens.space.sm } : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** Planta's Today | Upcoming pill. A segmented control, so selection haptic
 *  on change and no slide between panes: the panes are peers. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignSelf: "center",
        padding: 4,
        gap: 4,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.sunken,
      }}
    >
      {items.map((item) => {
        const on = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(item.value);
            }}
            style={{
              minHeight: 40,
              justifyContent: "center",
              paddingHorizontal: tokens.space.md + 2,
              borderRadius: tokens.radius.pill,
              // Bevel's segment: the picked one is a white pill raised out of
              // the grey track.
              backgroundColor: on ? tokens.color.surface : "transparent",
              ...(on ? tokens.shadow.ambient : null),
            }}
          >
            <Text
              style={{
                ...tokens.text.body,
                fontSize: 15,
                fontWeight: on ? "600" : "500",
                color: on ? tokens.color.text : tokens.color.textMuted,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Bevel's ring, drawn without an SVG dependency: two half-rings, each clipped
 * to its half of the box and rotated into view. 0 is an empty track, 1 a full
 * circle. Static — data the user is reading does not move for style.
 */
export function Ring({
  progress,
  size = 64,
  stroke = 6,
  color = tokens.color.accent,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const right = 45 - 180 + 360 * Math.min(p, 0.5);
  const left = 45 - 180 + 360 * Math.max(p - 0.5, 0);
  const circle = {
    position: "absolute" as const,
    top: 0,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: stroke,
    borderColor: "transparent",
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ ...circle, left: 0, borderColor: tokens.color.sunken }} />
      {p > 0 ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: size / 2,
              width: size / 2,
              height: size,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                ...circle,
                left: -size / 2,
                borderTopColor: color,
                borderRightColor: color,
                transform: [{ rotate: `${right}deg` }],
              }}
            />
          </View>
          {p > 0.5 ? (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: size / 2,
                height: size,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  ...circle,
                  left: 0,
                  borderBottomColor: color,
                  borderLeftColor: color,
                  transform: [{ rotate: `${left}deg` }],
                }}
              />
            </View>
          ) : null}
        </>
      ) : null}
      {children}
    </View>
  );
}

/** Bevel's range bar: a track, the part of the interval still ahead, in the
 *  status colour. */
export function LifeBar({
  value,
  status,
}: {
  value: number;
  status: "due" | "soon" | "ok";
}) {
  const color =
    status === "due"
      ? tokens.color.red
      : status === "soon"
        ? tokens.color.accentSoft
        : tokens.color.accent;
  return (
    <View
      style={{
        height: 6,
        borderRadius: tokens.radius.pill,
        backgroundColor: tokens.color.metalLo,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.max(2, Math.round(value * 100))}%`,
          height: "100%",
          borderRadius: tokens.radius.pill,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** The round check a task card leads with. Tapping it is "I did this", which
 *  in a log is "log it": it opens the form with the service chosen. */
export function CheckButton({
  status,
  onPress,
  label,
}: {
  status: "due" | "soon";
  onPress: () => void;
  label: string;
}) {
  const ring = status === "due" ? tokens.color.red : tokens.color.accent;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: ring,
            backgroundColor: pressed ? ring : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: pressed ? tokens.color.onAccent : ring,
            }}
          >
            {"✓"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** A task in a list: the check, what to do, which car and when. */
export function TaskRow({
  type,
  title,
  subtitle,
  status,
  checkLabel,
  onCheck,
  onPress,
}: {
  /** The service type. In A v2 its sticker leads the row and the check moves
   *  to the right; without v2 it is unused. */
  type?: string;
  title: string;
  subtitle: string;
  status: "due" | "soon";
  checkLabel: string;
  onCheck: () => void;
  onPress?: () => void;
}) {
  // The check and the row are siblings, not nested: an accessible row button
  // would swallow the check for VoiceOver.
  const sticker = isDesignV2() && type !== undefined;
  const check = <CheckButton status={status} onPress={onCheck} label={checkLabel} />;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.space.md,
        paddingVertical: tokens.space.sm + 2,
      }}
    >
      {sticker ? <ServiceSticker type={type} /> : check}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        style={{ flex: 1 }}
      >
        {({ pressed }) => (
          <View style={{ gap: 2, opacity: pressed ? 0.6 : 1 }}>
            <Text
              style={{
                ...tokens.text.body,
                fontWeight: "600",
                color: tokens.color.text,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                ...tokens.text.caption,
                ...tokens.text.numeric,
                color:
                  status === "due" ? tokens.color.red : tokens.color.textMuted,
              }}
            >
              {subtitle}
            </Text>
          </View>
        )}
      </Pressable>
      {sticker ? check : null}
    </View>
  );
}

/** A round glass button for the header's one control. */
export function RoundButton({
  icon,
  onPress,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.color.surface,
          ...tokens.shadow.ambient,
        }}
      >
        <Icon name={icon} size={20} />
      </View>
    </PressableScale>
  );
}

/** The plus, drawn rather than typed so it is optically centred. */
function Plus({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 20,
          height: 2.5,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 2.5,
          height: 20,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/**
 * Bevel's floating white tab bar, with its separate round "+" beside it. Tabs are
 * peers: switching is instant (no slide), a selection tick, and re-tapping the
 * active tab scrolls it home (the caller's `onReselect`).
 */
export function FloatingTabBar<T extends string>({
  tabs,
  value,
  onChange,
  onReselect,
  onPlus,
  plusLabel,
}: {
  tabs: readonly { value: T; label: string; icon: IconName }[];
  value: T;
  onChange: (value: T) => void;
  onReselect?: (value: T) => void;
  onPlus: () => void;
  plusLabel: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, tokens.space.md) - 4,
        alignItems: "center",
      }}
    >
      <View
        style={{
          ...tokens.layout.column,
          paddingHorizontal: tokens.space.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space.sm + 4,
        }}
      >
        <View
          accessibilityRole="tablist"
          style={{
            flex: 1,
            flexDirection: "row",
            padding: 5,
            gap: 4,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.surface,
            boxShadow: "0 10px 30px rgba(26,29,58,0.12)",
          }}
        >
          {tabs.map((tab) => {
            const on = tab.value === value;
            return (
              <Pressable
                key={tab.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  if (on) {
                    onReselect?.(tab.value);
                    return;
                  }
                  Haptics.selectionAsync().catch(() => {});
                  onChange(tab.value);
                }}
                style={{
                  flex: 1,
                  minHeight: 52,
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: tokens.radius.pill,
                  backgroundColor: on ? tokens.color.surfaceHi : "transparent",
                }}
              >
                {/* Opal's tab: icon over a small label. */}
                <Icon
                  name={tab.icon}
                  size={22}
                  color={on ? tokens.color.text : tokens.color.textFaint}
                />
                <Text
                  style={{
                    ...tokens.text.caption,
                    fontSize: 11,
                    fontWeight: on ? "600" : "500",
                    color: on ? tokens.color.text : tokens.color.textFaint,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PressableScale
          onPress={onPlus}
          accessibilityRole="button"
          accessibilityLabel={plusLabel}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              alignItems: "center",
              justifyContent: "center",
              // Bevel's "+": a white disc beside the bar, not a coloured
              // button — the bar and the disc read as one control.
              backgroundColor: tokens.color.surface,
              boxShadow: "0 10px 30px rgba(26,29,58,0.12)",
            }}
          >
            <Plus color={tokens.color.text} />
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

/** Room the floating bar takes, for scroll content to clear it. */
export const TAB_BAR_CLEARANCE = 58 + tokens.space.xl + tokens.space.lg;

/**
 * Finch's "Hooray!" moment, for a logged service: the celebrating car and one
 * line, dropped in from the top, gone after a beat. Rare (once per save), so it
 * earns a spring and the success haptic is already the log form's.
 */
export function CelebrateToast({
  title,
  body,
  visible,
  onHidden,
}: {
  title: string;
  body: string;
  visible: boolean;
  onHidden: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReduceMotion();
  const y = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    y.setValue(reduced ? 0 : -40);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: tokens.motion.base,
        easing: EASE,
        useNativeDriver: true,
      }),
      reduced
        ? Animated.delay(0)
        : Animated.spring(y, {
            toValue: 0,
            damping: 16,
            stiffness: 200,
            useNativeDriver: true,
          }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: tokens.motion.fast,
          easing: EASE,
          useNativeDriver: true,
        }),
        reduced
          ? Animated.delay(0)
          : Animated.timing(y, {
              toValue: -24,
              duration: tokens.motion.fast,
              easing: EASE,
              useNativeDriver: true,
            }),
      ]).start(() => onHidden());
    }, 2600);
    return () => clearTimeout(timer);
  }, [visible, reduced, y, opacity, onHidden]);

  const style = { opacity, transform: [{ translateY: y }] };

  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        {
          position: "absolute",
          top: insets.top + tokens.space.sm,
          left: tokens.space.lg,
          right: tokens.space.lg,
          alignItems: "center",
          zIndex: 20,
        },
        style,
      ]}
    >
      <View
        style={{
          ...tokens.layout.column,
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.space.sm,
          paddingVertical: tokens.space.sm,
          paddingLeft: tokens.space.sm,
          paddingRight: tokens.space.md,
          borderRadius: tokens.radius.xl,
          backgroundColor: tokens.color.surface,
          boxShadow: "0 12px 36px rgba(26,29,58,0.16)",
        }}
      >
        <Mascot mood="celebrating" size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              ...tokens.text.body,
              fontWeight: "700",
              color: tokens.color.text,
            }}
          >
            {title}
          </Text>
          <Text
            style={{ ...tokens.text.caption, color: tokens.color.textMuted }}
          >
            {body}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** A small, quiet section heading inside the redesign. */
export function SectionTitle({
  children,
  right,
}: {
  children: string;
  right?: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
        {children}
      </Text>
      {right}
    </View>
  );
}
