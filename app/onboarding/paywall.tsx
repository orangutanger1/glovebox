import { useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatNumber, t } from "../../src/i18n";
import { DISCOUNT_OFFERING, hasOffering, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance, useFinish, useGoTo } from "../../src/onboarding/nav";

/**
 * The offer, at the end of onboarding, which is where it converts.
 *
 * The paywall itself is a native RevenueCat sheet configured in the dashboard,
 * so this screen is the argument and the sheet is the price list. It exists as
 * a route rather than a modal fired from the last step for one reason: the
 * user who closes the sheet has to land somewhere, and landing back in the
 * garage means the second offer can never be made.
 *
 * There is one control. The "Start with the free app" link that used to sit
 * under it let a user leave without ever seeing a price, which is the cheapest
 * possible way to lose the sale: it is a free door offered before the offer.
 * Free is still the honest end of this flow and it is still two taps away, but
 * it is reached by declining the price and then declining the trial, and the
 * screen that names it comes after both. Nothing here traps the user; the
 * sheet closes on a swipe and every dismissal path continues the flow.
 *
 * Everything above the button is the user's own plan restated. No countdown,
 * no "87% of users choose annual", nothing on this screen that would not
 * survive being checked.
 */
export default function OnboardingPaywall() {
  const advance = useAdvance("paywall");
  const goTo = useGoTo();
  const finish = useFinish();
  const { vehicleName, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);

  // The soonest service still ahead. `plan.items` is sorted worst-first, so
  // taking its head printed the most overdue row under a "Next up" legend.
  const next = nextUp(plan);

  async function onSeeOffer() {
    if (busy) return;
    setBusy(true);
    const outcome = await presentOffering();
    if (outcome === "purchased") {
      // Recorded, never acted on. Nothing in onboarding may ask for a rating —
      // App Store Review Guideline 5.6.3 treats soliciting one before the user
      // has meaningfully used the app as manipulating the App Store, and Apple
      // rejects for it. This only banks the signal for a later happy moment.
      recordReviewEvent("purchase");
      finish("paid");
      return;
    }
    // A dismissal is the whole reason the trial exists, so it goes there. A
    // paywall that could not present — no API key in the build, no network,
    // products not yet fetchable — has shown the user nothing to reconsider,
    // and the trial sheet would fail on the same missing offering, so that
    // user goes straight to the free landing instead of tapping a second
    // button that does nothing.
    if (outcome === "dismissed" && (await hasOffering(DISCOUNT_OFFERING))) advance();
    else goTo("free");
  }

  return (
    <OnboardingScreen
      route="paywall"
      title={t("offer.paywall.title")}
      subtitle={t("offer.paywall.subtitle")}
      footer={<Button label={t("offer.paywall.cta")} onPress={onSeeOffer} disabled={busy} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge legend={t("offer.paywall.vehicle")} value={vehicleName} />
            <Gauge
              legend={t("offer.paywall.scheduled")}
              value={formatNumber(plan.items.length)}
              unit={t("offer.paywall.services", { count: plan.items.length })}
              align="right"
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge
              legend={t("offer.paywall.dueNow")}
              value={formatNumber(plan.dueNow)}
              lamp={plan.dueNow > 0}
            />
            <Gauge
              legend={t("offer.paywall.nextUp")}
              value={next?.dueAt ? formatDate(next.dueAt) : t("offer.paywall.none")}
              align="right"
            />
          </View>
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("offer.paywall.caption")}
      </Text>
    </OnboardingScreen>
  );
}
