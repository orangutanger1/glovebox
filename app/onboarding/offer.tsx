import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../../src/paywall/PlanPicker";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { GETS } from "../../src/paywall/IncludedStrip";
import { Check } from "../../src/design/Check";
import { recordReviewEvent } from "../../src/review";
import { isGrandfathered } from "../../src/paywall";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { tNamed } from "../../src/onboarding";
import { useFinish } from "../../src/onboarding/nav";
import { track } from "../../src/analytics";

/**
 * The second ask, and, once there is nothing left to ask, the wall.
 *
 * The first paywall asks for money at the standard prices. This one sells a
 * yearly plan at a lower one, from the `discount` offering, and nothing else.
 * The split is the whole reason there are two screens: a cheaper price shown
 * first is given to everyone who would have paid the standard one, and shown
 * to the people walking out it is the cheapest conversion in the funnel.
 *
 * It used to sell a weekly product with a $0.99 introductory week. That put
 * the intro on the first screen too — StoreKit attaches an intro to the
 * product, not the screen — and a week that renews at the weekly price is a
 * worse deal than it reads. A yearly plan at a plain lower price has no
 * eligibility rule to trip over and no renewal surprise.
 *
 * The price is drawn here (see paywall.tsx for why the sheet went): one wide
 * card in the footer, the first screen's yearly price struck through, the
 * per-week figure under it and the saving beside it. `compareAt` is read off
 * the standard offering in `plans.ts`; when the store has no standard yearly
 * to compare with, the card shows a plain price and the title is the plain
 * one, so nothing on the glass claims a gap it cannot show.
 *
 * "I'd rather pay full price" is the soft decline: it is a true sentence, and
 * it goes back to the paywall, which is the screen that sells full price.
 *
 * Relaunched with `walled=1` (a lapsed or never-subscribed install that
 * finished onboarding), the same screen is the wall: no Back, no decline, and
 * Restore where the decline was, because a wall has to carry the way in for
 * the subscriber whose receipt has not synced (Guideline 3.1.1).
 */
export default function OnboardingOffer() {
  const router = useRouter();
  const finish = useFinish();
  const { walled } = useLocalSearchParams<{ walled?: string }>();
  const relaunched = walled === "1";

  const { plans: offered, loading, retry } = usePlans("discount");
  // One plan. The screen sells the yearly at the offer price and nothing
  // beside it — a second card is a comparison the reader makes instead of a
  // decision. The offering can carry more than one package while a new
  // product waits on App Store review (the old weekly stays on it so the
  // installed bundle keeps a button); until StoreKit returns the yearly, the
  // screen sells what it has.
  //
  // Memoised on `offered`: the `paywall_presented` effect below keys on this
  // list, and a `filter` rebuilt on every render re-fired it on every tap.
  const plans = useMemo(
    () =>
      offered && offered.some((p) => p.period === "year")
        ? offered.filter((p) => p.period === "year")
        : offered,
    [offered]
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mounted = useRef(Date.now());

  useEffect(() => {
    track("paywall_shown", { offering: "discount" });
  }, []);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: "discount", ms: Date.now() - mounted.current });
  }, [plans]);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;
  // Optimistic while the plans are still loading (`chosen` is null): the
  // deal is the framing worth drawing first. Once a plan is in hand, a store
  // that could not show the gap gets the plain title.
  const hasDeal = chosen ? chosen.compareAt !== undefined : true;

  /** Where a successful purchase goes. A relaunched subscriber finished
   *  onboarding long ago and must not be counted as a completion. */
  function paid(exit: "paid" | "restored") {
    if (relaunched) {
      router.replace("/");
      return;
    }
    finish(exit);
  }

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, "discount");
      if (outcome === "purchased") {
        recordReviewEvent("purchase");
        // A sale at a flat price. It was "trial" while the offering carried an
        // introductory week; nothing on it trials now, and the exit reason
        // says what was bought rather than what this screen used to sell.
        paid("paid");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  function onDecline() {
    // The last decision in the flow, and the one the funnel could not see.
    track("offer_declined", { walled: !isGrandfathered(), relaunched });
    if (isGrandfathered()) {
      finish("free");
      return;
    }
    router.back();
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await restore();
      track("restore_attempted", { source: "onboarding_offer", found });
      if (found) {
        recordReviewEvent("purchase");
        paid("restored");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: "onboarding_offer", found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  // No sentence under the title while the deal is on. The title says it is
  // the same Pro for less, the card shows the two prices, and the footer says
  // what it renews at; a subtitle would be one of those a second time, in
  // the way of the list. Without a gap to show, the paywall's sentence.
  const subtitle = hasDeal ? undefined : t("offer.paywall.subtitle");

  return (
    <OnboardingScreen
      route="offer"
      // No name on the deal headline: "Limited time offer." is the whole line.
      title={hasDeal ? t("offer.deal.title") : tNamed("offer.paywall.title")}
      subtitle={subtitle}
      hideBack={relaunched}
      footer={
        <>
          {plans ? (
            <PlanPicker
              plans={plans}
              selected={chosen?.id ?? defaultPlan(plans)}
              onSelect={setSelected}
              layout="cards"
              offering="discount"
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
          <BuyFooter
            plan={chosen}
            busy={busy}
            onBuy={onBuy}
            onRestore={onRestore}
            label={chosen?.compareAt ? t("offer.trial.cta") : undefined}
          >
            {!relaunched && (
              <Pressable
                onPress={onDecline}
                disabled={busy}
                style={{ alignItems: "center", paddingVertical: tokens.space.xs }}
              >
                <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
                  {t("offer.trial.decline")}
                </Text>
              </Pressable>
            )}
          </BuyFooter>
        </>
      }
    >
      {/* Everything the plan opens, a tick and a line each. This is the list
          the paywall compressed into chips; here it gets the page, because
          the screen has no car-specific rows to make the argument for it. */}
      <View style={{ gap: tokens.space.sm + 2 }}>
        {GETS.map((id) => (
          <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
            <Check size={14} />
            <Text style={{ ...tokens.text.body, color: tokens.color.text, flex: 1 }}>
              {t(`offer.trial.gets.${id}`)}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}
