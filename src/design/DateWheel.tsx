import { useMemo } from "react";
import { Drum, WheelCase } from "./Wheel";
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
    <WheelCase>
      <Drum
        items={monthNames}
        index={value.month - 1}
        onIndex={(i) => set({ month: i + 1 })}
        width={84}
      />
      <Drum items={days} index={value.day - 1} onIndex={(i) => set({ day: i + 1 })} width={64} />
      <Drum
        items={years.map(String)}
        index={Math.max(0, years.indexOf(value.year))}
        onIndex={(i) => set({ year: years[i] })}
        width={96}
      />
    </WheelCase>
  );
}
