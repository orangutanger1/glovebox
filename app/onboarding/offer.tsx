import { useState } from "react";
import { Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
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
 * Both controls end onboarding. There is no third ask.
 */
export default function OnboardingOffer() {
  const finish = useFinish();
  const [busy, setBusy] = useState(false);

  async function onSeeOffer() {
    if (busy) return;
    setBusy(true);
    if ((await presentOffering(DISCOUNT_OFFERING)) === "purchased") {
      recordReviewEvent("purchase");
    }
    finish();
  }

  return (
    <OnboardingScreen
      route="offer"
      center
      title={`Try it for ${TRIAL_DAYS} days.`}
      subtitle={`You have seen the price and said no, which is a fair answer. So don't pay yet — take ${TRIAL_DAYS} days of Pro for nothing, and decide once your car has actually told you something. This is the only screen the trial appears on.`}
      footer={
        <>
          <Button label={`Start my ${TRIAL_DAYS} free days`} onPress={onSeeOffer} disabled={busy} />
          <Pressable
            onPress={finish}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              No thanks, take me in
            </Text>
          </Pressable>
        </>
      }
    >
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        Cancel in Settings before it ends and you pay nothing. Either way your plan is saved, your
        records are yours, and the free app is the whole app for one car.
      </Text>
    </OnboardingScreen>
  );
}
