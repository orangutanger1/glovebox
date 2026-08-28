import { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Well } from "./Surface";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * The drum, and the case it turns in.
 *
 * This was three private functions inside `DateWheel`, which is where it
 * belonged until a second screen needed one column of it. A model year is the
 * same control as the year column of a date: a value with an order, too many
 * of them to print as chips, and none of them worth a keyboard. Copying the
 * scroll maths into the vehicle question would have meant two drums that snap,
 * shade and click slightly differently.
 */

export const ITEM_HEIGHT = 40;
/** Odd, so one row is centred with an equal number above and below. */
export const VISIBLE = 5;
export const PAD = ((VISIBLE - 1) / 2) * ITEM_HEIGHT;

export function Drum({
  items,
  index,
  onIndex,
  width,
}: {
  items: string[];
  index: number;
  onIndex: (i: number) => void;
  width: number;
}) {
  const c = useTheme();

  const ref = useRef<ScrollView>(null);
  // What the scroll view is actually showing. Without this, the effect below
  // fights the user's finger: every committed index would scroll the drum back
  // to a position it is already at, cancelling momentum mid-flick.
  const shown = useRef(index);

  // `contentOffset` is an iOS-only prop, so Android opens every drum at the
  // top until it is scrolled into place.
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    // Mount only: afterwards the effect below owns the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  }, [index]);

  function commit(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const next = Math.min(items.length - 1, Math.max(0, raw));
    if (next === shown.current) return;
    shown.current = next;
    Haptics.selectionAsync().catch(() => {});
    onIndex(next);
  }

  return (
    <ScrollView
      ref={ref}
      style={{ width, height: VISIBLE * ITEM_HEIGHT }}
      contentContainerStyle={{ paddingVertical: PAD }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      // A drum that stops between two digits is a broken drum: both ends of a
      // flick are caught, because a slow drag never fires a momentum event.
      onMomentumScrollEnd={commit}
      onScrollEndDrag={commit}
      contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
    >
      {items.map((label, i) => (
        <Text
          key={label}
          style={{
            height: ITEM_HEIGHT,
            lineHeight: ITEM_HEIGHT,
            textAlign: "center",
            ...tokens.text.readout,
            fontSize: 20,
            // Distance from the detent, not a dark vignette over the ends:
            // the rows either side of the selection recede a step, the rest
            // sit at the faintest ink, so the column still reads as a drum
            // seen around its curve on a light surface.
            color:
              i === index ? c.ink : Math.abs(i - index) === 1 ? c.inkMuted : c.inkFaint,
          }}
        >
          {label}
        </Text>
      ))}
    </ScrollView>
  );
}

/**
 * The case: a well, and the detent hairlines behind the drums.
 */
export function WheelCase({ children }: { children: React.ReactNode }) {
  const c = useTheme();

  return (
    <Well style={{ overflow: "hidden" }}>
      <View style={{ height: VISIBLE * ITEM_HEIGHT }}>
        {/* The selection gate, behind the drums: two hairlines at the centre
            row, which is how a physical picker marks its detent. */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: PAD,
            height: ITEM_HEIGHT,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: c.hairline,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "center" }}>{children}</View>
      </View>
    </Well>
  );
}

/**
 * One drum in a case, for a single ordered value.
 *
 * `values` is whatever the caller is choosing between and `labels` is how they
 * are printed, because a model year is a number the app reasons about and a
 * string on the glass, and `t` would group "2014" into "2,014" if the drum
 * were handed the quantity.
 */
export function Wheel<T>({
  values,
  labels,
  value,
  onChange,
  width = 140,
}: {
  values: readonly T[];
  labels: string[];
  value: T;
  onChange: (value: T) => void;
  width?: number;
}) {
  const index = Math.max(0, values.indexOf(value));
  return (
    <WheelCase>
      <Drum items={labels} index={index} onIndex={(i) => onChange(values[i])} width={width} />
    </WheelCase>
  );
}
