import { useState } from "react";
import { Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { DISCOUNT_OFFERING, TRIAL_DAYS, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useFinish } from "../../src/onboarding/nav";

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
 * offering actually exists in the RevenueCat dashboard — the check happens
 * before the navigation, so this screen never promises a trial that cannot be
 * started. The renewal terms are the paywall's job; RevenueCat renders the
 * price and the disclosure Apple requires, and repeating a number here would
 * be wrong the moment somebody edits the offering.
 *
 * A purchase ends onboarding, and so does declining: the flow finishes in the
 * garage with the car and the plan the quiz built already in it. It used to
 * advance to a "start in free mode" landing, which spent the last screen of
 * the funnel listing what costs nothing to a user who had just been within one
 * tap of a trial. The free tier is what the app does when nobody pays; it is
 * not something to sell.
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
      center
      title={t("offer.trial.title", { count: TRIAL_DAYS })}
      subtitle={t("offer.trial.subtitle", { count: TRIAL_DAYS })}
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
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("offer.trial.caption")}
      </Text>
    </OnboardingScreen>
  );
}
