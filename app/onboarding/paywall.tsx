import { useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { Check } from "../../src/design/Check";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatNumber, t } from "../../src/i18n";
import { DISCOUNT_OFFERING, hasOffering, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance, useFinish } from "../../src/onboarding/nav";

/** Three consequences, not three features. Each is a thing that happens to the
 *  user rather than a capability the app has, and none of them names a number,
 *  a price or a percentage, so none of them goes stale when the offering is
 *  edited or has to be checked against the dashboard. */
const IMPACT = [
  "offer.paywall.impact.warned",
  "offer.paywall.impact.upsell",
  "offer.paywall.impact.resale",
] as const;

/**
 * The offer, at the end of onboarding.
 *
 * The argument is built in three layers, and the layers are the reason this is
 * a screen rather than a button: the headline, which sells the feeling and not
 * the product; the gauges, which are this user's own car by name with the
 * count and the date the quiz computed, so the headline is evidenced rather
 * than asserted; and three consequences underneath, which say what the
 * evidence is worth in the order the driver meets it.
 *
 * The car's dated schedule is not here. It rode on this screen briefly, on the
 * theory that "Cars don't warn you. This does." is only a claim until the six
 * overdue rows sit under it, and what it produced was a page: six rows of
 * service names between the headline and the only control, on the one screen
 * in the flow that is asking for money. The list belongs to the reminder ask
 * on the screen before, which is the thing it is evidence for.
 *
 * The paywall itself is a native RevenueCat sheet configured in the dashboard,
 * so this screen is the argument and the sheet is the price list. It exists as
 * a route rather than a modal fired from the last step for one reason: the
 * user who closes the sheet has to land somewhere, and landing back in the
 * garage means the second offer can never be made.
 *
 * There is one control, and no free door. The "Start with the free app" link
 * that used to sit under it, and the free-mode landing that later replaced it
 * at the end of the flow, both spent the app's last screen selling the version
 * that earns nothing: a user shown a page of what is free forever has been
 * talked out of the trial they were one tap from. Declining both asks now ends
 * onboarding in the garage, with the plan they built already in it. Nothing
 * here traps the user; the sheet closes on a swipe and every dismissal path
 * finishes the flow.
 */
export default function OnboardingPaywall() {
  const advance = useAdvance("paywall");
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
    // user goes to the garage rather than tapping a second dead button.
    if (outcome === "dismissed" && (await hasOffering(DISCOUNT_OFFERING))) advance();
    else finish("free");
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
              value={formatNumber(plan.pastDue)}
              lamp={plan.pastDue > 0}
            />
            <Gauge
              legend={t("offer.paywall.nextUp")}
              value={next?.dueAt ? formatDate(next.dueAt) : t("offer.paywall.none")}
              align="right"
            />
          </View>
        </View>
      </Panel>

      {/* The argument the numbers above are evidence for. The gauges say what
          is true of this car; these three say what it is worth, in the order
          the user meets it: the warning that arrives in time, the shop visit
          they walk into informed, and the log they hand over at the end. The
          car's own dated schedule sits on the screen before this one, under
          the reminder ask it belongs to; reprinting it here made this screen a
          document and buried the offer below six rows of it. */}
      <View style={{ gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
          {t("offer.paywall.impact.legend")}
        </Text>
        <Panel>
          <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
            {IMPACT.map((key) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: tokens.space.sm,
                }}
              >
                {/* A tick, not a lamp. The lamp is the car's warning light and
                    it is red; these three lines are what the user gets, and
                    stamping the app's alarm signal on them said the opposite. */}
                <View style={{ paddingTop: 0 }}>
                  <Check />
                </View>
                <Text
                  style={{ ...tokens.text.body, color: tokens.color.text, flex: 1 }}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
        </Panel>
      </View>
    </OnboardingScreen>
  );
}
