import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import {
  REVIEW_EVIDENCE,
  evidenceAnswer,
  reviewThemeLabel,
} from "../../src/onboarding/evidence";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * How long Continue insists on the scroll before it stops standing in the way.
 * Short enough to be about the tap rather than about reading time.
 */
const NUDGE_MS = 2000;

/**
 * The social-proof beat, with no social proof.
 *
 * Wrenchy has not shipped, so it has no ratings, no user count and no
 * testimonials, and the version of this screen that invents them is the one
 * thing the product cannot come back from: every other screen in this flow is
 * asking the user to believe a number. What it does have is the reason it was
 * built, which is 1,715 real reviews of the apps they would otherwise be
 * using, pulled from the App Store and still sitting in the repo.
 *
 * Nothing is quoted. Those reviews were written about somebody else's app, and
 * printing the words would be borrowing the reviewer as much as the evidence.
 * The tallies are the claim, and the label on each one says exactly what it
 * counts: a mention, not a verdict.
 *
 * Continue asks for the scroll and then stops insisting. This is the only
 * screen in the flow whose whole content is the argument rather than a summary
 * of it, so the label still says which of the two states it is in and the
 * scroll is still the thing being asked for. What it no longer does is refuse:
 * a disabled button on the one screen whose job is to earn trust taught the
 * most impatient users that the app argues back, and they are the users this
 * screen exists for. The label does not change when the timeout elapses,
 * because nothing about the argument has.
 */
export default function OnboardingReviews() {
  const advance = useAdvance("reviews");

  return (
    <OnboardingScreen
      route="reviews"
      title={t("onboardingC.reviews.title")}
      subtitle={t("onboardingC.reviews.subtitle", {
        count: REVIEW_EVIDENCE.negative,
        total: REVIEW_EVIDENCE.total,
      })}
      gateTimeoutMs={NUDGE_MS}
      footer={({ atBottom, unlocked }) => (
        <Button
          label={t(atBottom ? "onboardingC.reviews.continue" : "onboardingC.reviews.scroll")}
          onPress={advance}
          disabled={!unlocked}
        />
      )}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          {REVIEW_EVIDENCE.themes.map((theme) => (
            <View key={theme.id} style={{ gap: tokens.space.xs }}>
              <Gauge
                legend={t("onboardingC.reviews.mentioning")}
                value={formatNumber(theme.count)}
              />
              <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                {reviewThemeLabel(theme.id)}
              </Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                {evidenceAnswer(theme.id)}
              </Text>
            </View>
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
