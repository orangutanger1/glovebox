import { useEffect, useRef, useState } from "react";
import { Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
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

  // Shown once per mount, in the sheet's vocabulary, so the funnel's
  // `paywall_shown → paywall_presented` step keeps meaning "tapped → drawn".
  useEffect(() => {
    track("paywall_shown", { offering: "current" });
  }, []);
  useEffect(() => {
    if (plans) {
      // Whether the preview's open row had a date to show: a "not sure" on
      // the service question leaves it undated, and the two may read apart.
      const open = previewOpen(plan);
      track("paywall_presented", {
        offering: "current",
        ms: Date.now() - mounted.current,
        preview: open?.dueAt ? "dated" : open ? "undated" : "none",
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
      <PlanPreview plan={plan} vehicleName={vehicleName} unit={getDistanceUnit()} />

      <IncludedStrip />

      <ReviewCard />
    </OnboardingScreen>
  );
}
