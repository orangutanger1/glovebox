import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Field } from "../src/design/Field";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { tokens } from "../src/design/tokens";
import { DEFAULT_INTERVALS, type Interval } from "../src/schedule";
import { getIntervals, listIntervalOverrides, setInterval } from "../src/db/intervals";
import { rescheduleAll } from "../src/notify";
import { parseNumber } from "../src/format";

/**
 * Every service the app has an opinion about, in the order they come up in a
 * real year rather than alphabetically — the two people open this screen for
 * are the ones whose oil change is not every 5,000 miles.
 */
const TYPES = Object.keys(DEFAULT_INTERVALS);

function describe(interval: Interval | undefined): string {
  if (!interval) return "not tracked";
  const parts: string[] = [];
  if (interval.months !== undefined) parts.push(`${interval.months} mo`);
  if (interval.miles !== undefined) parts.push(`${interval.miles.toLocaleString()} mi`);
  return parts.length > 1 ? parts.join(" · ") : (parts[0] ?? "not tracked");
}

export default function Intervals() {
  const [effective, setEffective] = useState<Record<string, Interval>>({});
  const [overrides, setOverrides] = useState<Record<string, Interval>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [months, setMonths] = useState("");
  const [miles, setMiles] = useState("");
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
    setMiles(current.miles !== undefined ? String(current.miles) : "");
    setMsg("");
  }

  function onSave() {
    if (!editing) return;
    const m = parseNumber(months);
    const mi = parseNumber(miles);

    // Zero is not a schedule, it is a service that is due the moment it is
    // logged. Rejecting it here is cheaper than explaining a permanently red
    // garage screen later.
    if ((months.trim() && (m === undefined || m <= 0)) || (miles.trim() && (mi === undefined || mi <= 0))) {
      setMsg("Use whole numbers above zero, or leave a box empty to ignore it.");
      return;
    }
    // Both boxes empty is a reset, not an error — setInterval drops the row and
    // the shipped default takes over again. The card above says so.
    setInterval(editing, { months: m, miles: mi });
    // Reminders were scheduled against the old numbers. Not rescheduling here
    // is how a user changes their oil interval to 10,000 miles and keeps being
    // told it is due at 5,000.
    rescheduleAll().catch(() => {});
    setEditing(null);
    refresh();
  }

  if (editing) {
    const fallback = DEFAULT_INTERVALS[editing];
    return (
      <Screen
        title={editing}
        footer={
          <>
            {msg ? (
              <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{msg}</Text>
            ) : null}
            <Button label="Save interval" onPress={onSave} />
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
          </>
        }
      >
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            Due whichever comes first. Leave a box empty to ignore it, so miles only or months
            only is a valid schedule. Clear both to go back to the default ({describe(fallback)}).
          </Text>
        </Card>
        <Card>
          <Field label="Every (months)" value={months} onChangeText={setMonths} keyboardType="numeric" />
          <Field label="Every (miles)" value={miles} onChangeText={setMiles} keyboardType="numeric" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Service intervals">
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          How often each service comes due. Change any of them to match your own car, the manual,
          the climate you drive in, or how hard you use it.
        </Text>
      </Card>
      <Card>
        {TYPES.map((type) => (
          <ListRow
            key={type}
            title={type}
            subtitle={describe(effective[type])}
            right={
              overrides[type] ? (
                <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>CUSTOM</Text>
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
