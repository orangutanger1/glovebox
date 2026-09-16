import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { PressableScale } from "../design/PressableScale";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import { track } from "../analytics";
import type { Plan } from "../purchases/plans";

/**
 * The price list.
 *
 * Two shapes, chosen by how many plans there are. Two plans sit side by side
 * as cards, each one a period and a big figure, because two things compared
 * are read across. Three stack as rows, because three cards across a phone
 * are three columns of small type. Both shapes print the same facts in the
 * same order: the period, the per-week or per-month figure the reader
 * compares on, and the amount actually billed underneath so the comparison
 * figure is never mistaken for the charge.
 *
 * Selection is the app's own: a lit hairline and a tick, no new hue. The
 * "best value" and "save" marks are green because green is the one colour
 * the system spends on a good, settled fact, and a saving computed from the
 * store's own prices is one.
 *
 * Nothing here is a price. Every string is StoreKit's or arithmetic on it.
 */

export function defaultPlan(plans: Plan[]): string {
  let best = plans[0];
  for (const plan of plans) if ((plan.savePct ?? -1) > (best.savePct ?? -1)) best = plan;
  return best.id;
}

const RING = 2;

function Mark({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: tokens.color.greenWash,
        borderColor: tokens.color.greenGlow,
        borderWidth: 1,
        borderRadius: tokens.radius.pill,
        paddingHorizontal: tokens.space.sm + 2,
        paddingVertical: 3,
      }}
    >
      <Text style={{ ...tokens.text.legend, color: tokens.color.green }}>{label}</Text>
    </View>
  );
}

function Tick({ on }: { on: boolean }) {
  const size = 22;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: on ? 0 : 1.5,
        borderColor: tokens.color.hairlineLit,
        backgroundColor: on ? tokens.color.white : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on && (
        <Text style={{ color: tokens.color.housing, fontSize: 13, fontWeight: "700", lineHeight: 15 }}>✓</Text>
      )}
    </View>
  );
}

/** The comparison figure and its unit. Yearly and monthly compare per week;
 *  the weekly plan is its own figure. */
function headline(plan: Plan): { figure: string; unit: string } {
  if (plan.intro) return { figure: plan.intro.priceString, unit: t("paywall.intro.label") };
  if (plan.period === "week") return { figure: plan.priceString, unit: t("paywall.per.week") };
  return { figure: plan.perWeek, unit: t("paywall.per.week") };
}

/** The line under the figure: what is actually billed, or what follows the
 *  introductory week. */
function billed(plan: Plan): string | null {
  if (plan.intro) return t("paywall.then", { price: plan.priceString });
  if (plan.period === "year") return t("paywall.billed.year", { price: plan.priceString });
  if (plan.period === "month") return t("paywall.billed.month", { price: plan.priceString });
  return null;
}

function Frame({
  on,
  onPress,
  children,
  style,
}: {
  on: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={
        [
          {
            borderRadius: tokens.radius.lg,
            backgroundColor: on ? tokens.color.surfaceHi : tokens.color.surface,
            borderWidth: RING,
            borderColor: on ? tokens.color.hairlineLit : tokens.color.hairline,
            padding: tokens.space.md,
          },
          style,
        ] as never
      }
    >
      {children}
    </PressableScale>
  );
}

export function PlanPicker({
  plans,
  selected,
  onSelect,
  layout = plans.length <= 2 ? "cards" : "rows",
  offering,
}: {
  plans: Plan[];
  selected: string;
  onSelect: (id: string) => void;
  layout?: "cards" | "rows";
  /** For the event, in the sheet's vocabulary: "current" or "discount". */
  offering: "current" | "discount";
}) {
  const bestId = plans.some((p) => p.savePct !== undefined) ? defaultPlan(plans) : null;

  function choose(plan: Plan) {
    if (plan.id !== selected) {
      Haptics.selectionAsync().catch(() => {});
      track("paywall_plan_selected", { offering, plan: plan.id });
    }
    onSelect(plan.id);
  }

  if (layout === "cards") {
    return (
      <View style={{ flexDirection: "row", gap: tokens.space.sm }}>
        {plans.map((plan) => {
          const on = plan.id === selected;
          const { figure, unit } = headline(plan);
          const under = billed(plan);
          return (
            <Frame key={plan.id} on={on} onPress={() => choose(plan)} style={{ flex: 1, gap: tokens.space.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ ...tokens.text.legend, color: on ? tokens.color.text : tokens.color.textMuted }}>
                  {t(`paywall.period.${plan.period}`)}
                </Text>
                <Tick on={on} />
              </View>
              {plan.intro && (
                <Text
                  style={{
                    ...tokens.text.caption,
                    color: tokens.color.textFaint,
                    textDecorationLine: "line-through",
                  }}
                >
                  {plan.priceString}
                </Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.readout, fontSize: 28, color: tokens.color.text }}>{figure}</Text>
                <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{unit}</Text>
              </View>
              {under && (
                <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{under}</Text>
              )}
              {(plan.savePct !== undefined || plan.id === bestId) && (
                <View style={{ flexDirection: "row", gap: tokens.space.xs, flexWrap: "wrap" }}>
                  {plan.id === bestId && <Mark label={t("paywall.bestValue")} />}
                  {plan.savePct !== undefined && <Mark label={t("paywall.save", { pct: plan.savePct })} />}
                </View>
              )}
            </Frame>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: tokens.space.sm }}>
      {plans.map((plan) => {
        const on = plan.id === selected;
        const { figure, unit } = headline(plan);
        const under = billed(plan);
        return (
          <Frame
            key={plan.id}
            on={on}
            onPress={() => choose(plan)}
            style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md }}
          >
            <Tick on={on} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm, flexWrap: "wrap" }}>
                <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
                  {t(`paywall.period.${plan.period}`)}
                </Text>
                {plan.id === bestId && <Mark label={t("paywall.bestValue")} />}
                {plan.savePct !== undefined && <Mark label={t("paywall.save", { pct: plan.savePct })} />}
              </View>
              {under && (
                <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{under}</Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {plan.intro && (
                <Text
                  style={{ ...tokens.text.caption, color: tokens.color.textFaint, textDecorationLine: "line-through" }}
                >
                  {plan.priceString}
                </Text>
              )}
              <Text style={{ ...tokens.text.readout, color: tokens.color.text }}>{figure}</Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{unit}</Text>
            </View>
          </Frame>
        );
      })}
    </View>
  );
}
