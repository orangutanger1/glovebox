import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { defaultPlan } from "../../src/paywall/PlanPicker";
import { Button } from "../../src/design/Button";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { GETS } from "../../src/paywall/IncludedStrip";
import { Check } from "../../src/design/Check";
import { recordReviewEvent } from "../../src/review";
import { isGrandfathered } from "../../src/paywall";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { tNamed } from "../../src/onboarding";
import { useFinish } from "../../src/onboarding/nav";
import { track } from "../../src/analytics";
import { recordObjection, shouldAskObjection, type Objection, type ObjectionTrigger } from "../../src/survey";
import { ObjectionSheet } from "../../src/survey/ObjectionSheet";

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
 * The page is the deal, read top to bottom in the order a stranger reads
 * a sale: the eyebrow says what kind of screen this is, the saving is the
 * headline in the biggest type in the flow, the list says what the money
 * opens, and the price sits directly over the button that pays it, the
 * standard weekly struck through beside it. No card: one plan is not a
 * choice, and a selected card with nothing to select it against is a
 * control with no job. `compareAt` is read off the standard offering in
 * `plans.ts`; when the store has no standard yearly to compare with there
 * is no saving to headline, so the screen falls back to the paywall's title
 * and a plain price, and nothing on the glass claims a gap it cannot show.
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // "What stopped you?", when it is open, and what opened it. Asked once per
  // install, on the first of the two ways a user says no here.
  const [asking, setAsking] = useState<ObjectionTrigger | null>(null);

  const mounted = useRef(Date.now());

  useEffect(() => {
    track("paywall_shown", { offering: "discount" });
  }, []);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: "discount", ms: Date.now() - mounted.current });
  }, [plans]);

  const chosen: Plan | null =
    plans?.find((p) => p.id === defaultPlan(plans)) ?? null;
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
        // The receipt, felt: the same success the log gives a saved service,
        // for the one tap in the app that cost money.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        recordReviewEvent("purchase");
        // A sale at a flat price. It was "trial" while the offering carried an
        // introductory week; nothing on it trials now, and the exit reason
        // says what was bought rather than what this screen used to sell.
        paid("paid");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
      // Backed out of Apple's sheet: wanted the deal, balked at the charge.
      // The user stays on the offer either way.
      if (outcome === "dismissed" && shouldAskObjection()) setAsking("sheet_cancelled");
    } finally {
      setBusy(false);
    }
  }

  function onDecline() {
    // The last decision in the flow, and the one the funnel could not see.
    track("offer_declined", { walled: !isGrandfathered(), relaunched });
    // Asked before leaving, then the decline carries on as if it had not been.
    if (shouldAskObjection()) {
      setAsking("declined");
      return;
    }
    leave();
  }

  function onObjection(reason: Objection | null) {
    const trigger = asking;
    setAsking(null);
    if (!trigger) return;
    recordObjection(reason, trigger, "discount");
    if (trigger === "declined") leave();
  }

  function leave() {
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

  // Without a gap to show, the paywall's sentence under the plain title.
  const subtitle = hasDeal ? undefined : t("offer.paywall.subtitle");

  return (
    <OnboardingScreen
      route="offer"
      // While the deal is on, the headline is the saving, drawn in the body
      // below; the screen's own title slot stays empty.
      title={hasDeal ? undefined : tNamed("offer.paywall.title")}
      subtitle={subtitle}
      hideBack={relaunched}
      footer={
        <>
          {msg !== null && (
            <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>{msg}</Text>
          )}
          {plans === null ? (
            <Pressable onPress={retry} disabled={loading} style={{ alignItems: "center", padding: tokens.space.md }}>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                {loading ? t("paywall.loading") : t("paywall.retry")}
              </Text>
            </Pressable>
          ) : null}
          <BuyFooter
            plan={chosen}
            busy={busy}
            onBuy={onBuy}
            onRestore={onRestore}
            variant={hasDeal ? "accent" : "primary"}
            label={chosen?.compareAt ? t("offer.trial.cta") : undefined}
            lead={chosen ? <PriceLine plan={chosen} /> : null}
          >
            {!relaunched && (
              <Button label={t("offer.trial.decline")} onPress={onDecline} disabled={busy} variant="secondary" />
            )}
          </BuyFooter>
          <ObjectionSheet visible={asking !== null} onDone={onObjection} />
        </>
      }
    >
      {hasDeal && (
        <View style={{ alignItems: "center", gap: tokens.space.sm, marginBottom: tokens.space.xl }}>
          {/* The eyebrow is the one tracked, uppercased label in the app,
              because it is the one label whose job is to be a stamp rather
              than a name: it says what kind of page this is, and gets out of
              the way of the figure. */}
          <Text
            style={{
              ...tokens.text.legend,
              color: tokens.color.textMuted,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {t("offer.deal.title")}
          </Text>
          {/* The figure waits for the store: a percentage drawn before the
              prices it is computed from would be the one invented number on
              the page. The eyebrow holds the slot until it lands. */}
          {chosen?.compareAt && (
            <Text
              style={{
                ...tokens.text.hero,
                fontSize: 56,
                lineHeight: 62,
                letterSpacing: -1.6,
                color: tokens.color.green,
                textAlign: "center",
                textTransform: "uppercase",
                ...tokens.text.numeric,
              }}
            >
              {t("offer.deal.pct", { pct: chosen.compareAt.pct })}
            </Text>
          )}
        </View>
      )}
      {/* Everything the plan opens, a tick and a line each. This is the list
          the paywall compressed into chips; here it gets the page, because
          the screen has no car-specific rows to make the argument for it. */}
      <View style={{ gap: tokens.space.md, paddingHorizontal: tokens.space.sm }}>
        {GETS.map((id) => (
          <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md }}>
            <Check size={17} filled={hasDeal} />
            <Text style={{ ...tokens.text.body, fontSize: 17, color: tokens.color.text, flex: 1 }}>
              {t(`offer.trial.gets.${id}`)}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

/**
 * The price, once, over the button: the standard weekly struck through, then
 * what this plan costs per week, in the type the readouts use. The renewal
 * line under the button says the yearly total; this line says the weekly
 * figure the saving was computed from, so the two prices on the glass are
 * the two the percentage is about.
 */
function PriceLine({ plan }: { plan: Plan }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: tokens.space.sm,
        paddingBottom: tokens.space.xs,
      }}
    >
      {plan.compareAt && (
        <Text
          style={{
            ...tokens.text.heading,
            color: tokens.color.textFaint,
            textDecorationLine: "line-through",
            ...tokens.text.numeric,
          }}
        >
          {plan.compareAt.priceString}
        </Text>
      )}
      <Text style={{ ...tokens.text.hero, color: tokens.color.text, ...tokens.text.numeric }}>
        {plan.perWeek}
        <Text style={{ ...tokens.text.heading, color: tokens.color.textMuted }}>{` ${t("paywall.per.week")}`}</Text>
      </Text>
    </View>
  );
}
