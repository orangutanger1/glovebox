import { useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { Check } from "../../src/design/Check";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatNumber, t } from "../../src/i18n";
import { presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { tNamed } from "../../src/onboarding";
import { useAdvance, useFinish } from "../../src/onboarding/nav";

/** What the subscription is, in three lines: the reminder, the schedule it is
 *  computed from, and the log both write to. Three and no more — this is the
 *  screen asking for money, and a reader deciding whether to pay reads a short
 *  list or none of it. The longer list is on the trial screen behind it.
 *
 *  Named by feature id and read from the features fragment, so a capability
 *  cannot be described one way in the feature list and another here. */
const FEATURES = ["reminders", "due", "history"] as const;

/**
 * The offer, at the end of onboarding.
 *
 * The argument is built in three layers, and the layers are the reason this is
 * a screen rather than a button: the headline, which sells the feeling and not
 * the product; the gauges, which are this user's own car by name with the
 * count and the date the quiz computed, so the headline is evidenced rather
 * than asserted; and three features underneath, which say what the
 * subscription actually does about it.
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
 * onboarding in the garage, with the plan they built already in it. Every
 * dismissal path leads to the trial screen, which is where the flow ends.
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
    // A dismissal is the whole reason the trial exists, so it goes there —
    // and so does a paywall that could not present at all, because the screen
    // it advances to is now the end of the flow rather than a stop on the way
    // to one. It falls back to the current offering when there is no discount
    // offering to show, so it is never the dead button this branch used to
    // route around.
    advance();
  }

  return (
    <OnboardingScreen
      route="paywall"
      // The one screen in the flow that asks for money, addressed to the person
      // who was asked their name on screen two. `tNamed` falls back to the
      // unnamed sentence for an install that predates that screen.
      title={tNamed("offer.paywall.title")}
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

      {/* What the gauges above are bought with. These used to be three
          consequences — warned in time, nothing sold to you twice, a log that
          shows in the resale price — which sold a feeling the screen could not
          show. The app is no longer freemium, so the honest thing to put in
          front of the price is what the price buys. */}
      <View style={{ gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
          {t("offer.features.title")}
        </Text>
        <Panel>
          <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
            {FEATURES.map((id) => (
              <View
                key={id}
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
                <View style={{ flex: 1, gap: tokens.space.xs }}>
                  <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                    {t(`features.${id}.title`)}
                  </Text>
                  <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                    {t(`features.${id}.subtitle`)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Panel>
      </View>
    </OnboardingScreen>
  );
}
