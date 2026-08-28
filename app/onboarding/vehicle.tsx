import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Wheel } from "../../src/design/Wheel";
import { useTheme } from "../../src/design/theme";
import { tokens } from "../../src/design/tokens";
import {
  createVehicle,
  getVehicle,
  listVehicles,
  updateVehicleIdentity,
} from "../../src/db/vehicles";
import { getOnboardingVehicleId, setOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer, trackVehicleEntry } from "../../src/analytics";
import { vehicleDisplayName } from "../../src/format";
import { t } from "../../src/i18n";

/**
 * The oldest model year the drum reaches. A car older than this is a
 * restoration project rather than a daily driver, and the drum is a scroll
 * rather than a wall: it costs a longer flick, not a dead end.
 */
const OLDEST_YEAR = 1950;
/** Next year's model leads, because cars are sold as next year's model for
 *  most of the year. */
const NEWEST_YEAR = new Date().getFullYear() + 1;
/** Where the drum opens. The average car on the road is about twelve years
 *  old, so the median answer is a short flick in either direction. */
const DEFAULT_YEAR = NEWEST_YEAR - 12;

/**
 * The car.
 *
 * The chip version of this screen printed twenty-six year chips over
 * forty-two make chips over a filter box, which is three controls and about
 * seventy tap targets for two answers: the screen the user meets first was the
 * busiest one in the app. It is back to the two text fields it was, with one
 * change — the year, the one answer with an order and a known range, is a
 * drum. Nothing about a model year needs a keyboard, and a wheel cannot be
 * out of range, so the four validation messages that field used to print have
 * nothing left to say. The caption under it is gone too: the question is
 * "What are you driving?", and a screen that has to explain that is not one
 * the copy can fix.
 *
 * The make is typed, because there is no short list of makes that is not also
 * wrong for somebody — and typed means skippable, because this screen is the
 * first thing a new install touches and a keyboard is the worst thing to meet
 * there. Neither text field gates Continue: the year drum always has an
 * answer, so the screen always has enough to build a schedule from, and a car
 * with no make is named by `system.vehicle.fallback` until the owner renames
 * it. The model is optional for the older reason: the schedule never reads it,
 * and `vehicleDisplayName` degrades to "2019 Toyota" without it.
 */
