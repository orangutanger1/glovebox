import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { tokens } from "../design/tokens";
import { Button } from "../design/Button";
import { Chip } from "../design/Chip";
import { PressableScale } from "../design/PressableScale";
import { Mascot } from "../mascot/Mascot";
import { takeLogged } from "../mascot/celebrate";
import { listVehicles, softDeleteVehicle, type Vehicle } from "../db/vehicles";
import { listRecords } from "../db/records";
import { getIntervals } from "../db/intervals";
import { rescheduleAll } from "../notify";
import { isPro, presentPaywall } from "../purchases";
import { recordReviewEvent } from "../review";
import { track } from "../analytics";
import { isOnboarded, getOnboardingName } from "../onboarding";
import { t, formatDueIn, getLanguage } from "../i18n";
import { Bubble } from "../onboarding/Convo";
import { getDistanceUnit } from "../units";
import { serviceName } from "../schedule/names";
import { TREAD_SERVICE } from "../tires/tread";
import { taskDetail, taskTitle, whenLabel } from "./copy";
import { UpcomingRow } from "./icons";
import {
  byUrgency,
  garageMood,
  heroFigure,
  nextFor,
  nextUpRows,
  roads,
  todayTasks,
  upcomingItems,
  vehicleView,
  type NextUp,
  type VehicleView,
} from "./model";
import {
  CelebrateToast,
  FloatingTabBar,
  GlassCard,
  Ring,
  RoundButton,
  Segmented,
  SectionTitle,
  TaskRow,
  TAB_BAR_CLEARANCE,
  CheckButton,
  LifeBar,
} from "./ui";
import { isDesignV2 } from "../design/theme";
import { v2 } from "../design/type";
import { HeroCard, ACCENT_TEXT, AMBER_TEXT, RED_TEXT } from "./HeroCard";
import { ServiceSticker } from "./stickers";
import { Road } from "./Road";
import { LoggedMoment } from "./LoggedMoment";

/** The same three one-tap services the classic garage offers. */
const QUICK_LOG = ["Oil Change", "Tire Rotation", "Brake Inspection"];

type Tab = "today" | "garage";
type Segment = "today" | "upcoming";

