import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Button } from "../../src/design/Button";
import { Gauge } from "../../src/design/Gauge";
import { Glass } from "../../src/design/Glass";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { getVehicle, softDeleteVehicle, type Vehicle } from "../../src/db/vehicles";
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

function SectionLegend({ children }: { children: string }) {
  return (
    <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{children}</Text>
  );
}

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

  // Without this the pending timer fires after the screen is gone and sets
  // state on an unmounted component.
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function onDelete(recordId: string) {
    softDeleteRecord(recordId);
    refresh();
    setUndoId(recordId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoId(null), UNDO_WINDOW_MS);
  }

  // Two steps on purpose: this is the one action that takes a whole history
  // out of the app at once, so it asks by name and the destructive choice is
  // never the default button. The row is tombstoned, not dropped, so the
  // records stay in the CSV export.
  function onDeleteVehicle() {
    if (!vehicle) return;
    Alert.alert(
      `Delete ${vehicle.name}?`,
      "It leaves your garage along with its service history. Records already exported stay in that file.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            softDeleteVehicle(vehicle.id);
            // replace, not back: the detail screen for a hidden vehicle would
            // render an empty cluster if it were left on the stack.
            router.replace("/");
          },
        },
      ]
    );
  }

  function onUndo() {
    if (!undoId) return;
    undoDelete(undoId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoId(null);
    refresh();
  }

  const due = vehicle ? dueItems(vehicle, records) : [];
  const spec = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  const lastService = records[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }} edges={["bottom"]}>
      {/* The header is the only place the vehicle is named, so it is set from
          the row rather than left as the route pattern. */}
      <Stack.Screen options={{ title: vehicle?.name ?? "Vehicle" }} />
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          padding: tokens.space.md,
          paddingBottom: tokens.space.xxl + tokens.space.xl,
          gap: tokens.space.xs,
        }}
        ListHeaderComponent={
          <View style={{ gap: tokens.space.md, paddingBottom: tokens.space.md }}>
            {/* The cluster: everything the driver wants without scrolling. */}
            <Panel>
              <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between", gap: tokens.space.md }}
                >
                  <Gauge
                    legend="Odometer"
                    value={vehicle?.odometer ? vehicle.odometer.toLocaleString() : "—"}
                    unit={vehicle?.odometer ? "mi" : undefined}
                  />
                  <Gauge
                    legend="Last service"
                    value={lastService ? lastService.performed_at.slice(0, 10) : "—"}
                    align="right"
                  />
                </View>
                {spec ? (
                  <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
                    {spec}
                  </Text>
                ) : null}
              </View>
            </Panel>

            {due.length > 0 ? (
              <View style={{ gap: tokens.space.xs }}>
                <SectionLegend>Due now</SectionLegend>
                {due.map((d) => (
                  <ListRow
                    key={d.type}
                    title={d.type}
                    subtitle={d.line}
                    status={d.status === "due" ? "overdue" : "soon"}
                    right={<Badge label={d.status === "due" ? "Overdue" : "Soon"} tone={d.status} />}
                  />
                ))}
              </View>
            ) : null}

            <SectionLegend>History</SectionLegend>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No service logged yet. Log the last thing you had done.
          </Text>
        }
        ListFooterComponent={
          vehicle ? (
            <View style={{ paddingTop: tokens.space.xl }}>
              <Button label="Delete vehicle" variant="danger" onPress={onDeleteVehicle} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item.id)}
                style={{
                  justifyContent: "center",
                  marginLeft: tokens.space.sm,
                  paddingHorizontal: tokens.space.md,
                  backgroundColor: tokens.color.red,
                  borderRadius: tokens.radius.sm,
                }}
              >
                <Text style={{ ...tokens.text.legend, color: tokens.color.white }}>Delete</Text>
              </Pressable>
            )}
          >
            <ListRow
              title={item.service_type}
              subtitle={`${item.performed_at.slice(0, 10)}${
                item.odometer ? ` · ${item.odometer.toLocaleString()} mi` : ""
              }${item.cost ? ` · $${item.cost.toLocaleString()}` : ""}`}
              status="ok"
            />
          </Swipeable>
        )}
      />

      {/* The undo bar sits above the action rather than replacing it — losing
          the primary button for eight seconds after a delete is its own bug. */}
      <Glass edge="top">
        <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
          {undoId ? (
            <Pressable onPress={onUndo}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: tokens.space.md,
                  borderRadius: tokens.radius.sm,
                  backgroundColor: tokens.color.redWash,
                  borderWidth: 1,
                  borderColor: tokens.color.red,
                }}
              >
                <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                  Service deleted
                </Text>
                <Text style={{ ...tokens.text.legend, fontSize: 14, color: tokens.color.white }}>
                  Undo
                </Text>
              </View>
            </Pressable>
          ) : null}
          <Button label="Log a service" onPress={() => router.push(`/vehicle/${id}/log`)} />
        </View>
      </Glass>
    </SafeAreaView>
  );
}
