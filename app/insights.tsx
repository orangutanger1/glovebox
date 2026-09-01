import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { tokens } from "../src/design/tokens";
import { costedRecords } from "../src/db/records";
import { listVehicles } from "../src/db/vehicles";
import {
  spendByMonth,
  spendByService,
  spendByVehicle,
  spendOf,
  type CostedRecord,
  type SpendBucket,
} from "../src/insights";
import { formatMoney } from "../src/money";
import { serviceName } from "../src/schedule/names";
import { vehicleDisplayName } from "../src/format";
import { getLanguage, t } from "../src/i18n";

/** A year, which is the window a maintenance bill is actually judged over —
 *  short enough that the bars mean something on a phone, long enough to hold
 *  the annual services (inspection, tyres) that make up most of the number. */
const MONTHS = 12;

/** The tallest bar, in points. Bars scale against the biggest month rather than
 *  an absolute, because there is no meaningful ceiling on what a service costs
 *  and a fixed scale renders every month as a stub or every month as full. */
const BAR_MAX = 96;

/** "S" — the month initial, in the reader's language. Narrow rather than short:
 *  twelve three-letter labels do not fit across a phone, and the bar beneath
 *  each one carries the value anyway. */
function monthInitial(key: string): string {
  const [year, month] = key.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(getLanguage(), { month: "narrow" }).format(
      new Date(year, month - 1, 1)
    );
  } catch {
    return String(month);
  }
}

/**
 * The caption under a total.
 *
 * Two sentences rather than one, and the second only when it applies: a total
 * drawn from every record in the garage should not carry an apology, and one
 * drawn from three of eleven services must not be read as the whole year. This
 * is the copy half of the rule `src/insights` enforces arithmetically.
 */
function provenance(spend: { pricedCount: number; unpricedCount: number }): string {
  const priced = t("insights.total.priced", { count: spend.pricedCount });
  if (spend.unpricedCount === 0) return priced;
  return `${priced} ${t("insights.total.unpriced", { count: spend.unpricedCount })}`;
}

export default function Insights() {
  const router = useRouter();
  const [records, setRecords] = useState<CostedRecord[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  // On focus, not on mount: logging a service and coming back has to change the
  // number, and this screen is one back-swipe from the form that does it.
  useFocusEffect(
    useCallback(() => {
      setRecords(costedRecords());
      setNames(
        Object.fromEntries(listVehicles().map((v) => [v.id, vehicleDisplayName(v)]))
      );
    }, [])
  );

  const total = spendOf(records);

  // Nothing priced is a different screen from nothing logged, but it is the
  // same dead end: every figure below would render as a row of zeroes, which
  // reads as "your car costs nothing" rather than "you haven't told me yet".
  if (total.pricedCount === 0) {
    return (
      <Screen title={t("insights.title")}>
        <Card>
          <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
            {t("insights.empty.title")}
          </Text>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("insights.empty.body")}
          </Text>
          <Button label={t("insights.empty.cta")} onPress={() => router.replace("/")} />
        </Card>
      </Screen>
    );
  }

  const byVehicle = spendByVehicle(records);
  const byService = spendByService(records);
  const byMonth = spendByMonth(records, MONTHS);
  const peak = Math.max(...byMonth.map((m) => m.total), 1);

  const bucketRow = (b: SpendBucket, label: string) => (
    <ListRow
      key={b.key}
      title={label}
      subtitle={provenance(b)}
      right={
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {formatMoney(b.total)}
        </Text>
      }
    />
  );

  return (
    <Screen title={t("insights.title")}>
      <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
        {t("insights.subtitle")}
      </Text>

      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          {t("insights.total.label")}
        </Text>
        <Text style={{ ...tokens.text.hero, color: tokens.color.text }}>
          {formatMoney(total.total)}
        </Text>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
          {provenance(total)}
        </Text>
      </Card>

      <Card>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {t("insights.byMonth.title")}
        </Text>
        {/* Bars are drawn from Views rather than a charting dependency: twelve
            rectangles against a known maximum is the whole requirement, and a
            chart library would ship a second layout system into a screen that
            already has one. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: BAR_MAX,
            gap: tokens.space.xs,
          }}
        >
          {byMonth.map((m) => (
            <View key={m.key} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
              <View
                style={{
                  width: "100%",
                  // A month with spending never renders as nothing: a 2-point
                  // floor keeps a small month distinguishable from an empty
                  // one, which is a difference the reader cares about.
                  height: m.total === 0 ? 1 : Math.max(2, (m.total / peak) * BAR_MAX),
                  backgroundColor:
                    m.total === 0 ? tokens.color.hairline : tokens.color.metalHi,
                  borderRadius: tokens.radius.sm,
                }}
              />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: tokens.space.xs }}>
          {byMonth.map((m) => (
            <Text
              key={m.key}
              style={{
                ...tokens.text.caption,
                color: tokens.color.textFaint,
                flex: 1,
                textAlign: "center",
              }}
            >
              {monthInitial(m.key)}
            </Text>
          ))}
        </View>
      </Card>

      {/* One vehicle makes this section a restatement of the total above it. */}
      {byVehicle.length > 1 ? (
        <Card>
          <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
            {t("insights.byVehicle.title")}
          </Text>
          {byVehicle.map((b) =>
            bucketRow(b, names[b.key] ?? t("system.vehicle.fallback"))
          )}
        </Card>
      ) : null}

      <Card>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {t("insights.byService.title")}
        </Text>
        {byService.map((b) => bucketRow(b, serviceName(b.key)))}
      </Card>
    </Screen>
  );
}
