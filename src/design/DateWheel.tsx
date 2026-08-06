import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Well } from "./Surface";
import { tokens } from "./tokens";
import { clampDateParts, daysInMonth, type DateParts } from "../format";
import { getLanguage } from "../i18n";

/**
 * A three-drum date picker: month, day, year.
 *
 * This replaces a free-text "MM/DD/YYYY" box, which asked the user to know a
 * format, type eight characters on a number pad, and then read an error to
 * find out that 2/30 isn't a day. Every position on a wheel is a legal date,
 * so the only failure the screen can still report is one it invented.
 *
 * Drawn rather than taken from `@react-native-community/datetimepicker`: a
 * native picker is a new native module, so it costs a dev-client rebuild and
 * arrives wearing the system's own light-grey chrome in the middle of a black
 * instrument panel. These wheels are the same drums the odometer uses.
 */

const ITEM_HEIGHT = 40;
/** Odd, so one row is centred with an equal number above and below. */
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_HEIGHT;

/**
 * The month drum reads in the reader's language, and `short` is the form that
 * keeps doing so inside a fixed 84pt column — the full names ("September",
 * "Februar") do not fit the drum at readout size. Memoised per language because
 * this is rebuilt on every render of the picker.
 */
const monthLabels: Record<string, string[]> = {};

function months(language: string): string[] {
  // Mid-month in UTC: the formatter applies the device time zone, and the 1st
  // would slide into the previous month for anyone west of Greenwich.
  monthLabels[language] ??= Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(language, { month: "short" }).format(new Date(Date.UTC(2024, i, 15)))
  );
  return monthLabels[language];
}

function Drum({
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
  const ref = useRef<ScrollView>(null);
  // What the scroll view is actually showing. Without this, the effect below
  // fights the user's finger: every committed index would scroll the drum back
  // to a position it is already at, cancelling momentum mid-flick.
  const shown = useRef(index);

  // `contentOffset` is an iOS-only prop, so Android opens every drum at the
  // top — January, the 1st, ten years ago — until it is scrolled into place.
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
            // Only the selected row is at full white. The rest are the same
            // digits seen around the curve of the drum.
            color: i === index ? tokens.color.text : tokens.color.textFaint,
          }}
        >
          {label}
        </Text>
      ))}
    </ScrollView>
  );
}

export function DateWheel({
  value,
  onChange,
  /** How far back the year drum goes. Ten years covers the service history
   *  anyone is entering by hand on a phone. */
  yearsBack = 10,
  today = new Date(),
}: {
  value: DateParts;
  onChange: (p: DateParts) => void;
  yearsBack?: number;
  today?: Date;
}) {
  const maxYear = today.getFullYear();
  const years = useMemo(
    () => Array.from({ length: yearsBack + 1 }, (_, i) => maxYear - yearsBack + i),
    [maxYear, yearsBack]
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth(value.year, value.month) }, (_, i) => String(i + 1)),
    [value.year, value.month]
  );
  // Not memoised here: `months` already caches per language, and reading the
  // language at render is what lets a switch in Settings reach the drum.
  const monthNames = months(getLanguage());

  // One funnel for all three drums: any move can make the date impossible
  // (Jan 31 → Feb) or push it into the future (last year → this year, in a
  // month that hasn't come round yet), and both are corrected the same way.
  function set(next: Partial<DateParts>) {
    onChange(clampDateParts({ ...value, ...next }, today));
  }

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
            borderColor: tokens.color.hairline,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Drum
            items={monthNames}
            index={value.month - 1}
            onIndex={(i) => set({ month: i + 1 })}
            width={84}
          />
          <Drum
            items={days}
            index={value.day - 1}
            onIndex={(i) => set({ day: i + 1 })}
            width={64}
          />
          <Drum
            items={years.map(String)}
            index={Math.max(0, years.indexOf(value.year))}
            onIndex={(i) => set({ year: years[i] })}
            width={96}
          />
        </View>
        {/* Curvature, same as the odometer drums: shaded top and bottom, the
            column reads as a cylinder rather than a list in a box. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(15,17,19,0.96)", "rgba(15,17,19,0)", "rgba(15,17,19,0.96)"]}
          locations={[0, 0.5, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>
    </Well>
  );
}
