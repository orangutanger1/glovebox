import { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { isDesignV2, isRedesign } from "../src/design/theme";
import { v2 } from "../src/design/type";
import { ServiceSticker } from "../src/redesign/stickers";
import { RED_TEXT } from "../src/redesign/HeroCard";
import { Mascot } from "../src/mascot/Mascot";
import type { Mood } from "../src/mascot/mood";
import { track } from "../src/analytics";
import { t } from "../src/i18n";
import { getIntervals } from "../src/db/intervals";
import { listRecords } from "../src/db/records";
import { getVehicle } from "../src/db/vehicles";
import { dueStates } from "../src/schedule/due";
import { serviceName } from "../src/schedule/names";
import { getDistanceUnit } from "../src/units";
import {
  difficultyOf,
  explainStatus,
  hasExplainer,
  scheduleLines,
  type ExplainSource,
  type ExplainStatus,
} from "../src/explain";

const SOURCES: readonly ExplainSource[] = ["service_row", "due_row", "notification", "log_form"];

const MOOD: Record<ExplainStatus, Mood> = {
  ok: "happy",
  due_soon: "heads-up",
  overdue: "worried",
  never_logged: "sleepy",
};

/** Time open is capped so a card left up overnight doesn't skew the average. */
const MAX_SECONDS = 300;

/**
 * A service explainer, presented as a sheet over whatever opened it: a service
 * row, a due notification, or the log form. See src/explain for what it is for.
 *
 * A route rather than a component each screen mounts, so a notification can
 * open it by URL like the check-in and document reminders already do.
 */
export default function ExplainSheet() {
  const params = useLocalSearchParams<{ type?: string; vehicle?: string; source?: string }>();
  const router = useRouter();
  const type = params.type ?? "";
  const vehicleId = params.vehicle;
  const source: ExplainSource = SOURCES.includes(params.source as ExplainSource)
    ? (params.source as ExplainSource)
    : "service_row";

  const unit = getDistanceUnit();
  const { interval, state, vehicle } = useMemo(() => {
    const intervals = getIntervals();
    const vehicle = vehicleId ? getVehicle(vehicleId) : null;
    const state = vehicle
      ? dueStates({
          records: listRecords(vehicle.id),
          intervals,
          odometer: vehicle.odometer,
          unit,
          now: new Date().toISOString(),
        }).find((s) => s.type === type)
      : undefined;
    return { interval: intervals[type], state, vehicle };
  }, [type, vehicleId, unit]);

  const status = explainStatus(state);
  const opened = useRef(Date.now());

  useEffect(() => {
    if (!hasExplainer(type)) return;
    track("explainer_opened", { service_type: type, source, status });
    return () => {
      const seconds = Math.min(MAX_SECONDS, Math.round((Date.now() - opened.current) / 1000));
      track("explainer_closed", { service_type: type, seconds });
    };
    // Once per card: the status can't change while the sheet is up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  // A stale link (a type renamed, or one that never had a card) just closes.
  useEffect(() => {
    if (!hasExplainer(type)) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  if (!hasExplainer(type)) return null;

  function act(action: "log_service" | "change_interval") {
    track("explainer_action", { service_type: type, action });
    // Replace rather than push, so back from the form lands where the card was
    // opened instead of on the card again.
    // From the log form the form is already underneath: just go back to it.
    if (action === "log_service" && source === "log_form") {
      close();
    } else if (action === "log_service" && vehicle) {
      router.replace(`/vehicle/${vehicle.id}/log?type=${encodeURIComponent(type)}` as never);
    } else {
      router.replace("/intervals" as never);
    }
  }

  const difficulty = difficultyOf(type);
  const lines = scheduleLines({ interval, state, unit });
  const redesign = isRedesign();
  // A v2: the service's sticker leads (the card is about the service; the car
  // already speaks on Today), the title in the display face, three mono
  // section labels, the schedule on a white card in mono.
  const designV2 = isDesignV2();
  const sectionLabel = designV2
    ? { ...v2.label(), color: tokens.color.textMuted }
    : { ...tokens.text.legend, color: tokens.color.textMuted };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      <ScrollView
        contentContainerStyle={{
          ...tokens.layout.column,
          padding: tokens.space.lg,
          paddingBottom: tokens.space.xl,
          gap: tokens.space.lg,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md }}>
          {designV2 ? (
            <ServiceSticker type={type} size={56} />
          ) : redesign ? (
            <Mascot mood={MOOD[status]} size={64} />
          ) : null}
          <View style={{ flex: 1, gap: tokens.space.xs }}>
            <Text style={{ ...(designV2 ? v2.greeting() : tokens.text.title), color: tokens.color.text }}>
              {serviceName(type)}
            </Text>
            {difficulty ? (
              <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
                {t(`explain.difficulty.${difficulty}`)}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={t("explain.close")}>
            {({ pressed }) => (
              <Text style={{ fontSize: 22, color: pressed ? tokens.color.text : tokens.color.textMuted }}>✕</Text>
            )}
          </Pressable>
        </View>

        <View
          style={
            designV2
              ? {
                  backgroundColor: tokens.color.surface,
                  borderRadius: tokens.radius.lg,
                  borderCurve: "continuous",
                  padding: tokens.space.md,
                  gap: 4,
                  ...tokens.shadow.ambient,
                }
              : {
                  backgroundColor: tokens.color.surfaceHi,
                  borderRadius: tokens.radius.sm,
                  padding: tokens.space.md,
                  gap: 2,
                }
          }
        >
          {/* Plain legend in v2 too: the screen's three mono labels are the
              sections below. */}
          <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>{t("explain.schedule")}</Text>
          {lines.map((line, i) => (
            <Text
              key={line}
              style={{
                ...tokens.text.body,
                ...tokens.text.numeric,
                ...(designV2 ? { ...v2.value(), fontSize: 15 } : {}),
                fontWeight: i === lines.length - 1 && status === "overdue" ? "600" : "400",
                color:
                  i === lines.length - 1 && status === "overdue"
                    ? designV2
                      ? RED_TEXT
                      : tokens.color.red
                    : tokens.color.text,
              }}
            >
              {line}
            </Text>
          ))}
        </View>

        {(["what", "why", "diy"] as const).map((part) => (
          <View key={part} style={{ gap: tokens.space.xs }}>
            <Text style={sectionLabel}>{t(`explain.${part}`)}</Text>
            <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{t(`explain.${type}.${part}`)}</Text>
          </View>
        ))}

        <View style={{ gap: tokens.space.sm }}>
          {vehicle ? <Button label={t("explain.log")} onPress={() => act("log_service")} /> : null}
          <Button label={t("explain.interval")} variant="secondary" onPress={() => act("change_interval")} />
        </View>

        <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint, textAlign: "center" }}>
          {t("explain.disclaimer")}
        </Text>
      </ScrollView>
    </View>
  );
}
