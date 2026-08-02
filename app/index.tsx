import { useCallback, useState } from "react";
import { Text } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
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

function worstStatus(vehicle: Vehicle): "due" | "soon" | "ok" {
  const records = listRecords(vehicle.id);
  const seen = new Set<string>();
  const now = new Date().toISOString();
  let worst: "due" | "soon" | "ok" = "ok";
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
    const s = dueStatus({ ...due, now, odometer: vehicle.odometer });
    if (s === "due") return "due";
    if (s === "soon") worst = "soon";
  }
  return worst;
}

export default function Garage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useFocusEffect(useCallback(() => setVehicles(listVehicles()), []));

  async function onAdd() {
    if (vehicles.length >= 1 && !(await isPro())) {
      const purchased = await presentPaywall();
      if (!purchased) return;
    }
    router.push("/vehicle/new");
  }

  return (
    <Screen title="Garage">
      {vehicles.length === 0 ? (
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            Add your car to start logging service. Everything stays on this phone.
          </Text>
        </Card>
      ) : (
        <Card>
          {vehicles.map((v) => {
            const s = worstStatus(v);
            return (
              <ListRow
                key={v.id}
                title={v.name}
                subtitle={v.odometer ? `${v.odometer.toLocaleString()} mi` : "No mileage yet"}
                right={<Badge label={s === "due" ? "Due" : s === "soon" ? "Soon" : "OK"} tone={s} />}
                onPress={() => router.push(`/vehicle/${v.id}`)}
              />
            );
          })}
        </Card>
      )}
      <Button label="Add vehicle" onPress={onAdd} />
      <Link href="/settings" style={{ color: tokens.color.textMuted, textAlign: "center" }}>
        Settings
      </Link>
    </Screen>
  );
}
