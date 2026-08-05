import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { tokens } from "../../src/design/tokens";
import { DISCOUNT_OFFERING, hasOffering, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance, useFinish } from "../../src/onboarding/nav";

/**
 * The offer, at the end of onboarding, which is where it converts.
 *
 * The paywall itself is a native RevenueCat sheet configured in the dashboard,
 * so this screen is the argument and the sheet is the price list. It exists as
 * a route rather than a modal fired from the last step for one reason: the
 * user who closes the sheet has to land somewhere, and landing back in the
 * garage means the second offer can never be made.
 *
 * Everything above the button is the user's own plan restated. No countdown,
 * no "87% of users choose annual", nothing on this screen that would not
 * survive being checked.
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
      finish();
      return;
    }
    // Only a user who was shown a price has earned the second one. A paywall
    // that could not present — no API key in the build, no network, products
    // not yet fetchable — has told them nothing to reconsider, and a discount
    // screen after it would be advertising a price they never saw.
    if (outcome === "dismissed" && (await hasOffering(DISCOUNT_OFFERING))) {
      advance();
      return;
    }
    finish();
  }

  return (
    <OnboardingScreen
      route="paywall"
      title="Your garage is ready."
      subtitle="The plan below is yours either way, and Pro is the rest of the garage plus your own intervals."
      footer={
        <>
          <Button label="See Glovebox Pro" onPress={onSeeOffer} disabled={busy} />
          <Pressable
            onPress={finish}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              Start with the free app
            </Text>
          </Pressable>
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge legend="Vehicle" value={vehicleName} />
            <Gauge
              legend="Scheduled"
              value={String(plan.items.length)}
              unit="services"
              align="right"
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge legend="Due now" value={String(plan.dueNow)} lamp={plan.dueNow > 0} />
            <Gauge
              legend="Next up"
              value={next?.dueAt ? new Date(next.dueAt).toLocaleDateString() : "None"}
              align="right"
            />
          </View>
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        One car, unlimited history and CSV export are free forever, including after a cancelled
        subscription.
      </Text>
    </OnboardingScreen>
  );
}
