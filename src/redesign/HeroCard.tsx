import { Pressable, Text, View } from "react-native";
import { tokens } from "../design/tokens";
import { v2 } from "../design/type";
import { t, formatNumber, formatShortDate, formatDueIn } from "../i18n";
import { distanceUnitLabel } from "../units/format";
import { serviceName } from "../schedule/names";
import type { HeroFigure } from "./model";
import { ServiceSticker } from "./stickers";
import { LifeBar } from "./ui";

/** Red and amber dark enough for small text on white (≥4.5:1). */
export const RED_TEXT = "#C42B30";
export const AMBER_TEXT = "#B65A00";

/**
 * A v2's Today hero: the most urgent thing as one number ("2,210 mi over", or
 * a date), where arm A has Bevel's ring row. The figure is the user's own
 * interval overrun or what is left of it, never a score.
 *
 * The card is the button that logs its service, the way a task's check is on
 * the rows below: the hero is left out of that list, and logging the most
 * urgent thing must not take a detour through "+".
 */
export function HeroCard({
  fig,
  showCar,
  onLog,
}: {
  fig: HeroFigure;
  showCar: boolean;
  onLog?: () => void;
}) {
  const over = fig.kind === "over";
  const status = fig.kind === "over" ? "due" : fig.status;
  const due = status === "due";
  const soon = status === "soon";
  const tone = due ? RED_TEXT : soon ? AMBER_TEXT : tokens.color.accent;
  const label = `${serviceName(fig.type)} · ${t(
    due ? "redesign.hero.overdue" : soon ? "redesign.hero.dueSoon" : "redesign.hero.next",
  )}`;
  const figure =
    fig.kind === "over"
      ? formatNumber(fig.overBy)
      : fig.kind === "distance"
        ? formatNumber(fig.left)
        : formatShortDate(fig.dueAt);
  const unit =
    fig.kind === "over"
      ? t("redesign.hero.overUnit", { unit: distanceUnitLabel() })
      : fig.kind === "distance"
        ? t("redesign.hero.leftUnit", { unit: distanceUnitLabel() })
        : formatDueIn(fig.dueAt);
  const foot =
    fig.kind === "over"
      ? fig.last.odometer !== undefined
        ? t("redesign.hero.lastDoneAt", {
            date: formatShortDate(fig.last.performed_at),
            reading: `${formatNumber(fig.last.odometer)} ${distanceUnitLabel()}`,
          })
        : t("redesign.hero.lastDone", { date: formatShortDate(fig.last.performed_at) })
      : null;
  const caption = [showCar ? fig.vehicleName : null, foot].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={onLog}
      disabled={!onLog}
      accessibilityRole={onLog ? "button" : undefined}
      accessibilityLabel={onLog ? t("redesign.check", { service: serviceName(fig.type) }) : undefined}
      accessibilityHint={`${label}. ${figure} ${unit}.${caption ? ` ${caption}.` : ""}`}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: tokens.color.surface,
            borderRadius: tokens.radius.xl,
            borderCurve: "continuous",
            padding: 20,
            gap: 10,
            opacity: pressed ? 0.85 : 1,
            ...tokens.shadow.ambient,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: tokens.space.sm }}>
            <Text style={{ ...v2.label(), color: tone, flexShrink: 1 }} numberOfLines={1}>
              {label}
            </Text>
            <ServiceSticker type={fig.type} size={34} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ ...v2.figure(), color: tokens.color.text }} adjustsFontSizeToFit numberOfLines={1}>
              {figure}
            </Text>
            <Text style={{ ...v2.value(), fontSize: 15, color: tokens.color.textMuted }}>{unit}</Text>
          </View>
          {/* An overrun is the whole interval used and then some: a full red bar. */}
          {over ? <LifeBar value={1} status="due" /> : null}
          {caption ? (
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{caption}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
