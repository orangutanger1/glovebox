import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Button } from "../../src/design/Button";
import { ListRow } from "../../src/design/ListRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle, type Vehicle } from "../../src/db/vehicles";
import { listRecords, type ServiceRecord } from "../../src/db/records";

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setVehicle(getVehicle(id));
      setRecords(listRecords(id));
    }, [id])
  );

  return (
    <Screen title={vehicle?.name ?? "Vehicle"}>
      <Button label="Log a service" onPress={() => router.push(`/vehicle/${id}/log`)} />
      <Card>
        {records.length === 0 ? (
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No service logged yet.
          </Text>
        ) : (
          records.map((r) => (
            <ListRow
              key={r.id}
              title={r.service_type}
              subtitle={`${r.performed_at.slice(0, 10)}${
                r.odometer ? ` · ${r.odometer.toLocaleString()} mi` : ""
              }`}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
