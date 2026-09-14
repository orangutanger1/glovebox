import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/design/Button";
import { Panel } from "../src/design/Surface";
import { Gauge } from "../src/design/Gauge";
import { Check } from "../src/design/Check";
import { Screen } from "../src/design/Screen";
import { tokens } from "../src/design/tokens";
import { features } from "../src/onboarding/features";
import { useOnboardingFindings } from "../src/onboarding/usePlan";
import { nextUp } from "../src/onboarding/plan";
import { track } from "../src/analytics";
import { formatDate, formatNumber, t } from "../src/i18n";

/**
 * The screen between paying and the garage.
 *
 * Onboarding used to end at the purchase: `finish("paid")` recorded the exit
 * and replaced the stack with the garage, so the last thing a subscriber saw
 * was the native App Store receipt and the first thing was a list with one car
 * in it. Nothing named what had been bought, nothing said what to do next, and
 * the eleven screens of argument the user had just agreed with were gone from
 * the screen at the exact moment they had committed to them.
 *
 * The competitive evidence for fixing that is unusually clean. Of the captured
 * flows in `research/onboarding-competitive`, the ones that convert hold the
 * user for three to five beats after the receipt clears — a named confirmation,
 * a restatement of what the flow already built for them, and one action. The
 * pattern is in `patterns.md` as "make the post-purchase transition immediate".
 *
 * What is deliberately not copied is the celebration. The reference flows fire
 * confetti and three full-screen congratulation beats; this app's design
 * language rules that out, and a car maintenance log that throws a party for
 * taking your money reads as a different product than the one just sold. The
 * Wrenchy version of the same beat is the panel coming up with the alarms
 * already accounted for: the same gauges the paywall argued from, now stated as
 * facts about a car that is being watched.
 *
 * The action is the car, not the garage. A free garage holds one vehicle, so
 * "open the garage" is a list of one, and the schedule the user just paid to be
 * warned about lives one level down from it.
 */
export default function Subscribed() {
  const router = useRouter();
  const { vehicle, vehiclePhrase, plan } = useOnboardingFindings();
  const next = nextUp(plan);

  useEffect(() => {
    // The counterpart to `onboarding_completed`. That event says the flow ended
    // and how; this one says the subscriber reached the screen that tells them
    // what they bought, which is the denominator for whether the first action
    // below is ever taken.
    track("subscription_success", {
      due_now: plan.dueNow,
      scheduled: plan.items.length,
      has_vehicle: vehicle !== null,
    });
  }, [plan.dueNow, plan.items.length, vehicle]);

  function onFirstAction() {
    track("first_core_action", { source: "subscribed", action: "open_vehicle" });
    // The garage first, then the car on top of it. This screen is the end of
    // onboarding and must not sit behind the car for a back-swipe to walk
    // into, so it is replaced — but replacing it with the car alone left the
    // car as the whole stack: no back chevron, no route to the garage, and
    // the settings button lives on the garage. A subscriber who landed here
    // could rename the car and log a service and never find the rest of the
    // app. Replace with the garage, push the car, and the chevron is back.
    router.replace("/");
    if (vehicle) router.push(`/vehicle/${vehicle.id}` as never);
  }

  // Everything the subscription carries, which since the free tier went away
  // is every row in the list. It used to be the two marked `pro`, because the
  // other five were free and claiming them here would have been claiming the
  // money bought something it did not. Nothing is free now, so the honest
  // panel is the whole list — in the trial screen's short lines rather than
  // the help screen's titles and sentences, because seven of those is a
  // document and this screen is a receipt.
  const unlocked = features();

  return (
    <Screen
      // No native header on this route (`headerShown: false` in _layout), so
      // the housing has to claim the top inset itself. Without it the title
      // was drawn under the status bar and "Pro is on." ran through the clock.
      edges={["top", "bottom"]}
      footer={<Button label={t("subscribed.cta")} onPress={onFirstAction} />}
    >
      <View style={{ gap: tokens.space.lg }}>
        {/* Pushed down from the inset. Every other screen's title sits under a
            44pt native header; this one has none, so with only the housing's
            16pt the hero was pressed against the clock. */}
        <View style={{ gap: tokens.space.sm, paddingTop: tokens.space.xl }}>
          <Text style={{ ...tokens.text.hero, color: tokens.color.text }}>
            {t("subscribed.title")}
          </Text>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("subscribed.body", { vehicle: vehiclePhrase })}
          </Text>
        </View>

        {/* The paywall's own gauges, restated as settled fact. Same numbers,
            same legends, so the screen reads as the thing that was argued for
            rather than as a new claim made after the money changed hands. */}
        <Panel>
          <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Gauge
                legend={t("offer.paywall.scheduled")}
                value={formatNumber(plan.items.length)}
                unit={t("offer.paywall.services", { count: plan.items.length })}
              />
              <Gauge
                legend={t("offer.paywall.nextUp")}
                value={next?.dueAt ? formatDate(next.dueAt) : t("offer.paywall.none")}
                align="right"
              />
            </View>
          </View>
        </Panel>

        {/* What is now on, in the same words and the same order as the list
            the trial screen offered — a tick and at most five words a line. A
            capability described one way before the money and another way after
            it is a promise quietly restated. */}
        <View style={{ gap: tokens.space.sm }}>
          <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
            {t("subscribed.unlocked")}
          </Text>
          <Panel>
            <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
              {unlocked.map((feature) => (
                <View
                  key={feature.id}
                  style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}
                >
                  {/* A tick, not the red lamp that used to mark these rows: the
                      lamp is the car's warning light, and it was the app
                      celebrating in alarm colours. */}
                  <Check />
                  <Text style={{ ...tokens.text.body, color: tokens.color.text, flex: 1 }}>
                    {feature.line}
                  </Text>
                </View>
              ))}
            </View>
          </Panel>
        </View>
      </View>
    </Screen>
  );
}
