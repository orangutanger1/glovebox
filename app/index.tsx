import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { Badge } from "../src/design/Badge";
import { tokens } from "../src/design/tokens";
import { listVehicles, type Vehicle } from "../src/db/vehicles";
import { listRecords } from "../src/db/records";
import { nextDue, dueStatus, DEFAULT_INTERVALS } from "../src/schedule";
import { isPro, presentPaywall } from "../src/purchases";

/**
 * The worst status across a vehicle's tracked services, plus the sentence that
 * explains it. A magnitude ("400 mi over") is more use at a glance than a date
 * the reader has to subtract from today.
 */
function summarize(vehicle: Vehicle): { status: "due" | "soon" | "ok"; line: string } {
  const records = listRecords(vehicle.id);
  const seen = new Set<string>();
  const now = new Date().toISOString();
  let best: { status: "due" | "soon" | "ok"; line: string } = {
    status: "ok",
    line: "Nothing logged yet",
  };
  const rank = { due: 2, soon: 1, ok: 0 } as const;

  for (const r of records) {
    if (seen.has(r.service_type)) continue;
    seen.add(r.service_type);
    const interval = DEFAULT_INTERVALS[r.service_type];
    if (!interval) continue;
    const due = nextDue({
      lastPerformedAt: r.performed_at,
      lastOdometer: r.odometer,
      interval,
    });
    const status = dueStatus({ ...due, now, odometer: vehicle.odometer });
    if (best.line !== "Nothing logged yet" && rank[status] <= rank[best.status]) continue;

    const milesOver =
      due.dueOdometer !== undefined && vehicle.odometer !== undefined
        ? vehicle.odometer - due.dueOdometer
        : undefined;
    const line =
      status === "due" && milesOver !== undefined && milesOver > 0
        ? `${r.service_type}, ${milesOver.toLocaleString()} mi over`
        : status === "due"
          ? `${r.service_type} is due`
          : status === "soon"
            ? `${r.service_type} due soon`
            : `Next: ${r.service_type}`;
    best = { status, line };
  }
  return best;
}

export default function Garage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useFocusEffect(useCallback(() => setVehicles(listVehicles()), []));

  async function onAdd() {
    // Paywall before the form, never after. Making someone fill in a form and
    // then telling them it costs money is the worst version of this moment.
    if (vehicles.length >= 1 && !(await isPro())) {
      const purchased = await presentPaywall();
      if (!purchased) return;
    }
    router.push("/vehicle/new");
  }

  // One vehicle: skip the picker and go straight to logging.
  function onLog() {
    if (vehicles.length === 1) router.push(`/vehicle/${vehicles[0].id}/log`);
    else if (vehicles.length > 1) router.push(`/vehicle/${vehicles[0].id}`);
  }

  return (
    <Screen title="Garage">
      {vehicles.length === 0 ? (
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No vehicles. Add one to start logging.
          </Text>
        </Card>
      ) : (
        <Card>
          {vehicles.map((v) => {
            const { status, line } = summarize(v);
            const miles = v.odometer ? `${v.odometer.toLocaleString()} mi · ` : "";
            return (
              <ListRow
                key={v.id}
                title={v.name}
                subtitle={`${miles}${line}`}
                right={
                  status === "ok" ? null : (
                    <Badge label={status === "due" ? "Due" : "Soon"} tone={status} />
                  )
                }
                onPress={() => router.push(`/vehicle/${v.id}`)}
              />
            );
          })}
        </Card>
      )}
      {vehicles.length > 0 ? <Button label="Log a service" onPress={onLog} /> : null}
      <Button
        label="Add vehicle"
        variant={vehicles.length > 0 ? "secondary" : "primary"}
        onPress={onAdd}
      />
    </Screen>
  );
}
