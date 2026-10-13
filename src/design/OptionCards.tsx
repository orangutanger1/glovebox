import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "./tokens";
import { usePressScale } from "./press";
import { isRedesign } from "./theme";
import { Icon } from "../redesign/icons";

/**
 * The answers to a question, as a column of full-width cards.
 *
 * These questions used to be a wrapping row of pill chips, on the argument
 * that a column of full-width buttons is the shape of every quiz app there has
 * ever been. That was true of the shape and wrong about the reading. Five
 * answers of unequal length wrap into rows that have no reading order — the
 * fourth option sits beside the third, the fifth starts a line of its own —
 * and a question whose options cannot be read down is a question the user
 * answers by scanning for the shortest label. The pills were also the smallest
 * targets in the flow at the one moment the app is asking for something.
 *
 * So: one card per line, each the full width of the gutter, each a flat
 * surface with a socket on the right. The socket is the whole selection
 * language — an empty ring when the answer is not chosen, a filled dot when it
 * is. Nothing about the card moves position when it is picked, which is what
 * makes a multi-select column readable while it is being filled in.
 *
 * The cards enter staggered on mount, 45ms apart. It is the only decorative
 * motion in the quiz and it earns its place by giving the column a reading
 * order before the user has read anything: the eye is walked down the options
 * once, in the order they are meant to be considered. It is 40ms of delay per
 * row and never gates a tap — a card is pressable from the frame it mounts.
 */
export function OptionCards<T extends string>({
  legend,
  options,
  selected,
  onPress,
  disabled = false,
}: {
  legend?: string;
  options: readonly { value: T; label: string; detail?: string }[];
  /** Every selected value. Single-answer questions pass an array of one. */
  selected: readonly T[];
  onPress: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: tokens.space.sm }}>
      {legend ? (
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{legend}</Text>
      ) : null}
      <View style={{ gap: tokens.space.sm }}>
        {options.map((option, i) => (
          <OptionCard
            key={option.value}
            label={option.label}
            detail={option.detail}
            selected={selected.includes(option.value)}
            onPress={() => onPress(option.value)}
            disabled={disabled}
            delay={i * 45}
          />
        ))}
      </View>
    </View>
  );
}

/** Entry: short, and decelerating, because the card is arriving rather than
 *  moving. 6px of travel — enough to read as a settle, small enough that four
 *  of them staggered do not read as a list being dealt out. */
const ENTER_MS = 260;
const ENTER_TRAVEL = 6;
/** The stud landing in its socket. Faster than the entry: this one is the app
 *  answering a tap, and everything under 160ms reads as the control itself
 *  rather than as an animation of it. */
const PICK_MS = 150;

function OptionCard({
  label,
  detail,
  selected,
  onPress,
  disabled,
  delay,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
  delay: number;
}) {
  const press = usePressScale(disabled);
  const redesign = isRedesign();
  const enter = useRef(new Animated.Value(0)).current;
  // Starts wherever the card starts, so a screen returned to by Back shows its
  // answer already picked instead of playing the pick again.
  const pick = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    const run = Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [enter, delay]);

  useEffect(() => {
    const run = Animated.timing(pick, {
      toValue: selected ? 1 : 0,
      duration: PICK_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [pick, selected]);

  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [ENTER_TRAVEL, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled }}
      >
        <Animated.View
          style={{
            transform: [{ scale: press.scale }],
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.space.md,
            minHeight: 62,
            paddingHorizontal: tokens.space.md,
            paddingVertical: tokens.space.sm + 4,
            borderRadius: redesign ? 22 : tokens.radius.md,
            borderCurve: "continuous",
            borderWidth: redesign ? 2 : 1,
            ...(redesign ? tokens.shadow.ambient : null),
            // The chosen card is one value up with a lit hairline round it.
            // That is the whole difference: a picked answer does not need to
            // be a different material from the ones beside it, only a brighter
            // one, and the socket on the right is already saying which it is.
            // Arm A: every answer is a white pill on the grey page, and the
            // picked one gets an accent rim and a filled check — Planta's
            // option card, Opal's pill.
            backgroundColor: disabled
              ? tokens.color.surface
              : selected
                ? redesign
                  ? tokens.color.surface
                  : tokens.color.surfaceHi
                : tokens.color.surface,
            borderColor: selected
              ? redesign
                ? tokens.color.accent
                : tokens.color.hairlineLit
              : redesign
                ? "transparent"
                : tokens.color.hairline,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                ...tokens.text.body,
                fontWeight: selected ? "600" : "400",
                color: disabled
                  ? tokens.color.textFaint
                  : selected || redesign
                    ? tokens.color.text
                    : tokens.color.textMuted,
              }}
            >
              {label}
            </Text>
            {detail ? (
              <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
                {detail}
              </Text>
            ) : null}
          </View>
          {redesign ? <CheckCircle pick={pick} /> : <Socket pick={pick} />}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Arm A's selection mark: an empty ring that fills with the accent and a
 *  white tick. */
function CheckCircle({ pick }: { pick: Animated.Value }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: tokens.color.hairlineLit,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: -1.5,
          left: -1.5,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: tokens.color.accent,
          alignItems: "center",
          justifyContent: "center",
          opacity: pick,
          transform: [{ scale: pick.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      >
        <Icon name="check" size={16} color={tokens.color.onAccent} />
      </Animated.View>
    </View>
  );
}

const SOCKET = 22;
const STUD = 12;

/**
 * The selection itself: a ring, and a dot that lands in it.
 *
 * The dot grows from 0.7 rather than from nothing. A mark that scales from
 * zero reads as a graphic being drawn rather than as a state arriving. The
 * ring stays visible either way, so an unanswered question still looks like a
 * row of controls waiting rather than a row of labels.
 */
function Socket({ pick }: { pick: Animated.Value }) {
  return (
    <View
      style={{
        width: SOCKET,
        height: SOCKET,
        borderRadius: SOCKET / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.color.sunken,
        borderWidth: 1,
        borderColor: tokens.color.hairlineLit,
      }}
    >
      <Animated.View
        style={{
          width: STUD,
          height: STUD,
          borderRadius: STUD / 2,
          backgroundColor: isRedesign() ? tokens.color.accent : tokens.color.white,
          opacity: pick,
          transform: [
            { scale: pick.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
          ],
        }}
      />
    </View>
  );
}
