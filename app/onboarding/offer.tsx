import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { ListRow } from "../../src/design/ListRow";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { DISCOUNT_OFFERING, TRIAL_DAYS, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useFinish } from "../../src/onboarding/nav";

/** The three moments a trial has, in the order the user meets them: what opens
 *  now, the way out, and what happens if they do nothing. Named rather than
 *  numbered — the day count lives in the title, and a row that said "Day 3"
 *  would go stale the moment the offering's introductory period is edited. */
const STEPS = ["now", "runs", "ends"] as const;

/**
 * The one retry, and the last screen in the flow.
 *
 * The first paywall asks for money. This one asks for nothing, because it
 * sells the product that carries the App Store introductory offer — a free
 * trial, then it renews. That split is the whole reason there are two
 * paywalls: a trial shown first is given away to everyone who would have paid,
 * and a trial shown only to the people walking out is the cheapest conversion
 * in the funnel.
 *
 * It is only ever reached from a dismissed paywall, and only when a `discount`
 * offering actually exists in the RevenueCat dashboard: the check happens
 * before the navigation, so this screen never promises a trial that cannot be
 * started. The renewal terms are the paywall's job. RevenueCat renders the
 * price and the disclosure Apple requires, both on the sheet one tap away, and
 * this screen carried a "cancel in Settings before it ends" line under the
 * buttons that said it first, in the app's own voice: the last thing read
 * before the ask was an instruction for getting out of it.
 *
 * A purchase ends onboarding, and so does declining: the flow finishes in the
 * garage with the car and the plan the quiz built already in it. It used to
 * advance to a "start in free mode" landing, which spent the last screen of
 * the funnel listing what costs nothing to a user who had just been within one
 * tap of a trial. The free tier is what the app does when nobody pays; it is
 * not something to sell.
 *
 * The screen carried the headline and nothing else, which asked the user to
 * take the word "free" on trust at the one moment they are deciding whether
 * they are about to be charged. The three rows under it answer that: what
 * opens now, how to get out, and what happens if they do nothing. The price
 * itself is still the sheet's job — it is the only thing that knows it.
 */
export default function OnboardingOffer() {
  const finish = useFinish();
  const [busy, setBusy] = useState(false);

  async function onSeeOffer() {
    if (busy) return;
    setBusy(true);
    if ((await presentOffering(DISCOUNT_OFFERING)) === "purchased") {
      recordReviewEvent("purchase");
      finish("trial");
      return;
    }
    // Dismissed, or the offering could not be presented. Either way the trial
    // was not started, and there is nothing further to ask.
    finish("free");
  }

  return (
    <OnboardingScreen
      route="offer"
      title={t("offer.trial.title", { count: TRIAL_DAYS })}
      subtitle={t("offer.trial.subtitle")}
      footer={
        <>
          <Button
            label={t("offer.trial.cta", { count: TRIAL_DAYS })}
            onPress={onSeeOffer}
            disabled={busy}
          />
          <Pressable
            onPress={() => finish("free")}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.trial.decline")}
            </Text>
          </Pressable>
        </>
      }
    >
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
    </OnboardingScreen>
  );
}
