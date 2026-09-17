import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { tokens } from "../src/design/tokens";
import { t } from "../src/i18n";
import { restore } from "../src/purchases";
import { buy, usePlans, type OfferingId, type Plan, type PurchaseResult } from "../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../src/paywall/PlanPicker";
import { BuyFooter } from "../src/paywall/BuyFooter";
import { ReviewCard } from "../src/paywall/ReviewCard";
import { IncludedStrip } from "../src/paywall/IncludedStrip";
import { CloseButton } from "../src/paywall/CloseButton";
import { settlePaywall } from "../src/paywall/present";
import { recordReviewEvent } from "../src/review";
import { track } from "../src/analytics";

/**
 * The paywall every feature gate opens.
 *
 * Add a second vehicle, edit intervals, unlock fuel insights, "Try Pro" in
 * the menu, the win-back screen: each used to await a RevenueCat sheet. They
 * await this screen now, through `src/paywall/present`, and read the answer
 * exactly as before. Purchases here never touch onboarding state; that is
 * the two onboarding screens' job.
 *
 * `offering=discount` draws the introductory weekly plan (the "Try Pro" and
 * win-back paths); anything else draws the default set.
 *
 * Whatever way this screen leaves, the caller hears once. A close, a swipe
 * back, a purchase, and an unmount from a navigation reset all settle the
 * same promise, and `answered` makes the second and later of those no-ops.
 */
export default function PaywallRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ offering?: string; source?: string }>();
  const offering: OfferingId = params.offering === "discount" ? "discount" : "default";
  const label = offering === "default" ? "current" : "discount";

  const { plans, loading, retry } = usePlans(offering);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const answered = useRef(false);
  const mounted = useRef(Date.now());

  useEffect(() => {
    track("paywall_shown", { offering: label });
  }, [label]);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: label, ms: Date.now() - mounted.current });
  }, [plans, label]);

  function settle(result: PurchaseResult) {
    if (answered.current) return;
    answered.current = true;
    settlePaywall(result);
  }

  // A screen popped by a gesture or a reset never ran `onClose`; the caller
  // still has to hear something, or its `await` never returns.
  useEffect(() => () => settle("dismissed"), []);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;

  function leave(result: PurchaseResult) {
    settle(result);
    if (router.canGoBack()) router.back();
  }

  function onClose() {
    track("paywall_closed", { offering: label, outcome: "dismissed", result: "DECLINED" });
    leave("dismissed");
  }

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, offering);
      if (outcome === "purchased") {
        recordReviewEvent("purchase");
        leave("purchased");
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
      track("restore_attempted", { source: `paywall_${params.source ?? "unknown"}`, found });
      if (found) {
        recordReviewEvent("purchase");
        leave("purchased");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: `paywall_${params.source ?? "unknown"}`, found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  // The plans ride in the footer with the button, under the glass, so the
  // price is on the glass however far the reader scrolls the argument.
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <>
          {plans ? (
            <PlanPicker
              plans={plans}
              selected={chosen?.id ?? defaultPlan(plans)}
              onSelect={setSelected}
              offering={label}
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...tokens.text.title, color: tokens.color.text }}>{t("paywall.title")}</Text>
        <CloseButton onPress={onClose} disabled={busy} />
      </View>

      <IncludedStrip />
      <ReviewCard />
    </Screen>
  );
}
