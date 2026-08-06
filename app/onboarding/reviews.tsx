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
 * The social-proof beat, with no social proof.
 *
 * Glovebox has not shipped, so it has no ratings, no user count and no
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
 * Continue is gated on reaching the bottom. This is the only screen in the
 * flow whose whole content is the argument rather than a summary of it, and a
 * user who taps past the fourth tally has been shown evidence they did not
 * read. The button says which of the two states it is in, because a control
 * that is disabled for a reason the user cannot see is a broken control.
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
        apps: REVIEW_EVIDENCE.apps,
      })}
      footer={({ atBottom }) => (
        <Button
          label={t(atBottom ? "onboardingC.reviews.continue" : "onboardingC.reviews.scroll")}
          onPress={advance}
          disabled={!atBottom}
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