export default function OnboardingVehicle() {
  const c = useTheme();

  const advance = useAdvance("vehicle");

  /**
   * The car this run of onboarding has already written, if the user is here a
   * second time.
   *
   * Going back is a real move in this flow, and Continue pushes a fresh copy
   * of the next screen rather than waking the old one, so nothing typed here
   * survived in component state. The answer does survive in the database,
   * which is the only copy that matters, so the fields are filled from it.
   */
  const saved = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return ownedId ? getVehicle(ownedId) : null;
  }, []);

  const years = useMemo(
    () => Array.from({ length: NEWEST_YEAR - OLDEST_YEAR + 1 }, (_, i) => NEWEST_YEAR - i),
    []
  );
  const [year, setYear] = useState(() => {
    const stored = saved?.year;
    return stored !== undefined && stored >= OLDEST_YEAR && stored <= NEWEST_YEAR
      ? stored
      : DEFAULT_YEAR;
  });
  const [make, setMake] = useState(saved?.make ?? "");
  const [model, setModel] = useState(saved?.model ?? "");

  const parts = { year, make: make.trim() || undefined, model: model.trim() || undefined };

  /**
   * Nothing on this screen is required any more, and the funnel is why.
   *
   * The make used to be the one mandatory answer: "a plan for a car the app
   * cannot name is not a plan". That reasoning was about the plan and never
   * checked against the people. Three of the first eight installs died on this
   * screen, and all three left the receipt behind — `vehicle_entry` rows with
   * `event: "invalid"`, which is a Continue tap this screen refused. One of
   * them tapped Continue four times inside a single second and never opened
   * the app again; another spent three and a half minutes here across four
   * mounts and never reached question two. This is the first interactive
   * screen in the product, and it was spending half the install base to avoid
   * an unnamed row in a garage list.
   *
   * The plan does not actually need the make. Every interval is driven by the
   * year, the odometer and the drive rate; the make is a label. So it is a
   * label that can be missing, and `system.vehicle.fallback` is the label
   * already written in every locale for exactly this case.
   */
  function onContinue() {
    // Both optional parts are reported the same way, so the funnel can price
    // each question separately: if the make is mostly skipped it should stop
    // being asked here at all, and that is a decision for the data.
    if (parts.make === undefined) trackVehicleEntry("make", "skipped");
    if (parts.model === undefined) trackVehicleEntry("model", "skipped");
    // The make is the user's words about their own car, so it is not reported
    // by value. The funnel needs the shape of the answer, not the answer.
    trackQuizAnswer("vehicle", {
      year: parts.year,
      has_make: parts.make !== undefined,
      has_model: parts.model !== undefined,
    });

    // There is no separate name field any more: the name IS the parts. Asking
    // for both meant the user typed "Civic" twice, and year/make/model were
    // then rendered nowhere. `name` is the only field the garage list and the
    // vehicle header ever show. A nickname is offered later, from the vehicle
    // screen, which is the point at which a second car makes one useful.
    //
    // Without a make the parts would name the car "2019", which is a model
    // year standing where a car should be. `vehicleDisplayName` is left alone
    // — it is shared with the garage and the vehicle header, and its rule that
    // parts make a name is still right — and the fallback is chosen here, at
    // the one place that knows the make was skipped rather than lost.
    const identity = {
      name: parts.make === undefined ? t("system.vehicle.fallback") : vehicleDisplayName(parts),
      ...parts,
    };
    // Stepping back to this screen and forward again must correct the car, not
    // add a second one to the garage, but only the car this run of onboarding
    // created. Reaching for the first vehicle in the garage instead is how
    // "Replay onboarding" came to rename a car the user had owned for a year.
    const ownedId = getOnboardingVehicleId();
    const existing = ownedId ? getVehicle(ownedId) : null;
    if (existing) {
      updateVehicleIdentity(existing.id, identity);
      advance();
      return;
    }

    // A replay that this run does not own a car for. Onboarding used to write
    // a new row here unconditionally, which made walking the flow again the
    // one way to put a second, third and fourth car in a free garage: the
    // gate on the garage's own Add button was the only thing enforcing the
    // one-car limit, and this path went around it. The free garage holds one
    // car, so a free user replaying the flow re-describes the car they have.
    const garage = listVehicles();
    const target = garage.length > 0 ? garage[garage.length - 1] : null;
    if (target) {
      updateVehicleIdentity(target.id, identity);
      setOnboardingVehicleId(target.id);
    } else {
      setOnboardingVehicleId(createVehicle(identity).id);
    }

    advance();
  }

  return (
    <OnboardingScreen
      route="vehicle"
      title={t("onboardingA.vehicle.title")}
      footer={<Button label={t("onboardingA.continue")} onPress={onContinue} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <Text style={{ ...tokens.text.legend, color: c.inkMuted }}>
            {t("onboardingA.vehicle.year")}
          </Text>
          <Wheel
            values={years}
            labels={years.map(String)}
            value={year}
            onChange={setYear}
            width={160}
          />
          <View style={{ flexDirection: "row", gap: tokens.space.md }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("onboardingA.vehicle.makeOptional")}
                value={make}
                onChangeText={setMake}
                placeholder={t("onboardingA.vehicle.makePlaceholder")}
                onFocus={() => trackVehicleEntry("make", "focused")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("onboardingA.vehicle.modelOptional")}
                value={model}
                onChangeText={setModel}
                placeholder={t("onboardingA.vehicle.modelPlaceholder")}
                onFocus={() => trackVehicleEntry("model", "focused")}
              />
            </View>
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
