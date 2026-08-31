import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/design/Button";
import { Panel } from "../src/design/Surface";
import { Gauge } from "../src/design/Gauge";
import { Lamp } from "../src/design/Lamp";
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
  const { vehicle, vehicleName, plan } = useOnboardingFindings();
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
    // Replace, not push: this screen is the end of onboarding and must not sit
    // behind the car for a back-swipe to walk into.
    if (vehicle) router.replace(`/vehicle/${vehicle.id}` as never);
    else router.replace("/");
  }

  // The two rows that are actually behind the entitlement, read from the same
  // list the help screen prints so a capability cannot be described one way
  // before the money and another way after it. Two, not four: `features()`
  // marks exactly `garage` and `intervals` as `pro`, and padding this panel
  // with free capabilities would make the screen claim the subscription
  // bought something it did not.
  const unlocked = features().filter((f) => f.pro);

  return (
    <Screen
      // No native header on this route (`headerShown: false` in _layout), so
      // the housing has to claim the top inset itself. Without it the title
      // was drawn under the status bar and "Pro is on." ran through the clock.
      edges={["top", "bottom"]}
      footer={<Button label={t("subscribed.cta")} onPress={onFirstAction} />}
    >
      <View style={{ gap: tokens.space.lg }}>
        <View style={{ gap: tokens.space.sm }}>
          <Text style={{ ...tokens.text.hero, color: tokens.color.text }}>
            {t("subscribed.title")}
          </Text>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("subscribed.body", { vehicle: vehicleName })}
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

        {/* The rows that were behind the badge on the help screen, now without
            it. Reusing that copy rather than writing new lines is the point: a
            capability described one way before the paywall and another way
            after it is a promise quietly restated.
            
            Each row now carries its subtitle as well as its title. Two bare
            lines left most of a phone's height empty under them, which read as
            a screen that had failed to load rather than as a short list; the
            subtitles are the same sentences the help screen already showed, so
            nothing new is claimed and the panel has a body. */}
        <View style={{ gap: tokens.space.sm }}>
          <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
            {t("subscribed.unlocked")}
          </Text>
          <Panel>
            <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
              {unlocked.map((feature) => (
                <View
                  key={feature.id}
                  style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm }}
                >
                  {/* Nudged down to sit on the title's optical centre rather
                      than the row's, now that the row is two lines tall. */}
                  <View style={{ paddingTop: tokens.space.xs }}>
                    <Lamp lit size={10} />
                  </View>
                  <View style={{ flex: 1, gap: tokens.space.xs }}>
                    <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                      {feature.title}
                    </Text>
                    <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                      {feature.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Panel>
        </View>
      </View>
    </Screen>
  );
}
