import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Check } from "../../src/design/Check";
import { tokens } from "../../src/design/tokens";
import { formatDate, t } from "../../src/i18n";
import { restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../../src/paywall/PlanPicker";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { ReviewCard } from "../../src/paywall/ReviewCard";
import { IncludedStrip } from "../../src/paywall/IncludedStrip";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
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
 * Top to bottom: the promise, three rows that evidence it against this car,
 * what the subscription includes, the one review the app has, the plans, the
 * button. Everything fits without scrolling on a 4.7" screen; a scroll on a
 * paywall is a fold, and what is below a fold is not read.
 *
 * "Not now" is the decline the sheet's close button used to be. It goes to
 * the trial, which is the whole reason the trial exists. There is still no
 * free door.
 */
export default function OnboardingPaywall() {
  const advance = useAdvance("paywall");
  const finish = useFinish();
  const { vehicleName, plan } = useOnboardingFindings();
  const { plans, loading, retry } = usePlans("default");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mounted = useRef(Date.now());

  // Shown once per mount, in the sheet's vocabulary, so the funnel's
  // `paywall_shown → paywall_presented` step keeps meaning "tapped → drawn".
  useEffect(() => {
    track("paywall_shown", { offering: "current" });
  }, []);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: "current", ms: Date.now() - mounted.current });
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
        finish("paid");
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

  function onNotNow() {
    track("paywall_closed", { offering: "current", outcome: "dismissed", result: "DECLINED" });
    advance();
  }

  const next = nextUp(plan);
  const dueTitle =
    plan.pastDue > 0
      ? t("offer.paywall.point.due.title", { count: plan.pastDue })
      : t("offer.paywall.point.due.none");
  const dueSubtitle = next?.dueAt
    ? t("offer.paywall.point.due.subtitle", { date: formatDate(next.dueAt) })
    : t("offer.paywall.point.due.noNext");

  const points: { title: string; subtitle: string }[] = [
    {
      title: t("offer.paywall.point.tracked.title", { vehicle: vehicleName }),
      subtitle: t("offer.paywall.point.tracked.subtitle", { count: plan.items.length }),
    },
    { title: dueTitle, subtitle: dueSubtitle },
    {
      title: t("offer.paywall.point.reminders.title"),
      subtitle: t("offer.paywall.point.reminders.subtitle"),
    },
  ];

  return (
    <OnboardingScreen
      route="paywall"
      title={tNamed("offer.paywall.title")}
      subtitle={t("offer.paywall.subtitle")}
      footer={
        <BuyFooter plan={chosen} busy={busy} onBuy={onBuy} onRestore={onRestore}>
          <Pressable
            onPress={onNotNow}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.xs }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.paywall.notNow")}
            </Text>
          </Pressable>
        </BuyFooter>
      }
    >
      <View style={{ gap: tokens.space.sm + 2 }}>
        {points.map((point) => (
          <View
            key={point.title}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm }}
          >
            <View style={{ paddingTop: 1 }}>
              <Check size={14} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }}>
                {point.title}
              </Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{point.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <IncludedStrip />

      <ReviewCard />

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
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </OnboardingScreen>
  );
}
