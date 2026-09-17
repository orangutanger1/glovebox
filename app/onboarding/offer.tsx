import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListRow } from "../../src/design/ListRow";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { INTRO_DAYS, restore } from "../../src/purchases";
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

/** The three moments a trial has, in the order the user meets them. */
const STEPS = ["now", "runs", "ends"] as const;

/**
 * The second ask, and, once there is nothing left to ask, the wall.
 *
 * The first paywall asks for money at full price. This one sells the product
 * that carries the App Store introductory offer: a cheap first week, then it
 * renews. The split is the whole reason there are two screens: a trial shown
 * first is given to everyone who would have paid, and a trial shown to the
 * people walking out is the cheapest conversion in the funnel.
 *
 * The price is drawn here now (see paywall.tsx for why the sheet went): one
 * wide card in the footer, the standard price struck through beside the
 * introductory one, "then {price} per week" under it. Above it, under the
 * title: the offer in one sentence with both prices, the list of what the
 * week opens, and how the offer runs. When StoreKit says this customer is
 * not eligible, the title is the plain one, the sentence is the paywall's,
 * the card shows the plain weekly price with no strike-through, and the
 * legend is gone, so nothing on the glass promises what Apple's sheet will
 * not honour. In sandbox that is what a tester who has already bought the
 * weekly product on this Apple ID sees; the offer is not missing, they have
 * used it.
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

  const { plans, loading, retry } = usePlans("discount");
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
  // Optimistic while the plans are still loading (`chosen` is null): most
  // customers are eligible, so the trial framing is the one worth drawing
  // first. Once a plan is chosen, an ineligible customer gets the plain
  // title, and never the intro rows and legend a sheet down the line will
  // not honour.
  const hasIntro = chosen ? chosen.intro !== null : true;

  /** Where a successful purchase goes. A relaunched subscriber finished
   *  onboarding long ago and must not be counted as a completion. */
  function paid(exit: "trial" | "paid") {
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
        paid("trial");
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
        paid("paid");
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

  // The one sentence that says what the offer is, with both of StoreKit's
  // prices in it. Only once a plan is in hand: a sentence with the prices
  // blank is worse than no sentence.
  const subtitle =
    chosen?.intro
      ? t("offer.trial.subtitle", {
          count: INTRO_DAYS,
          intro: chosen.intro.priceString,
          price: chosen.priceString,
        })
      : hasIntro
        ? undefined
        : t("offer.paywall.subtitle");

  return (
    <OnboardingScreen
      route="offer"
      title={
        hasIntro
          ? tNamed("offer.trial.title", { count: INTRO_DAYS })
          : tNamed("offer.paywall.title")
      }
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
            label={chosen?.intro ? t("offer.trial.cta") : undefined}
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
      {/* Everything the week opens, a tick and a line each. This is the list
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

      {hasIntro && (
        <>
          <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
            {t("offer.trial.legend")}
          </Text>
          <Panel>
            <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
              {STEPS.map((step) => (
                <ListRow
                  key={step}
                  title={t(`offer.trial.${step}.title`)}
                  subtitle={t(`offer.trial.${step}.body`)}
                />
              ))}
            </View>
          </Panel>
        </>
      )}
    </OnboardingScreen>
  );
}
