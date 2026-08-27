import { useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatNumber, t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import { DISCOUNT_OFFERING, hasOffering, presentOffering } from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { nextUp, planItemLine } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance, useFinish } from "../../src/onboarding/nav";

const ROW_STATUS = { due: "overdue", soon: "soon", ok: "ok" } as const;

/** The status is a state name the schedule computes, not copy — it reaches the
 *  faceplate through a key so no language is stuck with the English word. */
const STATUS_LABEL = {
  due: "offer.plan.status.due",
  soon: "offer.plan.status.soon",
  ok: "offer.plan.status.ok",
} as const;

/** The whole schedule is real, but a screen with twelve rows on it is a
 *  document, not a plan. The rest is one line of arithmetic underneath. */
const SHOWN = 6;

/**
 * The plan and the offer, on one screen, at the end of onboarding.
 *
 * The plan used to be its own screen before this one, and the notification
 * soft-ask rode on top of it. The ask is now its own screen earlier in the
 * flow, and what was left of the plan — this car's own dated schedule — belongs
 * against the argument that pays for it. "Cars don't warn you. This does." is
 * only a claim until the list under it is the user's own six overdue services,
 * so the two are one screen: the headline, the numbers it stands on, and the
 * schedule it is promising to keep.
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
  const remaining = plan.items.length - SHOWN;
  const unit = getDistanceUnit();

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

      <View style={{ gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
          {t("offer.plan.title")}
        </Text>
        <Panel>
          <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
            {plan.items.slice(0, SHOWN).map((item) => (
              <ListRow
                key={item.type}
                title={serviceName(item.type)}
                subtitle={planItemLine(item, unit)}
                status={ROW_STATUS[item.status]}
                right={<Badge label={t(STATUS_LABEL[item.status])} tone={item.status} />}
              />
            ))}
          </View>
        </Panel>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {remaining > 0
            ? t("offer.plan.noteMore", { count: remaining })
            : t("offer.plan.note")}
        </Text>
      </View>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("offer.paywall.caption")}
      </Text>
    </OnboardingScreen>
  );
}
