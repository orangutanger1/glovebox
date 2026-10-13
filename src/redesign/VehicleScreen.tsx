import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Button } from "../design/Button";
import { Glass } from "../design/Glass";
import { ListRow } from "../design/ListRow";
import { tokens } from "../design/tokens";
import { Mascot } from "../mascot/Mascot";
import { takeLogged } from "../mascot/celebrate";
import { lifeLeft } from "../mascot/mood";
import { getVehicle, softDeleteVehicle, type Vehicle } from "../db/vehicles";
import {
  listRecords,
  softDeleteRecord,
  undoDelete,
  type ServiceRecord,
} from "../db/records";
import { listFuelEntries, type FuelRow } from "../db/fuel";
import { listDocuments, type GloveboxDocument } from "../db/documents";
import { getIntervals } from "../db/intervals";
import { formatVolume } from "../fuel/format";
import { rescheduleAll } from "../notify";
import { t, formatDate, formatDueIn, formatNumber } from "../i18n";
import { getDistanceUnit } from "../units";
import { distanceUnitLabel } from "../units/format";
import { serviceName } from "../schedule/names";
import { RecallsSection } from "../recalls/RecallsSection";
import { GloveboxSection } from "../documents/GloveboxSection";
import { TREAD_SERVICE } from "../tires/tread";
import { FuelSummary, fillSubtitle, recordSubtitle } from "../vehicles/rows";
import { UpcomingRow } from "./icons";
import {
  byUrgency,
  PLAN_BASIS,
  planCompleteness,
  todayTasks,
  upcomingItems,
  vehicleView,
} from "./model";
import { taskDetail, taskTitle, whenLabel } from "./copy";
import {
  CelebrateToast,
  GlassCard,
  LifeBar,
  Ring,
  Segmented,
  SectionTitle,
  TaskRow,
} from "./ui";

type Pane = "todo" | "plan" | "history";

/** Same windows as the classic screen: eight seconds to undo, three fills. */
const UNDO_WINDOW_MS = 8000;
const RECENT_FILLS = 3;

/**
 * Arm A's vehicle screen, after Planta's plant page: the car's face, one
 * banner for the next thing it needs, and three panes — To-do (what is due,
 * recalls, papers), Care plan (every interval and how much of it is left, and
 * what would make the plan more accurate) and History (fuel and the log).
 *
 * Every write is the classic screen's: the same soft delete with an undo, the
 * same confirmation to remove the car, the same routes for logging, fuel,
 * documents, the check-in and renaming.
 */
