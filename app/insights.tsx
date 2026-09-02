import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { tokens } from "../src/design/tokens";
import { costedRecords } from "../src/db/records";
import { allFuelEntries } from "../src/db/fuel";
import { listVehicles } from "../src/db/vehicles";
import {
  spendByMonth,
  spendByService,
  spendByVehicle,
  spendOf,
  type CostedRecord,
  type Spend,
  type SpendBucket,
} from "../src/insights";
import {
  averageEfficiency,
  costPerDistance,
  fuelSpend,
  fuelSpendByMonth,
  type FuelEntry,
} from "../src/fuel";
import { currentFuelUnits, formatEfficiency } from "../src/fuel/format";
import { isPro, presentPaywall } from "../src/purchases";
import { useIsPro } from "../src/purchases/useIsPro";
import { recordReviewEvent } from "../src/review";
import { track } from "../src/analytics";
import { distanceUnitLabel } from "../src/units/format";
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

/** The caption under a fuel figure, under the same rule as the service one:
 *  a total drawn from nine of eleven fills must say so. */
function fuelProvenance(spend: Spend): string {
  const priced = t("fuel.card.fills", { count: spend.pricedCount });
  if (spend.unpricedCount === 0) return priced;
  return `${priced} ${t("fuel.card.unpriced", { count: spend.unpricedCount })}`;
}

export default function Insights() {
  const router = useRouter();
  const [records, setRecords] = useState<CostedRecord[]>([]);
  const [fuel, setFuel] = useState<FuelEntry[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  // A purchase made from the card below unlocks it without waiting for the
  // entitlement listener to come back around.
  const [unlocked, setUnlocked] = useState(false);
  const pro = useIsPro();

  // On focus, not on mount: logging a service and coming back has to change the
  // number, and this screen is one back-swipe from the form that does it.
  useFocusEffect(
    useCallback(() => {
      setRecords(costedRecords());
      setFuel(allFuelEntries());
      setNames(
        Object.fromEntries(listVehicles().map((v) => [v.id, vehicleDisplayName(v)]))
      );
    }, [])
  );

  const total = spendOf(records);
  const fuelTotal = fuelSpend(fuel);

  /**
   * Gated before the figures, the way Add vehicle and Intervals are: showing
   * someone the numbers and only refusing afterwards wastes their time, and
   * showing them nothing at all sells nothing — the fills they have already
   * logged are what makes the upgrade worth anything.
   */
  async function onUnlockFuel() {
    try {
      if (!(await isPro())) {
        track("fuel_card_paywall");
        const purchased = await presentPaywall();
        if (!purchased) return;
        recordReviewEvent("purchase");
      }
    } catch {
      // `presentPaywall` rejects when RevenueCat has no products to show — no
      // API key in the build, no network, StoreKit still fetching. Unhandled,
      // that is a card that does nothing and says nothing.
      setMsg(t("settings.store.error"));
      return;
    }
    setMsg("");
    setUnlocked(true);
  }

  // Nothing priced is a different screen from nothing logged, but it is the
  // same dead end: every figure below would render as a row of zeroes, which
  // reads as "your car costs nothing" rather than "you haven't told me yet".
  // Both empty, not just the services: a garage with priced fills and no priced
  // service is a screen with something to say, and the early return would have
  // swallowed the fuel card with it.
  if (total.pricedCount === 0 && fuelTotal.pricedCount === 0) {
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

  const { style } = currentFuelUnits();
  const fuelUnlocked = pro === true || unlocked;
  const fuelAverage = averageEfficiency(fuel, style);
  // Per 100 rather than per 1: fuel costs a fraction of a currency unit per
  // mile, and formatMoney is whole units by design — "$0" per mile is a figure
  // that tells the reader nothing. Scaling the distance is honest where
  // loosening the money format would have made every other total noisier.
  const perDistance = costPerDistance(fuel);
  const perHundred = perDistance === null ? null : perDistance * 100;
  const fuelByMonth = fuelSpendByMonth(fuel, MONTHS);
  const fuelPeak = Math.max(...fuelByMonth.map((m) => m.total), 1);

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
  
      {/* Fuel, below the service sections and never folded into them. The two
          are different bills answering different questions, and a fuel spend
          summed into "what the garage has cost" would make the annual figure
          unrecognisable to the person who logged it. */}
      <Card>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {t("fuel.card.title")}
        </Text>
        {fuelUnlocked ? (
          fuelAverage === null && fuelTotal.pricedCount === 0 ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
              {t("fuel.card.empty")}
            </Text>
          ) : (
            <>
              {fuelAverage !== null ? (
                <ListRow
                  title={t("fuel.card.efficiency")}
                  subtitle={t("fuel.card.months")}
                  right={
                    <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
                      {formatEfficiency(fuelAverage, style)}
                    </Text>
                  }
                />
              ) : (
                <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
                  {t("fuel.card.empty")}
                </Text>
              )}
              <ListRow
                title={t("fuel.card.spend")}
                subtitle={fuelProvenance(fuelTotal)}
                right={
                  <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
                    {formatMoney(fuelTotal.total)}
                  </Text>
                }
              />
              {perHundred !== null ? (
                <ListRow
                  title={t("fuel.card.perDistance", { unit: distanceUnitLabel() })}
                  right={
                    <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
                      {formatMoney(perHundred)}
                    </Text>
                  }
                />
              ) : null}
              {/* The same bars as the costs chart above, deliberately: two
                  charts on one screen drawn two ways read as two screens. */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  height: BAR_MAX,
                  gap: tokens.space.xs,
                }}
              >
                {fuelByMonth.map((m) => (
                  <View
                    key={m.key}
                    style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: m.total === 0 ? 1 : Math.max(2, (m.total / fuelPeak) * BAR_MAX),
                        backgroundColor:
                          m.total === 0 ? tokens.color.hairline : tokens.color.metalHi,
                        borderRadius: tokens.radius.sm,
                      }}
                    />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: tokens.space.xs }}>
                {fuelByMonth.map((m) => (
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
            </>
          )
        ) : (
          <>
            <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
              {t("fuel.card.locked.title")}
            </Text>
            <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
              {t("fuel.card.locked.body")}
            </Text>
            <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
              {fuelProvenance(fuelTotal)}
            </Text>
            <Button label={t("fuel.card.locked.cta")} onPress={onUnlockFuel} />
            {msg ? (
              <Text style={{ ...tokens.text.caption, color: tokens.color.red }}>{msg}</Text>
            ) : null}
          </>
        )}
      </Card>
    </Screen>
  );
}
