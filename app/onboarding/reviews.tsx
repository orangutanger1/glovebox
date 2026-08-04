import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { tokens } from "../../src/design/tokens";
import { EVIDENCE_ANSWERS, REVIEW_EVIDENCE } from "../../src/onboarding/evidence";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The social-proof beat, with no social proof.
 *
 * Glovebox has not shipped, so it has no ratings, no user count and no
 * testimonials, and the version of this screen that invents them is the one
 * thing the product cannot come back from — every other screen in this flow is
 * asking the user to believe a number. What it does have is the reason it was
 * built: 1,715 real reviews of the apps they would otherwise be using, pulled
 * from the App Store and still sitting in the repo.
 *
 * Nothing is quoted. Those reviews were written about somebody else's app, and
 * printing the words would be borrowing the reviewer as much as the evidence.
 * The tallies are the claim, and the label on each one says exactly what it
 * counts: a mention, not a verdict.
 */
export default function OnboardingReviews() {
  const advance = useAdvance("reviews");

  return (
    <OnboardingScreen
      route="reviews"
      title="This app exists because of these."
      subtitle={`${REVIEW_EVIDENCE.total.toLocaleString()} App Store reviews of the ${REVIEW_EVIDENCE.apps} apps that already do this. ${REVIEW_EVIDENCE.negative} of them are one to three stars.`}
      footer={<Button label="Continue" onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          {REVIEW_EVIDENCE.themes.map((theme, i) => (
            <View key={theme.label} style={{ gap: tokens.space.xs }}>
              <Gauge legend="Reviews mentioning" value={String(theme.count)} />
              <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{theme.label}</Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
                {EVIDENCE_ANSWERS[i]}
              </Text>
            </View>
          ))}
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
        Counted from the one-to-three-star reviews in research/reviews.json. A review can mention
        more than one thing. None of them are about Glovebox — it has not shipped yet, so it has no
        ratings to show you and is not going to borrow anyone else&apos;s.
      </Text>
    </OnboardingScreen>
  );
}