/** "Monday, Oct 12": Bevel's date over the greeting. */
function todayLabel(): string {
  try {
    return new Intl.DateTimeFormat(getLanguage(), { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  } catch {
    return "";
  }
}

function statusColor(status: "due" | "soon" | "ok"): string {
  return status === "due" ? tokens.color.red : status === "soon" ? tokens.color.accentSoft : tokens.color.accent;
}

function greeting(name: string | null, hour: number): string {
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return name
    ? t(`redesign.greeting.${part}.named`, { name })
    : t(`redesign.greeting.${part}`);
}

/**
 * Arm A's home: Planta's loop on Opal's black. Two peer tabs in a floating
 * pill — Today (the tasks) and Garage (the cars) — and a round "+" that logs a
 * service, because logging is the one action the whole app exists for.
 *
 * Everything the classic garage does is still here and still measured the same
 * way: `home_first_view` once per session, `first_core_action` on every log
 * start, the paywall before the add-vehicle form (never after), and the swipe
 * to take a car out of the garage behind the same confirmation.
 */
export function RedesignHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("today");
  const [segment, setSegment] = useState<Segment>("today");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [epoch, setEpoch] = useState(0);
  const [msg, setMsg] = useState("");
  const [celebrated, setCelebrated] = useState<string | null>(null);
  // What was logged, on which car, for A v2's logged moment.
  const [loggedRaw, setLoggedRaw] = useState<{ vehicleId: string; service: string } | null>(null);
  const scroll = useRef<ScrollView>(null);
  // A v2's road: where it starts in the scroll, and whether the user has moved
  // since it was opened (then it is left where they put it).
  const roadTop = useRef(0);
  const userScrolled = useRef(false);
  const showCar = useCallback((carY: number) => {
    if (userScrolled.current) return;
    scroll.current?.scrollTo({ y: Math.max(0, roadTop.current + carY - 240), animated: false });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setVehicles(listVehicles());
      setEpoch((n) => n + 1);
      const logged = takeLogged();
      if (logged) {
        setCelebrated(serviceName(logged.service));
        setLoggedRaw(logged);
      }
    }, []),
  );

  const reportedFirstView = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (reportedFirstView.current) return;
      reportedFirstView.current = true;
      track("home_first_view", {
        vehicles: listVehicles().length,
        onboarded: isOnboarded(),
      });
    }, []),
  );

  const views = useMemo(() => {
    const intervals = getIntervals();
    const unit = getDistanceUnit();
    const now = new Date().toISOString();
    return vehicles.map((vehicle) =>
      vehicleView({
        vehicle,
        records: listRecords(vehicle.id),
        intervals,
        unit,
        now,
      }),
    );
    // `epoch` re-reads the records on every focus, after a log or a delete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, epoch]);

  const tasks = todayTasks(views);
  const upcoming = upcomingItems(views);
  const mood = celebrated ? "celebrating" : garageMood(views);
  const overdue = tasks.filter((x) => x.status === "due").length;
  const soon = tasks.length - overdue;
  const onTrack = views.reduce(
    (n, v) => n + v.states.filter((s) => s.status === "ok").length,
    0,
  );
  const logged = views.reduce((n, v) => n + v.records.length, 0);
  const single = vehicles.length === 1;
  // With several cars the rings are the most used-up intervals in the garage;
  // a ring's label is the service, and the tasks below name the car.
  const rings = views
    .flatMap((v) => v.lives)
    .sort((a, b) => a.left - b.left)
    .filter((life, i, all) => all.findIndex((x) => x.type === life.type) === i)
    .slice(0, 3);

  // A v2: one figure in place of the rings, and "Next up" under it.
  const designV2 = isDesignV2();
  const hero = designV2
    ? heroFigure(views, Object.fromEntries(views.map((v) => [v.vehicle.id, v.vehicle.odometer])))
    : null;
  const nextUp = designV2 ? nextUpRows(views, hero) : [];
  const roadList = designV2 ? roads(views) : [];

  const status =
    logged === 0
      ? t("redesign.status.sleepy")
      : overdue > 0
        ? t("redesign.status.worried", { count: overdue })
        : soon > 0
          ? t("redesign.status.headsUp", { count: soon })
          : t("redesign.status.happy");

  function logFor(vehicleId: string, type?: string, source = "today") {
    track("first_core_action", { source, action: "log_service" });
    router.push(
      type
        ? `/vehicle/${vehicleId}/log?type=${encodeURIComponent(type)}`
        : `/vehicle/${vehicleId}/log`,
    );
  }

  async function onAdd() {
    // Paywall before the form, never after — the classic garage's rule.
    if (vehicles.length >= 1) {
      try {
        if ((await isPro()) !== true) {
          const purchased = await presentPaywall("add_vehicle");
          if (!purchased) return;
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

  /** The "+": straight to the form with one car, a choice with several, and
   *  the add-vehicle flow with none. */
  function onPlus() {
    if (vehicles.length === 0) return void onAdd();
    if (single) return logFor(vehicles[0].id, undefined, "plus");
    const names = vehicles.map((v) => v.name);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...names, t("vehicle.delete.cancel")],
          cancelButtonIndex: names.length,
        },
        (i) => {
          if (i < names.length) logFor(vehicles[i].id, undefined, "plus");
        },
      );
    } else {
      Alert.alert(t("redesign.plus"), undefined, [
        ...vehicles.map((v) => ({
          text: v.name,
          onPress: () => logFor(v.id, undefined, "plus"),
        })),
        { text: t("vehicle.delete.cancel"), style: "cancel" as const },
      ]);
    }
  }

  function onDeleteVehicle(vehicle: Vehicle) {
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
            setVehicles(listVehicles());
          },
        },
      ],
    );
  }

  const header = (title: string, subtitle?: string, eyebrow?: string) => (
    <View style={{ gap: tokens.space.xs }}>
      {eyebrow ? (
        <Text
          style={
            designV2
              ? { ...v2.label(), color: tokens.color.textMuted }
              : { ...tokens.text.legend, fontWeight: "600", color: tokens.color.textMuted }
          }
        >
          {eyebrow}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: tokens.space.md,
        }}
      >
        <Text
          style={
            designV2
              ? { ...v2.greeting(), color: tokens.color.text, flex: 1 }
              : { ...tokens.text.hero, fontSize: 30, lineHeight: 36, color: tokens.color.text, flex: 1 }
          }
        >
          {title}
        </Text>
        <RoundButton
          icon="settings"
          label={t("layout.settings")}
          onPress={() => router.push("/settings")}
        />
      </View>
      {subtitle ? (
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const costsRow =
    vehicles.length > 0 ? (
      <Pressable
        onPress={() => router.push("/insights")}
        accessibilityRole="button"
      >
        {({ pressed }) => (
          <GlassCard style={{ opacity: pressed ? 0.8 : 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...tokens.text.body,
                  fontWeight: "600",
                  color: tokens.color.text,
                }}
              >
                {t("insights.open")}
              </Text>
              <Text
                style={{ ...tokens.text.body, color: tokens.color.textMuted }}
              >
                {"›"}
              </Text>
            </View>
          </GlassCard>
        )}
      </Pressable>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        ref={scroll}
        onScrollBeginDrag={() => (userScrolled.current = true)}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          ...tokens.layout.column,
          paddingTop: insets.top + tokens.space.md,
          paddingHorizontal: tokens.space.lg,
          paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
          gap: tokens.space.lg,
        }}
      >
        {tab === "today" ? (
          <>
            {header(
              greeting(getOnboardingName(), new Date().getHours()),
              undefined,
              // A v2: "MON · OCT 12 · MAZDA CX-5" with one car.
              designV2 && single ? `${todayLabel()} · ${vehicles[0].name}` : todayLabel(),
            )}

            {/* The car on the page, saying what it is reacting to. It is the
                one thing on Today that moves, and it stands on the page itself
                — its loop is drawn on the page colour — not on a card. */}
            {designV2 ? (
              // A v2: the car on the left, speaking to the right.
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.xs }}>
                <Mascot mood={mood} size={124} animate />
                <Bubble text={status} tail="left" />
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                {/* Over the car, tucked into the empty top of its frame: the
                    loop leaves headroom for the car to jump into. */}
                <View style={{ zIndex: 2, marginBottom: -30, maxWidth: "88%" }}>
                  <Bubble text={status} tail="bottom" />
                </View>
                <Mascot mood={mood} size={196} animate />
              </View>
            )}

            {hero ? (
              <HeroCard
                fig={hero}
                showCar={views.length > 1}
                onLog={() => logFor(hero.vehicleId, hero.type, "today_task")}
              />
            ) : null}

            {/* Bevel's ring row: how much of each interval is left, most used
                up first. Nothing logged means nothing to measure. */}
            {!designV2 && rings.length > 0 ? (
              <GlassCard>
                <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                  {rings.map((life, i) => (
                    <View
                      key={life.type}
                      style={{
                        alignItems: "center",
                        gap: tokens.space.sm,
                        flex: 1,
                        // Bevel's hairline between rings.
                        borderLeftWidth: i > 0 ? 1 : 0,
                        borderLeftColor: tokens.color.sunken,
                      }}
                    >
                      <Ring progress={life.left} size={78} stroke={7} color={statusColor(life.status)}>
                        <Text
                          style={{
                            ...tokens.text.body,
                            ...tokens.text.numeric,
                            fontWeight: "700",
                            color: tokens.color.text,
                          }}
                        >
                          {`${Math.round(life.left * 100)}%`}
                        </Text>
                      </Ring>
                      <Text
                        numberOfLines={1}
                        style={{ ...tokens.text.caption, fontWeight: "500", color: tokens.color.textMuted }}
                      >
                        {serviceName(life.type)}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            ) : null}

            <Segmented
              items={[
                { value: "today", label: t("redesign.segment.today") },
                { value: "upcoming", label: t("redesign.segment.upcoming") },
              ]}
              value={segment}
              onChange={(next) => {
                userScrolled.current = false;
                setSegment(next);
              }}
            />

            {segment === "today" && designV2 && logged > 0 && hero ? (
              nextUp.length > 0 ? (
              <View style={{ gap: tokens.space.sm }}>
                <Text style={{ ...v2.label(), color: tokens.color.textMuted, paddingLeft: tokens.space.xs }}>
                  {t("redesign.hero.next")}
                </Text>
                <GlassCard>
                  {nextUp.map((row) => (
                    <NextUpRow
                      key={`${row.task.vehicleId}:${row.task.type}`}
                      row={row}
                      single={single}
                      onLog={() =>
                        logFor(
                          row.task.vehicleId,
                          row.task.type === "tread" ? TREAD_SERVICE : row.task.type,
                          "today_task",
                        )
                      }
                      onOpen={() => router.push(`/vehicle/${row.task.vehicleId}`)}
                    />
                  ))}
                </GlassCard>
              </View>
              ) : null
            ) : segment === "upcoming" && designV2 ? (
              // A v2: the road. Brought to the car once it is laid out, unless
              // the user has already scrolled.
              roadList.length === 0 ? (
                <GlassCard>
                  <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
                    {t("redesign.upcoming.empty")}
                  </Text>
                </GlassCard>
              ) : (
                <View onLayout={(e) => (roadTop.current = e.nativeEvent.layout.y)} style={{ gap: tokens.space.lg }}>
                  {roadList.map((r, i) => (
                    <Road
                      key={r.vehicleId}
                      road={r}
                      mood={views.find((v) => v.vehicle.id === r.vehicleId)?.mood ?? "happy"}
                      showName={roadList.length > 1}
                      onCarLayout={i === 0 ? showCar : undefined}
                      onOpen={() => router.push(`/vehicle/${r.vehicleId}`)}
                    />
                  ))}
                </View>
              )
            ) : segment === "today" ? (
              <GlassCard>
                <SectionTitle>{t("redesign.todayTasks")}</SectionTitle>
                {vehicles.length === 0 ? (
                  <View style={{ gap: tokens.space.md }}>
                    <Text
                      style={{
                        ...tokens.text.body,
                        color: tokens.color.textMuted,
                      }}
                    >
                      {t("redesign.garage.empty")}
                    </Text>
                    <Button label={t("garage.addVehicle")} onPress={onAdd} />
                  </View>
                ) : logged === 0 ? (
                  <View style={{ gap: tokens.space.md }}>
                    <Text
                      style={{
                        ...tokens.text.body,
                        color: tokens.color.textMuted,
                      }}
                    >
                      {t("redesign.car.firstLog")}
                    </Text>
                    <Button label={t("garage.logService")} onPress={onPlus} />
                  </View>
                ) : tasks.length === 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: tokens.space.md,
                      paddingVertical: tokens.space.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: tokens.color.accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: "700",
                          color: tokens.color.onAccent,
                        }}
                      >
                        {"✓"}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          ...tokens.text.body,
                          fontWeight: "600",
                          color: tokens.color.text,
                        }}
                      >
                        {t("redesign.allDone.title")}
                      </Text>
                      <Text
                        style={{
                          ...tokens.text.caption,
                          color: tokens.color.textMuted,
                        }}
                      >
                        {t("redesign.allDone.body")}
                      </Text>
                    </View>
                  </View>
                ) : (
                  tasks.map((task) => (
                    <TaskRow
                      key={`${task.vehicleId}:${task.type}`}
                      type={task.type}
                      title={taskTitle(task)}
                      subtitle={
                        single
                          ? taskDetail(task)
                          : t("redesign.task.on", {
                              vehicle: task.vehicleName,
                              detail: taskDetail(task),
                            })
                      }
                      status={task.status}
                      checkLabel={t("redesign.check", {
                        service: taskTitle(task),
                      })}
                      onCheck={() =>
                        logFor(
                          task.vehicleId,
                          task.type === "tread" ? TREAD_SERVICE : task.type,
                          "today_task",
                        )
                      }
                      onPress={() => router.push(`/vehicle/${task.vehicleId}`)}
                    />
                  ))
                )}
              </GlassCard>
            ) : upcoming.length === 0 ? (
              <GlassCard>
                <Text
                  style={{ ...tokens.text.body, color: tokens.color.textMuted }}
                >
                  {t("redesign.upcoming.empty")}
                </Text>
              </GlassCard>
            ) : (
              <GlassCard>
                <SectionTitle>{t("redesign.segment.upcoming")}</SectionTitle>
                {upcoming.map((item) => (
                  <UpcomingRow
                    key={`${item.vehicleId}:${item.type}`}
                    type={item.type}
                    title={serviceName(item.type)}
                    caption={single ? undefined : item.vehicleName}
                    when={formatDueIn(item.dueAt)}
                    onPress={() => router.push(`/vehicle/${item.vehicleId}`)}
                  />
                ))}
              </GlassCard>
            )}

            {single ? (
              <View style={{ gap: tokens.space.sm }}>
                <Text
                  style={{
                    ...tokens.text.legend,
                    color: tokens.color.textFaint,
                  }}
                >
                  {t("garage.quickLog")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: tokens.space.sm,
                  }}
                >
                  {QUICK_LOG.map((type) => (
                    <Chip
                      key={type}
                      label={serviceName(type)}
                      selected={false}
                      onPress={() =>
                        logFor(vehicles[0].id, type, "garage_quick")
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {costsRow}
          </>
        ) : (
          <>
            {header(t("redesign.tab.garage"))}
            {vehicles.length === 0 ? (
              <GlassCard>
                <View
                  style={{
                    alignItems: "center",
                    gap: tokens.space.md,
                    paddingVertical: tokens.space.md,
                  }}
                >
                  <Mascot mood="sleepy" size={120} animate />
                  <Text
                    style={{
                      ...tokens.text.body,
                      color: tokens.color.textMuted,
                      textAlign: "center",
                    }}
                  >
                    {t("redesign.garage.empty")}
                  </Text>
                </View>
              </GlassCard>
            ) : (
              views.map((view) => (
                <GarageCard
                  key={view.vehicle.id}
                  view={view}
                  onOpen={() => router.push(`/vehicle/${view.vehicle.id}`)}
                  onDelete={() => onDeleteVehicle(view.vehicle)}
                />
              ))
            )}
            {msg ? (
              <Text
                style={{ ...tokens.text.body, color: tokens.color.textMuted }}
              >
                {msg}
              </Text>
            ) : null}
            <Button
              label={t("garage.addVehicle")}
              variant={vehicles.length > 0 ? "secondary" : "primary"}
              onPress={onAdd}
            />
            {costsRow}
          </>
        )}
      </ScrollView>

      <FloatingTabBar
        tabs={[
          { value: "today", label: t("redesign.tab.today"), icon: "today" },
          { value: "garage", label: t("redesign.tab.garage"), icon: "garage" },
        ]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          scroll.current?.scrollTo({ y: 0, animated: false });
        }}
        onReselect={() => scroll.current?.scrollTo({ y: 0, animated: true })}
        onPlus={onPlus}
        plusLabel={t("redesign.plus")}
      />

      {designV2 ? (
        <LoggedMoment
          visible={celebrated !== null && loggedRaw !== null}
          service={loggedRaw?.service ?? ""}
          next={(() => {
            const v = loggedRaw ? views.find((x) => x.vehicle.id === loggedRaw.vehicleId) : undefined;
            return v && loggedRaw ? nextFor(v, loggedRaw.service) : null;
          })()}
          onDone={() => {
            setCelebrated(null);
            setLoggedRaw(null);
          }}
        />
      ) : (
        <CelebrateToast
          visible={celebrated !== null}
          title={t("redesign.celebrate.title")}
          body={t("redesign.celebrate.body", { service: celebrated ?? "" })}
          onHidden={() => setCelebrated(null)}
        />
      )}
    </View>
  );
}

