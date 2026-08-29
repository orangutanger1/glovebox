import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { Gauge } from "../src/design/Gauge";
import { Badge } from "../src/design/Badge";
import { tokens } from "../src/design/tokens";
import { listVehicles, type Vehicle } from "../src/db/vehicles";
import { listRecords } from "../src/db/records";
import { nextDue, dueStatus } from "../src/schedule";
import { getIntervals } from "../src/db/intervals";
import { isPro, presentPaywall } from "../src/purchases";
import { recordReviewEvent } from "../src/review";
import { t, formatNumber, formatDate } from "../src/i18n";
import { getDistanceUnit } from "../src/units";
import { formatDistance, distanceUnitLabel } from "../src/units/format";
import { serviceName } from "../src/schedule/names";

type Summary = { status: "due" | "soon" | "ok"; label: string; detail: string };

/**
 * The worst status across a vehicle's tracked services, plus the readout that
 * explains it. A magnitude ("400 mi over") is more use at a glance than a date
 * the reader has to subtract from today.
 */
function summarize(vehicle: Vehicle): Summary {
  const records = listRecords(vehicle.id);
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const rank = { due: 2, soon: 1, ok: 0 } as const;
  const intervals = getIntervals();
  const unit = getDistanceUnit();

  let best: Summary | null = null;

  for (const r of records) {
    if (seen.has(r.service_type)) continue;
    seen.add(r.service_type);
    const interval = intervals[r.service_type];
    if (!interval) continue;
    const due = nextDue({
      lastPerformedAt: r.performed_at,
      lastOdometer: r.odometer,
      interval,
    });
    const status = dueStatus({ ...due, now, odometer: vehicle.odometer, unit });
    if (best && rank[status] <= rank[best.status]) continue;

    const overBy =
      due.dueOdometer !== undefined && vehicle.odometer !== undefined
        ? vehicle.odometer - due.dueOdometer
        : undefined;
    const detail =
      status === "due" && overBy !== undefined && overBy > 0
        ? t("garage.over", { distance: formatDistance(overBy, unit) })
        : status === "due"
          ? t("garage.dueNow")
          : due.dueAt
            ? formatDate(due.dueAt)
            : status === "soon"
              ? t("garage.dueSoon")
              : t("garage.onSchedule");
    best = { status, label: serviceName(r.service_type), detail };
  }

  // No record carries a known interval — say that, rather than claiming
  // nothing was logged when the user may have logged plenty.
  if (!best) {
    return records.length > 0
      ? {
          status: "ok",
          label: t("garage.noSchedule"),
          detail: t("garage.noSchedule.detail"),
        }
      : {
          status: "ok",
          label: t("garage.nothingLogged"),
          detail: t("garage.nothingLogged.detail"),
        };
  }
  return best;
}

export default function Garage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState("");

  useFocusEffect(useCallback(() => setVehicles(listVehicles()), []));

  async function onAdd() {
    // Paywall before the form, never after. Making someone fill in a form and
    // then telling them it costs money is the worst version of this moment.
    //
    // Wrapped for the same reason Settings wraps its copy of this gate:
    // `presentPaywall` rejects when RevenueCat has no products to show — no
    // API key in the build, no network, StoreKit still fetching — and an
    // unhandled rejection here is a button that does nothing and says nothing.
    if (vehicles.length >= 1) {
      try {
        if (!(await isPro())) {
          const purchased = await presentPaywall();
          if (!purchased) return;
          // Paying is the strongest thing a user can say about an app, and it
          // is worth the most for the longest. Recorded only — the ask itself
          // waits for a later completed action, because a rating prompt stacked
          // on top of a purchase confirmation is two modals about money in a row.
          recordReviewEvent("purchase");
        }
      } catch {
        setMsg(t("garage.storeUnreachable"));
        return;
      }
    }
    setMsg("");
    router.push("/vehicle/new");
  }

  // One vehicle: skip the picker and go straight to logging. With several,
  // the user has to say which car — sending them to the first vehicle's detail
  // screen silently picked one for them.
  function onLog() {
    if (vehicles.length === 1) router.push(`/vehicle/${vehicles[0].id}/log`);
  }

  const single = vehicles.length === 1;

  return (
    <Screen
      title={t("garage.title")}
      footer={
        <>
          {msg ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
          ) : null}
          {single ? <Button label={t("garage.logService")} onPress={onLog} /> : null}
          <Button
            label={t("garage.addVehicle")}
            variant={vehicles.length > 0 ? "secondary" : "primary"}
            onPress={onAdd}
          />
        </>
      }
    >
      {vehicles.length === 0 ? (
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("garage.empty")}
          </Text>
        </Card>
      ) : (
        vehicles.map((v) => {
          const s = summarize(v);
          return (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              onPress={() => router.push(`/vehicle/${v.id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card status={s.status === "due" ? "overdue" : undefined}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: tokens.space.sm,
                  }}
                >
                  <Text style={{ ...tokens.text.heading, color: tokens.color.text, flex: 1 }}>
                    {v.name}
                  </Text>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}
                  >
                    {s.status === "ok" ? null : (
                      <Badge
                        label={
                          s.status === "due"
                            ? t("garage.badge.overdue")
                            : t("garage.badge.dueSoon")
                        }
                        tone={s.status}
                      />
                    )}
                    <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>›</Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingTop: tokens.space.xs,
                  }}
                >
                  <Gauge
                    legend={s.label}
                    value={s.detail}
                    lamp={s.status === "due" ? true : s.status === "soon" ? false : undefined}
                  />
                  {/* An estimate says so in the legend rather than beside the
                      number: the readout is a distance and the parenthesis would
                      read as part of it. A reading the app worked out from the
                      model year is still worth showing, and is not worth showing
                      as though somebody had read it off the dash. */}
                  <Gauge
                    legend={
                      v.odometer && v.odometer_estimated
                        ? t("garage.odometer.estimated")
                        : t("garage.odometer")
                    }
                    value={v.odometer ? formatNumber(v.odometer) : t("garage.odometer.notSet")}
                    unit={v.odometer ? distanceUnitLabel() : undefined}
                    align="right"
                  />
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
