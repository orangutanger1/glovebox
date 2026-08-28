import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Field } from "../src/design/Field";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { useTheme } from "../src/design/theme";
import { tokens } from "../src/design/tokens";
import type { Interval } from "../src/schedule";
import { serviceName, serviceOptions } from "../src/schedule/names";
import { getIntervals, listIntervalOverrides, setInterval, getDefaultIntervals } from "../src/db/intervals";
import { rescheduleAll } from "../src/notify";
import { parseNumber } from "../src/format";
import { t } from "../src/i18n";
import { formatDistance, distanceUnitLabel } from "../src/units/format";

/**
 * One message per shape of schedule rather than a joined list: "every 6 months
 * or 5,000 miles" is one sentence whose word order and separator belong to the
 * translator, and a distance is never a number the screen prints itself.
 */
function describe(interval: Interval | undefined): string {
  if (!interval) return t("intervals.untracked");
  const { months, distance } = interval;
  if (months !== undefined && distance !== undefined) {
    return t("intervals.monthsAndDistance", { count: months, distance: formatDistance(distance) });
  }
  if (months !== undefined) return t("intervals.months", { count: months });
  if (distance !== undefined) return formatDistance(distance);
  return t("intervals.untracked");
}

export default function Intervals() {
  const c = useTheme();

  const [effective, setEffective] = useState<Record<string, Interval>>({});
  const [overrides, setOverrides] = useState<Record<string, Interval>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [months, setMonths] = useState("");
  const [distance, setDistance] = useState("");
  const [msg, setMsg] = useState("");

  const refresh = useCallback(() => {
    setEffective(getIntervals());
    setOverrides(listIntervalOverrides());
  }, []);

  useFocusEffect(refresh);

  function onOpen(type: string) {
    const current = effective[type] ?? {};
    setEditing(type);
    setMonths(current.months !== undefined ? String(current.months) : "");
    setDistance(current.distance !== undefined ? String(current.distance) : "");
    setMsg("");
  }

  function onSave() {
    if (!editing) return;
    const m = parseNumber(months);
    const d = parseNumber(distance);

    // Zero is not a schedule, it is a service that is due the moment it is
    // logged. Rejecting it here is cheaper than explaining a permanently red
    // garage screen later.
    if ((months.trim() && (m === undefined || m <= 0)) || (distance.trim() && (d === undefined || d <= 0))) {
      setMsg(t("intervals.error.positive"));
      return;
    }
    // Both boxes empty is a reset, not an error — setInterval drops the row and
    // the shipped default takes over again. The card above says so.
    setInterval(editing, { months: m, distance: d });
    // Reminders were scheduled against the old numbers. Not rescheduling here
    // is how a user changes their oil interval to 10,000 miles and keeps being
    // told it is due at 5,000.
    rescheduleAll().catch(() => {});
    setEditing(null);
    refresh();
  }

  if (editing) {
    const fallback = getDefaultIntervals()[editing];
    return (
      <Screen
        title={serviceName(editing)}
        footer={
          <>
            {msg ? (
              <Text style={{ ...tokens.text.body, color: c.overdue }}>{msg}</Text>
            ) : null}
            <Button label={t("intervals.save")} onPress={onSave} />
            <Button label={t("intervals.cancel")} variant="secondary" onPress={() => setEditing(null)} />
          </>
        }
      >
        <Card>
          <Text style={{ ...tokens.text.body, color: c.inkMuted }}>
            {t("intervals.help", { default: describe(fallback) })}
          </Text>
        </Card>
        <Card>
          <Field
            label={t("intervals.field.months")}
            value={months}
            onChangeText={setMonths}
            keyboardType="numeric"
          />
          <Field
            label={t("intervals.field.distance", { unit: distanceUnitLabel() })}
            value={distance}
            onChangeText={setDistance}
            keyboardType="numeric"
          />
        </Card>
      </Screen>
    );
  }

  /**
   * Every service the app has an opinion about, in the order they come up in a
   * real year rather than alphabetically — the two people open this screen for
   * are the ones whose oil change is not every 5,000 miles.
   *
   * Read at render, not at import: the label is the reader's word for a type
   * whose identifier stays English in the database.
   */
  const rows = serviceOptions();

  return (
    <Screen title={t("intervals.title")}>
      <Card>
        <Text style={{ ...tokens.text.body, color: c.inkMuted }}>
          {t("intervals.intro")}
        </Text>
      </Card>
      <Card>
        {rows.map(({ type, label }) => (
          <ListRow
            key={type}
            title={label}
            subtitle={describe(effective[type])}
            right={
              overrides[type] ? (
                <Text style={{ ...tokens.text.legend, color: c.inkMuted }}>
                  {t("intervals.custom")}
                </Text>
              ) : undefined
            }
            onPress={() => onOpen(type)}
          />
        ))}
      </Card>
      <View style={{ height: tokens.space.md }} />
    </Screen>
  );
}