export function RedesignVehicle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [fuel, setFuel] = useState<FuelRow[]>([]);
  const [documents, setDocuments] = useState<GloveboxDocument[]>([]);
  const [pane, setPane] = useState<Pane>("todo");
  const [undoId, setUndoId] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    setVehicle(getVehicle(id));
    setRecords(listRecords(id));
    setFuel(listFuelEntries(id));
    setDocuments(listDocuments(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const logged = takeLogged();
      if (logged) setCelebrated(serviceName(logged.service));
    }, [refresh]),
  );

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const open = (path: string) => router.push(path as never);
  const intervals = useMemo(() => getIntervals(), [records]);
  const unit = getDistanceUnit();
  const now = new Date().toISOString();
  const view = vehicle
    ? vehicleView({ vehicle, records, intervals, unit, now })
    : null;
  const tasks = view ? todayTasks([view]) : [];
  const upcoming = view ? upcomingItems([view]) : [];
  const plan = view ? planCompleteness(view) : null;
  const spec = [vehicle?.year, vehicle?.make, vehicle?.model]
    .filter(Boolean)
    .join(" ");
  const next = view?.next;
  const lastOfNext = next ? formatDate(next.last.performed_at) : null;

  function onDelete(recordId: string) {
    softDeleteRecord(recordId);
    refresh();
    rescheduleAll().catch(() => {});
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
    rescheduleAll().catch(() => {});
  }

  function onDeleteVehicle() {
    if (!vehicle) return;
    Alert.alert(
      t("vehicle.delete.title", { name: vehicle.name }),
      t("vehicle.delete.body"),
      [
        { text: t("vehicle.delete.cancel"), style: "cancel" },
        {
          text: t("vehicle.delete.confirm"),
          style: "destructive",
          onPress: () => {
            softDeleteVehicle(vehicle.id);
            rescheduleAll().catch(() => {});
            if (router.canGoBack()) router.back();
            else router.replace("/");
          },
        },
      ],
    );
  }

  function logType(type?: string) {
    open(
      type
        ? `/vehicle/${id}/log?type=${encodeURIComponent(type)}`
        : `/vehicle/${id}/log`,
    );
  }

  // The car stands on the page, looping in its mood (its loop is drawn on the
  // page colour, so never on a card), with the reading under it.
  const hero = (
    <View style={{ alignItems: "center", gap: tokens.space.xs }}>
      <Mascot
        mood={celebrated ? "celebrating" : (view?.mood ?? "sleepy")}
        size={168}
        animate
      />
      <View style={{ alignItems: "center", gap: 2 }}>
        <Text style={{ ...tokens.text.readout, color: tokens.color.text }}>
          {vehicle?.odometer !== undefined
            ? `${formatNumber(vehicle.odometer)} ${distanceUnitLabel()}`
            : t("vehicle.odometer.notSet")}
        </Text>
        {spec ? (
          <Text
            style={{ ...tokens.text.caption, color: tokens.color.textFaint }}
          >
            {spec}
          </Text>
        ) : null}
        {vehicle ? (
          <Pressable
            onPress={() => open(`/checkin?vehicle=${id}&source=vehicle`)}
            accessibilityRole="button"
            hitSlop={8}
            style={{ paddingTop: tokens.space.xs }}
          >
            {({ pressed }) => (
              <Text
                style={{
                  ...tokens.text.legend,
                  fontWeight: "600",
                  color: pressed ? tokens.color.text : tokens.color.accent,
                }}
              >
                {t("checkin.update")}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  // Planta's "Regular watering: in 10 days · Last: yesterday" banner.
  const banner = (
    <Pressable
      onPress={() => (next ? logType(next.type) : logType())}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <GlassCard
          tone={next?.status === "due" ? "alarm" : "accent"}
          style={{ opacity: pressed ? 0.85 : 1 }}
        >
          <Text
            style={{
              ...tokens.text.body,
              fontWeight: "600",
              color: tokens.color.text,
            }}
          >
            {next
              ? t("redesign.car.next", {
                  service: serviceName(next.type),
                  when: whenLabel(next),
                })
              : t("redesign.car.firstLog")}
          </Text>
          {lastOfNext ? (
            <Text
              style={{ ...tokens.text.caption, color: tokens.color.textMuted }}
            >
              {t("redesign.car.last", { date: lastOfNext })}
            </Text>
          ) : null}
        </GlassCard>
      )}
    </Pressable>
  );

  const todo = (
    <View style={{ gap: tokens.space.md }}>
      <GlassCard>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskRow
              key={task.type}
              title={taskTitle(task)}
              subtitle={taskDetail(task)}
              status={task.status}
              checkLabel={t("redesign.check", { service: taskTitle(task) })}
              onCheck={() =>
                logType(task.type === "tread" ? TREAD_SERVICE : task.type)
              }
            />
          ))
        ) : (
          <View style={{ gap: 2 }}>
            <Text
              style={{
                ...tokens.text.body,
                fontWeight: "600",
                color: tokens.color.text,
              }}
            >
              {t("redesign.car.nothingDue")}
            </Text>
            {next ? (
              <Text
                style={{
                  ...tokens.text.caption,
                  color: tokens.color.textMuted,
                }}
              >
                {t("redesign.car.nothingDue.body", {
                  service: serviceName(next.type),
                  when: whenLabel(next),
                })}
              </Text>
            ) : null}
          </View>
        )}
      </GlassCard>
      {/* Planta's per-plant "Upcoming": what comes after today, and when. */}
      {upcoming.length > 0 ? (
        <GlassCard>
          <SectionTitle>{t("redesign.segment.upcoming")}</SectionTitle>
          {upcoming.map((item) => (
            <UpcomingRow
              key={item.type}
              type={item.type}
              title={serviceName(item.type)}
              when={formatDueIn(item.dueAt)}
              onPress={() =>
                open(`/vehicle/${id}/log?type=${encodeURIComponent(item.type)}`)
              }
            />
          ))}
        </GlassCard>
      ) : null}
      {vehicle ? <RecallsSection vehicle={vehicle} /> : null}
      {vehicle ? (
        <GloveboxSection
          documents={documents}
          onOpen={(d) => open(`/vehicle/${id}/document?doc=${d.id}`)}
          onAdd={() => open(`/vehicle/${id}/document`)}
        />
      ) : null}
    </View>
  );

  const tracked = view ? [...view.states].sort(byUrgency) : [];
  const trackedTypes = new Set(tracked.map((s) => s.type));
  const untracked = PLAN_BASIS.filter(
    (type) => !trackedTypes.has(type) && intervals[type],
  );

  const carePlan = plan ? (
    <View style={{ gap: tokens.space.md }}>
      {/* Planta's "info 90% complete — fill in the missing info" card. */}
      <Pressable
        disabled={!plan.gap}
        onPress={() =>
          plan.gap?.kind === "odometer"
            ? open(`/checkin?vehicle=${id}&source=plan`)
            : plan.gap?.kind === "service"
              ? logType(plan.gap.type)
              : undefined
        }
        accessibilityRole={plan.gap ? "button" : undefined}
      >
        <GlassCard tone="accent">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.space.md,
            }}
          >
            <Ring progress={plan.percent / 100} size={56} stroke={5}>
              <Text
                style={{
                  ...tokens.text.caption,
                  ...tokens.text.numeric,
                  fontWeight: "600",
                  color: tokens.color.text,
                }}
              >
                {`${plan.percent}%`}
              </Text>
            </Ring>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ ...tokens.text.legend, color: tokens.color.textMuted }}
              >
                {t("redesign.car.basedOn")}
              </Text>
              <Text
                style={{
                  ...tokens.text.body,
                  fontWeight: "600",
                  color: tokens.color.text,
                }}
              >
                {t("redesign.car.complete", { percent: plan.percent })}
              </Text>
              {plan.gap ? (
                <Text
                  style={{
                    ...tokens.text.caption,
                    color: tokens.color.accent,
                  }}
                >
                  {plan.gap.kind === "odometer"
                    ? t("redesign.car.gap.odometer")
                    : t("redesign.car.gap.service", {
                        service: serviceName(plan.gap.type),
                      })}
                </Text>
              ) : null}
            </View>
          </View>
        </GlassCard>
      </Pressable>

      {/* Bevel's metric rows: each interval, how much of it is left, and when
          it runs out. */}
      <GlassCard>
        <SectionTitle
          right={
            <Pressable
              onPress={() => open("/intervals")}
              hitSlop={8}
              accessibilityRole="button"
            >
              {({ pressed }) => (
                <Text
                  style={{
                    ...tokens.text.legend,
                    color: pressed
                      ? tokens.color.text
                      : tokens.color.accent,
                  }}
                >
                  {t("redesign.car.editIntervals")}
                </Text>
              )}
            </Pressable>
          }
        >
          {t("redesign.car.health")}
        </SectionTitle>
        {tracked.map((s) => {
          const interval = intervals[s.type];
          const left = lifeLeft({
            lastPerformedAt: s.last.performed_at,
            lastOdometer: s.last.odometer,
            months: interval?.months,
            distance: interval?.distance,
            odometer: vehicle?.odometer,
            now,
          });
          return (
            <View
              key={s.type}
              style={{ gap: 6, paddingVertical: tokens.space.xs }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: tokens.space.sm,
                }}
              >
                <Text
                  style={{
                    ...tokens.text.body,
                    color: tokens.color.text,
                    flex: 1,
                  }}
                >
                  {serviceName(s.type)}
                </Text>
                <Text
                  style={{
                    ...tokens.text.caption,
                    ...tokens.text.numeric,
                    color:
                      s.status === "due"
                        ? tokens.color.red
                        : tokens.color.textMuted,
                  }}
                >
                  {whenLabel(s)}
                </Text>
              </View>
              {left !== null ? (
                <LifeBar value={left} status={s.status} />
              ) : null}
            </View>
          );
        })}
        {untracked.map((type) => (
          <Pressable
            key={type}
            onPress={() => logType(type)}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: tokens.space.xs + 2,
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                <Text
                  style={{ ...tokens.text.body, color: tokens.color.textMuted }}
                >
                  {serviceName(type)}
                </Text>
                <Text
                  style={{
                    ...tokens.text.caption,
                    color: tokens.color.textFaint,
                  }}
                >
                  {t("redesign.car.notLogged")}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </GlassCard>
    </View>
  ) : null;

  const fuelBlock = (
    <View style={{ gap: tokens.space.sm }}>
      <SectionTitle>{t("fuel.title")}</SectionTitle>
      <GlassCard>
        <FuelSummary entries={fuel} />
      </GlassCard>
      {fuel.slice(0, RECENT_FILLS).map((f) => (
        <ListRow
          key={f.id}
          title={formatVolume(f.volume)}
          subtitle={fillSubtitle(f)}
          status="ok"
        />
      ))}
      {fuel.length > RECENT_FILLS ? (
        <Pressable
          onPress={() => open(`/vehicle/${id}/fuel`)}
          accessibilityRole="button"
          hitSlop={8}
        >
          {({ pressed }) => (
            <Text
              style={{
                ...tokens.text.legend,
                color: pressed ? tokens.color.text : tokens.color.accent,
              }}
            >
              {`${t("fuel.seeAll")} ›`}
            </Text>
          )}
        </Pressable>
      ) : null}
      <View style={{ paddingTop: tokens.space.md }}>
        <SectionTitle>{t("vehicle.history")}</SectionTitle>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: tokens.color.housing }}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: vehicle?.name ?? t("vehicle.title"),
          headerTitle: () => (
            <Pressable
              onPress={vehicle ? () => open(`/vehicle/${id}/edit`) : undefined}
              disabled={!vehicle}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("vehicle.edit.title")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: tokens.space.xs,
              }}
            >
              {({ pressed }) => (
                <>
                  <Text
                    numberOfLines={1}
                    style={{
                      ...tokens.text.heading,
                      color: pressed
                        ? tokens.color.textMuted
                        : tokens.color.text,
                    }}
                  >
                    {vehicle?.name ?? t("vehicle.title")}
                  </Text>
                  {vehicle ? (
                    <Text
                      style={{
                        ...tokens.text.caption,
                        color: pressed
                          ? tokens.color.text
                          : tokens.color.textMuted,
                      }}
                    >
                      {"✎"}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={pane === "history" ? records : []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          ...tokens.layout.column,
          paddingHorizontal: tokens.space.lg,
          paddingTop: tokens.space.md,
          paddingBottom: tokens.space.xxl + tokens.space.xl,
          gap: tokens.space.xs,
        }}
        ListHeaderComponent={
          <View
            style={{ gap: tokens.space.md, paddingBottom: tokens.space.sm }}
          >
            {hero}
            {banner}
            <Segmented
              items={[
                { value: "todo", label: t("redesign.car.tab.todo") },
                { value: "plan", label: t("redesign.car.tab.plan") },
                { value: "history", label: t("redesign.car.tab.history") },
              ]}
              value={pane}
              onChange={setPane}
            />
            {pane === "todo" ? todo : pane === "plan" ? carePlan : fuelBlock}
          </View>
        }
        ListEmptyComponent={
          pane === "history" ? (
            <Text
              style={{ ...tokens.text.body, color: tokens.color.textMuted }}
            >
              {t("vehicle.history.empty")}
            </Text>
          ) : null
        }
        ListFooterComponent={
          vehicle && pane === "history" ? (
            <View style={{ paddingTop: tokens.space.xl }}>
              <Button
                label={t("vehicle.deleteVehicle")}
                variant="danger"
                onPress={onDeleteVehicle}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => onDelete(item.id)}
                accessibilityRole="button"
                style={{
                  justifyContent: "center",
                  marginLeft: tokens.space.sm,
                  paddingHorizontal: tokens.space.md,
                  backgroundColor: tokens.color.red,
                  borderRadius: tokens.radius.md,
                }}
              >
                <Text
                  style={{ ...tokens.text.legend, color: tokens.color.onAccent }}
                >
                  {t("vehicle.swipe.delete")}
                </Text>
              </Pressable>
            )}
          >
            <ListRow
              title={serviceName(item.service_type)}
              subtitle={recordSubtitle(item)}
              status="ok"
            />
          </Swipeable>
        )}
      />

      <Glass edge="top">
        <View
          style={{
            ...tokens.layout.column,
            paddingHorizontal: tokens.space.lg,
            paddingTop: tokens.space.md,
            paddingBottom: tokens.space.sm,
            gap: tokens.space.sm,
          }}
        >
          {undoId ? (
            <Pressable onPress={onUndo} accessibilityRole="button">
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: tokens.space.md,
                  borderRadius: tokens.radius.md,
                  backgroundColor: tokens.color.redWash,
                  borderWidth: 1,
                  borderColor: tokens.color.red,
                }}
              >
                <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                  {t("vehicle.serviceDeleted")}
                </Text>
                <Text
                  style={{
                    ...tokens.text.legend,
                    fontSize: 14,
                    color: tokens.color.white,
                  }}
                >
                  {t("vehicle.undo")}
                </Text>
              </View>
            </Pressable>
          ) : null}
          <View style={{ flexDirection: "row", gap: tokens.space.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t("vehicle.logService")}
                onPress={() => logType()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("fuel.log")}
                variant="secondary"
                onPress={() => open(`/vehicle/${id}/fuel/new`)}
              />
            </View>
          </View>
        </View>
      </Glass>

      <CelebrateToast
        visible={celebrated !== null}
        title={t("redesign.celebrate.title")}
        body={t("redesign.celebrate.body", { service: celebrated ?? "" })}
        onHidden={() => setCelebrated(null)}
      />
    </SafeAreaView>
  );
}
