import { useCallback, useRef, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Button } from "../../src/design/Button";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { getVehicle, type Vehicle } from "../../src/db/vehicles";
import {
  listRecords,
  softDeleteRecord,
  undoDelete,
  type ServiceRecord,
} from "../../src/db/records";
import { nextDue, dueStatus, DEFAULT_INTERVALS } from "../../src/schedule";

type DueItem = { type: string; status: "due" | "soon"; line: string };

function dueItems(vehicle: Vehicle, records: ServiceRecord[]): DueItem[] {
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const items: DueItem[] = [];

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
    if (status === "ok") continue;

    const milesOver =
      due.dueOdometer !== undefined && vehicle.odometer !== undefined
        ? vehicle.odometer - due.dueOdometer
        : undefined;
    const line =
      status === "due" && milesOver !== undefined && milesOver > 0
        ? `${milesOver.toLocaleString()} mi over`
        : due.dueAt
          ? `due ${new Date(due.dueAt).toLocaleDateString()}`
          : status === "due"
            ? "due now"
            : "due soon";
    items.push({ type: r.service_type, status, line });
  }
  return items;
}

const UNDO_WINDOW_MS = 8000;

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [undoId, setUndoId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    setVehicle(getVehicle(id));
    setRecords(listRecords(id));
  }, [id]);

  useFocusEffect(refresh);

  function onDelete(recordId: string) {
    softDeleteRecord(recordId);
    refresh();
    setUndoId(recordId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoId(null), UNDO_WINDOW_MS);
  }

  function onUndo() {
    if (!undoId) return;
    undoDelete(undoId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoId(null);
    refresh();
  }

  const due = vehicle ? dueItems(vehicle, records) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }} edges={["bottom"]}>
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.xs }}
        ListHeaderComponent={
          <View style={{ gap: tokens.space.xs, paddingBottom: tokens.space.md }}>
            <Text style={{ ...tokens.text.title, ...tokens.text.numeric, color: tokens.color.text }}>
              {vehicle?.odometer ? `${vehicle.odometer.toLocaleString()} mi` : "No mileage yet"}
            </Text>
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              {[vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ") || " "}
            </Text>

            {due.length > 0 ? (
              <View style={{ paddingTop: tokens.space.lg, gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                  DUE NOW
                </Text>
                {due.map((d) => (
                  <ListRow
                    key={d.type}
                    title={d.type}
                    subtitle={d.line}
                    right={<Badge label={d.status === "due" ? "Due" : "Soon"} tone={d.status} />}
                  />
                ))}
              </View>
            ) : null}

            <Text
              style={{
                ...tokens.text.caption,
                color: tokens.color.textMuted,
                paddingTop: tokens.space.lg,
              }}
            >
              HISTORY
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No service logged yet. Log the last thing you had done.
          </Text>
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item.id)}
                style={{
                  justifyContent: "center",
                  paddingHorizontal: tokens.space.md,
                  backgroundColor: tokens.color.due,
                  borderRadius: tokens.radius.sm,
                }}
              >
                <Text style={{ ...tokens.text.body, color: tokens.color.text }}>Delete</Text>
              </Pressable>
            )}
          >
            <ListRow
              title={item.service_type}
              subtitle={`${item.performed_at.slice(0, 10)}${
                item.odometer ? ` · ${item.odometer.toLocaleString()} mi` : ""
              }`}
            />
          </Swipeable>
        )}
      />
      {undoId ? (
        <Pressable
          onPress={onUndo}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            margin: tokens.space.md,
            padding: tokens.space.md,
            backgroundColor: tokens.color.surfaceAlt,
            borderRadius: tokens.radius.md,
          }}
        >
          <Text style={{ ...tokens.text.body, color: tokens.color.text }}>Service deleted</Text>
          <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.accent }}>
            Undo
          </Text>
        </Pressable>
      ) : (
        <View style={{ padding: tokens.space.md }}>
          <Button label="Log a service" onPress={() => router.push(`/vehicle/${id}/log`)} />
        </View>
      )}
    </SafeAreaView>
  );
}
