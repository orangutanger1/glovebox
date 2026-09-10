import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { DotGrid } from "../../src/design/DotGrid";
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
 * outside number on it. Every mark is counted from this user's own car — the
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
 * It was four bars in two pairs, and the bars were the wrong instrument. A bar
 * is for a magnitude nobody can count; twelve services is a magnitude anybody
 * can count, and a bar filled a quarter of the way has to be converted back
 * into "three of twelve" by the reader — which is why the number had to be
 * printed beside it. The services are drawn as the services now: twelve
 * sockets, and a stud seated in every one the user could date. The dark ones
 * are the picture. They are what the app is for, and a bar cannot show an
 * absence, only a shortfall.
 *
 * The two claims are still two claims and are still drawn differently. Coverage
 * is the grid, because it is a count of things. The load that coverage takes
 * off the driver is two figures — twelve against zero — because that pair is
 * strongest as numerals and drawing an empty grid twice would be the same
 * picture making a second, weaker point.
 *
 * The right column waits for the left to finish seating. The claim is a before
 * and an after, and two grids filling at once is one picture rather than a
 * change from one state to another.
 */
export default function OnboardingCompare() {
  const advance = useAdvance("compare");
  const { vehiclePhrase, plan } = useOnboardingFindings();

  const total = plan.items.length;
  const logged = plan.logged;
  /** Where the second grid starts: after the first has seated its last stud.
   *  `DotGrid` steps 40ms a dot, so this tracks whatever it is showing. */
  const afterFirst = logged * 40 + 240;

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
          <Group heading={t("onboardingC.compare.dated")}>
            <Column
              legend={t("onboardingC.compare.alone")}
              value={t("onboardingC.compare.ofTotal", {
                count: formatNumber(logged),
                total: formatNumber(total),
              })}
            >
              {/* Green for the ones that are dated, whichever side they are on:
                  the tone is what the mark means, not which column it is in.
                  The nine empty sockets beside them are the argument. */}
              <DotGrid total={total} filled={logged} tone="green" />
            </Column>
            <Column
              legend={t("onboardingC.compare.withApp")}
              value={t("onboardingC.compare.ofTotal", {
                count: formatNumber(total),
                total: formatNumber(total),
              })}
            >
              <DotGrid total={total} filled={total} tone="green" delay={afterFirst} />
            </Column>
          </Group>

          <View style={{ borderTopWidth: 1, borderTopColor: tokens.color.hairline }} />

          <Group heading={t("onboardingC.compare.remembered")}>
            <Column legend={t("onboardingC.compare.alone")}>
              {/* The one red figure on the screen, and the only thing on it the
                  app calls a fault: a service nobody has written down is a
                  service somebody is holding in their head. */}
              <Figure value={formatNumber(total)} tone="red" />
            </Column>
            <Column legend={t("onboardingC.compare.withApp")}>
              <Figure value={formatNumber(0)} tone="green" />
            </Column>
          </Group>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}

/** A claim, and the two sides of it. The heading is body text, not a legend:
 *  the legends belong to the columns, and a third size of uppercase in one
 *  panel is a panel with no hierarchy left. */
function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: tokens.space.md }}>
      <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{heading}</Text>
      <View style={{ flexDirection: "row", gap: tokens.space.md }}>{children}</View>
    </View>
  );
}

/** One side of a claim: what it is, the picture, and the figure under it. */
function Column({
  legend,
  value,
  children,
}: {
  legend: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, gap: tokens.space.sm }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>{legend}</Text>
      {children}
      {value ? (
        <Text
          style={{ ...tokens.text.legend, ...tokens.text.numeric, color: tokens.color.text }}
        >
          {value}
        </Text>
      ) : null}
    </View>
  );
}

/** A count with nothing to draw. Twelve against zero is a comparison that gets
 *  weaker the more it is illustrated. */
function Figure({ value, tone }: { value: string; tone: "red" | "green" }) {
  return (
    <Text
      style={{
        ...tokens.text.readout,
        ...tokens.text.numeric,
        fontSize: 34,
        lineHeight: 38,
        color: tone === "red" ? tokens.color.red : tokens.color.green,
      }}
    >
      {value}
    </Text>
  );
}
