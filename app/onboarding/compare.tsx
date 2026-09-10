import { useMemo } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Bars, type Bar } from "../../src/design/Bars";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The same car, kept two ways.
 *
 * The screen before this one prices the problem out of AAA's published figures.
 * This is its counterpart and it is the opposite kind of screen: not one
 * outside number on it. Every bar is counted from this user's own car — the
 * twelve services the app tracks, and how many of them they were able to put a
 * date on when asked four screens ago.
 *
 * That is what makes the comparison sayable at all. "You will save $400 a year"
 * is the sentence this screen is structurally asking for, and the app cannot
 * write it: there is no published figure for what a maintenance log saves, so
 * any number in that sentence would be invented, on the one screen whose job is
 * to be believed. What the app can state, and state exactly, is the gap it
 * actually closes — how much of the car is written down somewhere that can warn
 * you, before and after.
 *
 * Two pairs, because the two halves of the claim are different claims. The
 * first is coverage: services with a date on them. The second is the load that
 * coverage takes off the driver: services nobody has to hold in their head.
 * The second pair inverts — the good bar is the short one — which is the whole
 * reason it is drawn rather than written.
 */
export default function OnboardingCompare() {
  const advance = useAdvance("compare");
  const { vehiclePhrase, plan } = useOnboardingFindings();

  const total = plan.items.length;
  const logged = plan.logged;

  // Both pairs share one scale — the count of tracked services — so the four
  // bars can be read against each other rather than each against itself.
  const dated = useMemo<Bar[]>(
    () => [
      {
        key: "dated-alone",
        label: t("onboardingC.compare.alone"),
        value: t("onboardingC.compare.ofTotal", {
          count: formatNumber(logged),
          total: formatNumber(total),
        }),
        fraction: total === 0 ? 0 : logged / total,
        tone: "red",
      },
      {
        key: "dated-app",
        label: t("onboardingC.compare.withApp"),
        value: t("onboardingC.compare.ofTotal", {
          count: formatNumber(total),
          total: formatNumber(total),
        }),
        fraction: 1,
        tone: "green",
      },
    ],
    [logged, total]
  );

  const remembered = useMemo<Bar[]>(
    () => [
      {
        key: "remember-alone",
        label: t("onboardingC.compare.alone"),
        value: formatNumber(total),
        fraction: 1,
        tone: "red",
      },
      {
        // Zero, and drawn as an empty track rather than rounded up to a sliver.
        // It is the only bar in the app that means something by being absent.
        key: "remember-app",
        label: t("onboardingC.compare.withApp"),
        value: formatNumber(0),
        fraction: 0,
        tone: "green",
      },
    ],
    [total]
  );

  return (
    <OnboardingScreen
      route="compare"
      title={t("onboardingC.compare.title")}
      subtitle={t("onboardingC.compare.subtitle", { vehicle: vehiclePhrase })}
      footer={
        <>
          {/* The counterpart of the source line on the cost screen, and it says
              the opposite thing: there is nothing to cite here, because there
              is nothing on the glass that did not come from this phone. */}
          <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>
            {t("onboardingC.compare.source")}
          </Text>
          <Button label={t("onboardingC.compare.continue")} onPress={advance} />
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          <Group heading={t("onboardingC.compare.dated")} bars={dated} />
          <View style={{ borderTopWidth: 1, borderTopColor: tokens.color.hairline }} />
          <Group heading={t("onboardingC.compare.remembered")} bars={remembered} />
        </View>
      </Panel>
    </OnboardingScreen>
  );
}

/** A pair under the question it answers. The heading is body text, not a
 *  legend: the legends belong to the bars, and a third size of uppercase in
 *  one panel is a panel with no hierarchy left. */
function Group({ heading, bars }: { heading: string; bars: Bar[] }) {
  return (
    <View style={{ gap: tokens.space.md }}>
      <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{heading}</Text>
      <Bars bars={bars} />
    </View>
  );
}
