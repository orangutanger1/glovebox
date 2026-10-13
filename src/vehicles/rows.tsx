import { View, Text } from "react-native";
import { Gauge } from "../design/Gauge";
import { tokens } from "../design/tokens";
import type { ServiceRecord } from "../db/records";
import type { FuelRow } from "../db/fuel";
import { averageEfficiency, latestEfficiency } from "../fuel";
import { currentFuelUnits, formatEfficiency } from "../fuel/format";
import { t, formatDate } from "../i18n";
import { getDistanceUnit } from "../units";
import { formatMoney } from "../money";
import { formatDistance } from "../units/format";
import { formatTread } from "../tires/tread";

/**
 * The row and summary formatting the vehicle screen draws, shared by the
 * classic screen and the redesign so a service row says the same thing in
 * either arm of `app_design`.
 */

/**
 * The facts a history row can carry, as one message per combination: the middot
 * is punctuation a translator has to be able to change, and only a whole
 * message can be reordered for a language that reads them in another order.
 */
export function recordSubtitle(record: ServiceRecord): string {
  const date = formatDate(record.performed_at);
  // Presence, not truthiness: a reading of 0 and a job that cost nothing are
  // both facts the owner typed, and `?` on them hid the one and made the
  // other read as unpriced while the insights total counted it.
  const distance = record.odometer !== undefined ? formatDistance(record.odometer) : undefined;
  const cost = record.cost !== undefined ? formatMoney(record.cost) : undefined;
  const base = baseSubtitle(date, distance, cost);
  return record.tread_mm !== undefined
    ? t("vehicle.row.withTread", { base, tread: formatTread(record.tread_mm, getDistanceUnit()) })
    : base;
}

function baseSubtitle(date: string, distance?: string, cost?: string): string {
  if (distance && cost) return t("vehicle.row.dateDistanceCost", { date, distance, cost });
  if (distance) return t("vehicle.row.dateDistance", { date, distance });
  if (cost) return t("vehicle.row.dateCost", { date, cost });
  return date;
}

/**
 * Last tank, with the average beneath it.
 *
 * The two "not yet" states are the point. A dash where a figure belongs reads
 * as a broken calculation, and a user whose first fill produced nothing has to
 * be told that the second full tank is where the number arrives — otherwise
 * the feature looks broken on exactly the day they first try it.
 */
export function FuelSummary({ entries }: { entries: FuelRow[] }) {
  const { style } = currentFuelUnits();
  const latest = latestEfficiency(entries, style);
  const average = averageEfficiency(entries, style);

  if (latest === null) {
    return (
      <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
        {entries.length === 0 ? t("fuel.summary.needFirst") : t("fuel.summary.needSecond")}
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: tokens.space.md }}>
      <Gauge legend={t("fuel.summary.last")} value={formatEfficiency(latest, style)} />
      {average !== null ? (
        <Gauge
          legend={t("fuel.summary.average")}
          value={formatEfficiency(average, style)}
          align="right"
        />
      ) : null}
    </View>
  );
}

/** A fill row, carrying the same facts as a service row and through the same
 *  messages: "date · distance · cost" is exactly a fill. */
export function fillSubtitle(entry: FuelRow): string {
  const date = formatDate(entry.filled_at);
  const distance = formatDistance(entry.odometer);
  const cost = entry.cost !== undefined ? formatMoney(entry.cost) : undefined;
  return cost
    ? t("vehicle.row.dateDistanceCost", { date, distance, cost })
    : t("vehicle.row.dateDistance", { date, distance });
}
