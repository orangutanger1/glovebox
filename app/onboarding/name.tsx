import { useState } from "react";
import { View } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { getOnboardingName, setOnboardingName } from "../../src/onboarding";
import { NAME_MAX_LENGTH, normalizeName } from "../../src/onboarding/state";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackStepBlocked } from "../../src/analytics";

/**
 * The introduction.
 *
 * One field, before a single question about the car. It is the only thing the
 * app ever learns about the person rather than the vehicle, and it is asked
 * here because that is where an introduction belongs: after six questions it
 * reads as a form field somebody forgot, and after the results it reads as a
 * condition on seeing them.
 *
 * It is required, which is a decision worth stating plainly rather than
 * hiding. Every other screen in the flow refuses to be skipped for the same
 * reason — a user who arrives in the app with a "My car" stub and no mileage
 * has a garage entry nothing in the app can act on — and a name that half the
 * installs do not have means two versions of every sentence that uses one,
 * maintained forever, in eleven languages. The field is prefilled on a replay,
 * so the one user who has already answered is not asked twice.
 *
 * Where it is read back: both screens that ask for money, and every reminder
 * the app sends. Nowhere else. A name sprinkled through the interface is a
 * mail merge; a name on the notification that wakes somebody up on a Tuesday
 * is the difference between a message and a database row.
 */
export default function OnboardingName() {
  const advance = useAdvance("name");
  // Prefilled rather than blank. `resetOnboarding` deliberately keeps the name
  // — the replay re-asks about the car, not about who the driver is — so a user
  // walking the flow a second time sees their own answer and taps Continue.
  const [value, setValue] = useState(() => getOnboardingName() ?? "");

  const name = normalizeName(value);

  function onContinue() {
    if (!name) return;
    setOnboardingName(name);
    advance();
  }

  return (
    <OnboardingScreen
      route="name"
      title={t("onboardingA.name.title")}
      footer={
        <Button
          label={t("onboardingA.name.continue")}
          onPress={onContinue}
          // Disabled rather than validating on tap. There is exactly one field
          // and one rule; a button that waits until it is pressed to say the
          // field is empty is telling the user something they can already see.
          disabled={name === null}
          // A tap on the greyed button, which is the only trace a user who
          // cannot get past this screen leaves. Without it the funnel sees a
          // view and then silence here — the same rows as a user who never
          // looked at the screen at all.
          onBlockedPress={() => trackStepBlocked("name", value.trim() === "" ? "empty" : "invalid")}
        />
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md }}>
          <Field
            label={t("onboardingA.name.label")}
            value={value}
            onChangeText={(next) => setValue(next.slice(0, NAME_MAX_LENGTH))}
            autoFocus
            // A given name is a proper noun, and iOS lower-casing it or
            // autocorrecting it to a dictionary word writes the wrong person
            // into every notification the app will ever send.
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
