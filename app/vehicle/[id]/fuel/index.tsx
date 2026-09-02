import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Button } from "../../../../src/design/Button";
import { Glass } from "../../../../src/design/Glass";
import { ListRow } from "../../../../src/design/ListRow";
import { Badge } from "../../../../src/design/Badge";
import { tokens } from "../../../../src/design/tokens";
import {
  listFuelEntries,
  softDeleteFuelEntry,
  undoDeleteFuelEntry,
  type FuelRow,
} from "../../../../src/db/fuel";
import { formatVolume } from "../../../../src/fuel/format";
import { t, formatDate } from "../../../../src/i18n";
import { formatMoney } from "../../../../src/money";
import { formatDistance } from "../../../../src/units/format";

const UNDO_WINDOW_MS = 8000;

/**
 * The facts a fill can carry, as one message per combination — the same rule
 * the service history follows, because the middot between them is punctuation a
 * translator has to be able to move. The existing `vehicle.row.*` messages
 * already say "date · distance · cost", which is exactly a fill, so the fuel
 * catalog does not carry a second drifting copy of them.
 */
function fillSubtitle(entry: FuelRow): string {
  const date = formatDate(entry.filled_at);
  const distance = formatDistance(entry.odometer);
  const cost = entry.cost ? formatMoney(entry.cost) : undefined;
  return cost
    ? t("vehicle.row.dateDistanceCost", { date, distance, cost })
    : t("vehicle.row.dateDistance", { date, distance });
}

/**
 * Every fill for one vehicle.
 *
 * Its own screen rather than a longer block on the vehicle detail: after a few
 * months this is forty rows, and forty fill-ups above the service history would
 * bury the thing the app exists for.
 */
export default function FuelHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<FuelRow[]>([]);
  const [undoId, setUndoId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => setEntries(listFuelEntries(id)), [id]);

  useFocusEffect(refresh);

  // Without this the pending timer fires after the screen is gone and sets
  // state on an unmounted component.
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  /**
   * No `rescheduleAll` here, unlike the service history's delete.
   *
   * A reminder is derived from the vehicle's odometer, and deleting a fill
   * never walks that reading backwards — the highest reading the car ever had
   * is still the reading it has. What the delete does change is the next full
   * tank's figure, which is inherent to the math and needs no invalidation:
   * nothing is cached, so the next render recomputes it.
   */
  function onDelete(entryId: string) {
    softDeleteFuelEntry(entryId);
    refresh();
    setUndoId(entryId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoId(null), UNDO_WINDOW_MS);
  }

  function onUndo() {
    if (!undoId) return;
    undoDeleteFuelEntry(undoId);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoId(null);
    refresh();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("fuel.history.title") }} />
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{
          padding: tokens.space.md,
          paddingBottom: tokens.space.xxl + tokens.space.xl,
          gap: tokens.space.xs,
        }}
        ListEmptyComponent={
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("fuel.history.empty")}
          </Text>
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
                <Text style={{ ...tokens.text.legend, color: tokens.color.white }}>
                  {t("fuel.swipe.delete")}
                </Text>
              </Pressable>
            )}
          >
            <ListRow
              title={formatVolume(item.volume)}
              subtitle={fillSubtitle(item)}
              status="ok"
              // Marked rather than left to be inferred: a part fill is the row a
              // user will want to find when a tank's figure looks wrong.
              right={
                item.full === 1 ? undefined : (
                  <Badge label={t("fuel.row.partial")} tone="soon" />
                )
              }
            />
          </Swipeable>
        )}
      />

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
                  {t("fuel.deleted")}
                </Text>
                <Text style={{ ...tokens.text.legend, fontSize: 14, color: tokens.color.white }}>
                  {t("fuel.undo")}
                </Text>
              </View>
            </Pressable>
          ) : null}
          <Button label={t("fuel.log")} onPress={() => router.push(`/vehicle/${id}/fuel/new`)} />
        </View>
      </Glass>
    </SafeAreaView>
  );
}
