import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { Gauge } from "../src/design/Gauge";
import { ListRow } from "../src/design/ListRow";
import { Badge } from "../src/design/Badge";
import { tokens } from "../src/design/tokens";
import { listVehicles, type Vehicle } from "../src/db/vehicles";
import { listRecords } from "../src/db/records";
import { nextDue, dueStatus } from "../src/schedule";
import { getIntervals } from "../src/db/intervals";
import { isPro, presentPaywall } from "../src/purchases";
import { recordReviewEvent } from "../src/review";

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
    const status = dueStatus({ ...due, now, odometer: vehicle.odometer });
    if (best && rank[status] <= rank[best.status]) continue;

    const milesOver =
      due.dueOdometer !== undefined && vehicle.odometer !== undefined
        ? vehicle.odometer - due.dueOdometer
        : undefined;
    const detail =
      status === "due" && milesOver !== undefined && milesOver > 0
        ? `${milesOver.toLocaleString()} mi over`
        : status === "due"
          ? "due now"
          : due.dueAt
            ? new Date(due.dueAt).toLocaleDateString()
            : status === "soon"
              ? "due soon"
              : "on schedule";
    best = { status, label: r.service_type, detail };
  }

  // No record carries a known interval — say that, rather than claiming
  // nothing was logged when the user may have logged plenty.
  if (!best) {
    return records.length > 0
      ? { status: "ok", label: "No schedule yet", detail: "logged, not tracked" }
      : { status: "ok", label: "Nothing logged", detail: "add a service" };
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
        setMsg("Could not reach the store. Try again on a better connection.");
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
      title="Garage"
      footer={
        <>
          {msg ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
          ) : null}
          {single ? <Button label="Log a service" onPress={onLog} /> : null}
          <Button
            label="Add vehicle"
            variant={vehicles.length > 0 ? "secondary" : "primary"}
            onPress={onAdd}
          />
        </>
      }
    >
      {vehicles.length === 0 ? (
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No vehicles yet. Add one and Glovebox starts keeping its records.
          </Text>
        </Card>
      ) : (
        vehicles.map((v) => {
          const s = summarize(v);
          return (
            <Card key={v.id} status={s.status === "due" ? "overdue" : undefined}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>{v.name}</Text>
                {s.status === "ok" ? null : (
                  <Badge label={s.status === "due" ? "Overdue" : "Due soon"} tone={s.status} />
                )}
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
                <Gauge
                  legend="Odometer"
                  value={v.odometer ? v.odometer.toLocaleString() : "—"}
                  unit={v.odometer ? "mi" : undefined}
                  align="right"
                />
              </View>

              <View style={{ paddingTop: tokens.space.xs }}>
                <ListRow
                  title={single ? "Open history" : "Open and log a service"}
                  onPress={() => router.push(`/vehicle/${v.id}`)}
                />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
