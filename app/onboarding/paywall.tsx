import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "../../src/design/tokens";
import { Check } from "../../src/design/Check";
import { formatDate, t } from "../../src/i18n";
import { nextUp, type Plan as MaintenancePlan } from "../../src/onboarding/plan";
import { getVariant } from "../../src/experiments";
import { restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../../src/paywall/PlanPicker";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { ReviewCard } from "../../src/paywall/ReviewCard";
import { IncludedStrip } from "../../src/paywall/IncludedStrip";
import { PlanPreview, previewOpen } from "../../src/paywall/PlanPreview";
import { getDistanceUnit } from "../../src/units";
import { CloseButton } from "../../src/paywall/CloseButton";
import { recordReviewEvent } from "../../src/review";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { tNamed } from "../../src/onboarding";
import { useAdvance, useFinish } from "../../src/onboarding/nav";
import { track } from "../../src/analytics";

/**
 * The first ask, with the price on it.
 *
 * Until 2026-09-16 this screen was the argument and a RevenueCat sheet was
 * the price list, a tap and a median 3.5 seconds away. On the first day with
 * paid traffic 59 people saw that sheet and none bought; 35 more never opened
 * the one after it. The list is drawn here now, under the argument, in the
 * app's own material, so the reader who has just been shown their car's
 * overdue count sees what it costs to fix that without leaving the page.
 *
 * Top to bottom: the promise, this car's plan with its first service dated
 * and the rest behind the subscription (see `PlanPreview`), what the
 * subscription includes, the one review the app has. The plans and
 * the button are in the footer, pinned under the scroll, so the price list
 * is on the glass from the first frame to the last however far the argument
 * above it runs; a plan that scrolls away with the review is a plan the
 * reader has to go and find again once they have decided.
 *
 * The close is the decline the sheet's close button used to be, and it goes
 * where "Not now" went: to the trial, which is the whole reason the trial
 * exists. It arrives late (see `CloseButton`). There is still no free door.
 */

/** How long the screen has no exit drawn on it. */
const CLOSE_AFTER_MS = 4000;
export default function OnboardingPaywall() {
  const advance = useAdvance("paywall");
  const finish = useFinish();
  const { vehicleName, plan } = useOnboardingFindings();
  const { plans, loading, retry } = usePlans("default");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mounted = useRef(Date.now());
  // Unassigned installs (mid-flow when the test shipped) see the control.
  const showPreview = getVariant("paywall_preview") === "preview";

  // Shown once per mount, in the sheet's vocabulary, so the funnel's
  // `paywall_shown → paywall_presented` step keeps meaning "tapped → drawn".
  useEffect(() => {
    track("paywall_shown", { offering: "current" });
  }, []);
  useEffect(() => {
    if (plans) {
      // Whether the preview's open row had a date to show: a "not sure" on
      // the service question leaves it undated, and the two may read apart.
      // Absent on the `points` arm, which draws no preview.
      const open = showPreview ? previewOpen(plan) : undefined;
      track("paywall_presented", {
        offering: "current",
        ms: Date.now() - mounted.current,
        ...(showPreview && { preview: open?.dueAt ? "dated" : open ? "undated" : "none" }),
      });
    }
  }, [plans]);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, "default");
      if (outcome === "purchased") {
        // The receipt, felt: the same success the log gives a saved service,
        // for the one tap in the app that cost money.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        // Recorded, never acted on: nothing in onboarding may ask for a rating
        // (Guideline 5.6.3). This banks the signal for a later happy moment.
        recordReviewEvent("purchase");
        finish("paid");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await restore();
      track("restore_attempted", { source: "onboarding_paywall", found });
      if (found) {
        recordReviewEvent("purchase");
        finish("restored");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: "onboarding_paywall", found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  function onClose() {
    track("paywall_closed", { offering: "current", outcome: "dismissed", result: "DECLINED" });
    advance();
  }

  return (
    <OnboardingScreen
      route="paywall"
      title={tNamed("offer.paywall.title")}
      subtitle={t("offer.paywall.subtitle")}
      trailing={<CloseButton onPress={onClose} disabled={busy} delayMs={CLOSE_AFTER_MS} />}
      footer={
        <>
          {plans ? (
            <PlanPicker
              plans={plans}
              selected={chosen?.id ?? defaultPlan(plans)}
              onSelect={setSelected}
              layout="rows"
              offering="current"
            />
          ) : (
            <Pressable onPress={retry} disabled={loading} style={{ alignItems: "center", padding: tokens.space.md }}>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                {loading ? t("paywall.loading") : t("paywall.retry")}
              </Text>
            </Pressable>
          )}
          {msg !== null && (
            <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>{msg}</Text>
          )}
          <BuyFooter plan={chosen} busy={busy} onBuy={onBuy} onRestore={onRestore} />
        </>
      }
    >
      {showPreview ? (
        <PlanPreview plan={plan} vehicleName={vehicleName} unit={getDistanceUnit()} />
      ) : (
        <BenefitPoints plan={plan} vehicleName={vehicleName} />
      )}

      <IncludedStrip />

      <ReviewCard />
    </OnboardingScreen>
  );
}

/**
 * The `points` arm of `paywall_preview`: three rows that evidence the promise
 * against this car, as the paywall drew them until 2026-09-24.
 *
 * The middle row is the overdue count when there is one. When there is not,
 * which on a fresh install is always, it is the history benefit instead:
 * "nothing overdue today" was true only because nothing had been logged,
 * and a paywall congratulating an empty record is not evidence of anything.
 */
function BenefitPoints({ plan, vehicleName }: { plan: MaintenancePlan; vehicleName: string }) {
  const next = nextUp(plan);
  const middle =
    plan.pastDue > 0
      ? {
          title: t("offer.paywall.point.due.title", { count: plan.pastDue }),
          subtitle: next?.dueAt
            ? t("offer.paywall.point.due.subtitle", { date: formatDate(next.dueAt) })
            : t("offer.paywall.point.due.noNext"),
        }
      : {
          title: t("offer.paywall.point.history.title"),
          subtitle: t("offer.paywall.point.history.subtitle"),
        };

  const points: { title: string; subtitle: string }[] = [
    {
      title: t("offer.paywall.point.tracked.title", { vehicle: vehicleName }),
      subtitle: t("offer.paywall.point.tracked.subtitle", { count: plan.items.length }),
    },
    middle,
    {
      title: t("offer.paywall.point.reminders.title"),
      subtitle: t("offer.paywall.point.reminders.subtitle"),
    },
  ];

  return (
    <View style={{ gap: tokens.space.sm + 2 }}>
      {points.map((point) => (
        <View key={point.title} style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm }}>
          <View style={{ paddingTop: 1 }}>
            <Check size={14} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }}>{point.title}</Text>
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{point.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
