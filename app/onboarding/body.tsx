import { View } from "react-native";
import { Chip } from "../../src/design/Chip";
import { tokens } from "../../src/design/tokens";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { setBodyStyle } from "../../src/db/vehicles";
import { BODY_STYLES, type BodyStyle } from "../../src/vehicles/bodyStyles";
import { trackQuizAnswer } from "../../src/analytics";
import { t } from "../../src/i18n";

/** One tap, no Continue: an answer that is unambiguous the moment it is given
 *  does not need confirming. */
export default function OnboardingBody() {
  const advance = useAdvance("body");

  function choose(style: BodyStyle) {
    // No vehicle means the user deep-linked past the screen that creates one.
    // Advancing without writing is right: nothing downstream needs a body
    // style, and the detail screen can set it later.
    const vehicleId = getOnboardingVehicleId();
    if (vehicleId) setBodyStyle(vehicleId, style);
    trackQuizAnswer("body", { body_style: style });
    advance();
  }

  return (
    <OnboardingScreen route="body" title={t("onboardingA.body.title")}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: tokens.space.sm,
          justifyContent: "center",
        }}
      >
        {BODY_STYLES.map((style) => (
          <Chip
            key={style}
            label={t(`vehicle.body.${style}`)}
            selected={false}
            onPress={() => choose(style)}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