/** Planta's garden row: the car's face, its name and next task, and Bevel's
 *  ring for how much of the tightest interval is left. One tap target. */
function GarageCard({
  view,
  onOpen,
  onDelete,
}: {
  view: VehicleView;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { vehicle, next, health } = view;
  const spec = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
  const nextLine = next
    ? t("redesign.garage.next", {
        service: serviceName(next.type),
        when: whenLabel(next),
      })
    : t("redesign.garage.nothingTracked");
  const ringColor =
    next?.status === "due"
      ? tokens.color.red
      : next?.status === "soon"
        ? tokens.color.accentSoft
        : tokens.color.accent;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          style={{
            justifyContent: "center",
            marginLeft: tokens.space.sm,
            paddingHorizontal: tokens.space.md,
            backgroundColor: tokens.color.red,
            borderRadius: tokens.radius.xl,
          }}
        >
          <Text style={{ ...tokens.text.legend, color: tokens.color.onAccent }}>
            {t("vehicle.swipe.delete")}
          </Text>
        </Pressable>
      )}
    >
      <PressableScale accessibilityRole="button" onPress={onOpen}>
        <GlassCard tone={next?.status === "due" ? "alarm" : "neutral"}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.space.md,
            }}
          >
            <Mascot mood={view.mood} size={76} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                numberOfLines={1}
                style={{ ...tokens.text.heading, color: tokens.color.text }}
              >
                {vehicle.name}
              </Text>
              {spec ? (
                <Text
                  numberOfLines={1}
                  style={{
                    ...tokens.text.caption,
                    color: tokens.color.textFaint,
                  }}
                >
                  {spec}
                </Text>
              ) : null}
              <Text
                numberOfLines={2}
                style={{
                  ...tokens.text.caption,
                  ...tokens.text.numeric,
                  color:
                    next?.status === "due"
                      ? tokens.color.red
                      : tokens.color.textMuted,
                }}
              >
                {nextLine}
              </Text>
            </View>
            {health !== null ? (
              <Ring progress={health} size={56} stroke={5} color={ringColor}>
                <Text
                  style={{
                    ...tokens.text.caption,
                    ...tokens.text.numeric,
                    fontWeight: "600",
                    color: tokens.color.text,
                  }}
                >
                  {`${Math.round(health * 100)}%`}
                </Text>
              </Ring>
            ) : null}
          </View>
        </GlassCard>
      </PressableScale>
    </Swipeable>
  );
}

function NextUpRow({
  row,
  single,
  onLog,
  onOpen,
}: {
  row: NextUp;
  single: boolean;
  onLog: () => void;
  onOpen: () => void;
}) {
  const { task, life } = row;
  const status = task.state?.status ?? task.status;
  const when = taskDetail(task);
  const tone = status === "due" ? RED_TEXT : status === "soon" ? AMBER_TEXT : ACCENT_TEXT;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md, paddingVertical: tokens.space.sm }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${taskTitle(task)}, ${when}`}
        style={{ flex: 1 }}
      >
        {({ pressed }) => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md, opacity: pressed ? 0.6 : 1 }}>
            <ServiceSticker type={task.type} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }} numberOfLines={1}>
                {single ? taskTitle(task) : `${taskTitle(task)} · ${task.vehicleName}`}
              </Text>
              {life !== undefined ? <LifeBar value={life} status={status} /> : null}
            </View>
            <Text style={{ ...v2.value(), color: tone }}>{when}</Text>
          </View>
        )}
      </Pressable>
      {status !== "ok" ? (
        <CheckButton
          status={status}
          onPress={onLog}
          label={t("redesign.check", { service: taskTitle(task) })}
        />
      ) : null}
    </View>
  );
}
