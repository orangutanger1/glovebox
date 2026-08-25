import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { createVehicle, getVehicle, updateVehicleIdentity } from "../../src/db/vehicles";
import { getOnboardingVehicleId, setOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { CAR_MAKES, matchingMakes } from "../../src/onboarding/makes";
import { trackQuizAnswer, trackVehicleEntry } from "../../src/analytics";
import { parseNumber, vehicleDisplayName } from "../../src/format";
import { t } from "../../src/i18n";

/** A model year, not a number. 1900 rules out a mistyped odometer reading in
 *  this field; +2 allows next year's cars, which are on sale this year. */
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 2;

/**
 * The model years offered as chips, newest first.
 *
 * Next year's model leads, because cars are sold as next year's model for most
 * of the year, and twenty-six years of chips reach back past the age of the
 * average car on an American road. Anything older is a text field behind one
 * more tap, which is the right trade: it is a handful of users typing four
 * digits instead of every user typing them.
 */
const NEWEST_YEAR = new Date().getFullYear() + 1;
const YEAR_CHIPS = 26;
const OLDEST_YEAR = NEWEST_YEAR - (YEAR_CHIPS - 1);

/** Sentinels, not answers. Neither can collide with a year or a make. */
const OLDER = "older";
const OTHER = "other";

/**
 * The car, in taps.
 *
 * This screen used to be three hard-required free-text fields at the second tap
 * of onboarding, before the app had delivered anything at all, with the
 * keyboard already up on the first of them. It was the most expensive question
 * in the flow and it was asked at the moment the user had least reason to
 * answer it: a year, a make and a model, all typed, all validated, all
 * blocking.
 *
 * The three answers are unchanged, because everything downstream reads them.
 * What changed is what it costs to give them. The year is a scrolling row of
 * model years. The make is forty-two chips over a filter the user never has to
 * touch. The model is still typed, and is now optional: it is the one part the
 * schedule never reads, and `vehicleDisplayName` degrades to "2019 Toyota"
 * without it, which is a car in a garage list rather than a broken row.
 *
 * The escape hatches are the reason nothing was lost. "Older" reveals the year
 * field that used to be mandatory, and "Other" reveals the make field, so a
 * 1973 Datsun is still enterable; it is simply not what the flow is shaped for.
 */
export default function OnboardingVehicle() {
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

  const [year, setYear] = useState(saved?.year ? String(saved.year) : "");
  const [make, setMake] = useState(saved?.make ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  const [query, setQuery] = useState("");
  // Both hatches open themselves for a car that can only have come through
  // them, so stepping back into this screen shows the answer where the user
  // put it rather than an unselected row and an empty field.
  const [olderOpen, setOlderOpen] = useState(
    () => saved?.year !== undefined && saved.year < OLDEST_YEAR
  );
  const [otherOpen, setOtherOpen] = useState(() => {
    const named = saved?.make?.trim();
    return named !== undefined && named !== "" && !CAR_MAKES.includes(named);
  });
  // Errors are held back until the field is left or Continue is pressed:
  // "1" on the way to "1998" is not a mistake and must not be shouted at.
  const [yearTouched, setYearTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const yearOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let y = NEWEST_YEAR; y >= OLDEST_YEAR; y--) out.push({ value: String(y), label: String(y) });
    out.push({ value: OLDER, label: t("onboardingA.vehicle.yearOlder") });
    return out;
  }, []);

  // Filtered at render, from a list of forty-two strings. The filter exists for
  // the user who would rather type three letters than scroll, and it is never
  // the only way to answer: an empty query shows every make.
  const matches = matchingMakes(query);
  const makeOptions = useMemo(
    () => [
      ...matches.map((m) => ({ value: m, label: m })),
      { value: OTHER, label: t("onboardingA.vehicle.makeOther") },
    ],
    [matches]
  );

  const parts = {
    year: parseNumber(year),
    make: make.trim() || undefined,
    model: model.trim() || undefined,
  };

  // Year and make are still required, because a plan for a car the app cannot
  // name is not a plan. Neither of them requires a keyboard any more, which is
  // what the requirement actually cost. The model does not block: it is read by
  // nothing but the name, and the name is fine without it.
  const yearOk = parts.year !== undefined && parts.year >= MIN_YEAR && parts.year <= MAX_YEAR;
  const valid = yearOk && parts.make !== undefined;

  // An out-of-range year used to do nothing at all: Continue stayed disabled
  // and nothing on screen said why, so "09" or "78" read as a dead button.
  // Continue is now always pressable and answers with the reason.
  const yearMessage = (() => {
    if (!year.trim()) return t("onboardingA.vehicle.yearMissing");
    if (parts.year === undefined || !/^\d+$/.test(year.trim())) {
      return t("onboardingA.vehicle.yearDigits");
    }
    // Years are passed as strings: a model year is a label, not a quantity, and
    // `t` groups the numbers it is handed — "1,900" is not a year.
    if (parts.year < MIN_YEAR) {
      return t("onboardingA.vehicle.yearMin", { min: String(MIN_YEAR), value: year.trim() });
    }
    if (parts.year > MAX_YEAR) return t("onboardingA.vehicle.yearMax", { max: String(MAX_YEAR) });
    return "";
  })();
  const showYearError = (yearTouched || submitted) && yearMessage !== "";
  const missingMessage = t("onboardingA.vehicle.required");
  const showMakeError = submitted && parts.make === undefined;

  function onYearChip(value: string) {
    if (value === OLDER) {
      setOlderOpen(true);
      setYear("");
      return;
    }
    // No `yearTouched` here: a chip cannot be invalid, and marking it touched
    // is what made the "Older" field open already shouting about a year the
    // user had not been given a chance to type yet.
    setOlderOpen(false);
    setYear(value);
  }

  function onMakeChip(value: string) {
    if (value === OTHER) {
      setOtherOpen(true);
      setMake("");
      return;
    }
    setOtherOpen(false);
    setMake(value);
  }

  function onContinue() {
    if (!valid) {
      setSubmitted(true);
      if (!yearOk) trackVehicleEntry("year", "invalid");
      if (parts.make === undefined) trackVehicleEntry("make", "invalid");
      return;
    }
    // The one part of the car that is allowed to go unanswered, reported as
    // such: if this is most of the traffic then the question is worth losing,
    // and that is not a decision to make from a hunch.
    if (parts.model === undefined) trackVehicleEntry("model", "skipped");
    // Only the answers that came off a chip are reported by value. A make the
    // user typed is their words about their own car, and a funnel does not need
    // it to answer the question it exists for, which is how many people had to
    // reach for the keyboard at all.
    trackQuizAnswer("vehicle", {
      year: parts.year ?? 0,
      make: otherOpen ? OTHER : (parts.make ?? ""),
      has_model: parts.model !== undefined,
      year_typed: olderOpen,
      make_typed: otherOpen,
    });

    // There is no separate name field any more: the name IS the parts. Asking
    // for both meant the user typed "Civic" twice, and year/make/model were
    // then rendered nowhere. `name` is the only field the garage list and the
    // vehicle header ever show. A nickname is offered later, from the vehicle
    // screen, which is the point at which a second car makes one useful.
    const identity = { name: vehicleDisplayName(parts), ...parts };
    // Stepping back to this screen and forward again must correct the car, not
    // add a second one to the garage, but only the car this run of onboarding
    // created. Reaching for the first vehicle in the garage instead is how
    // "Replay onboarding" came to rename a car the user had owned for a year.
    const ownedId = getOnboardingVehicleId();
    const existing = ownedId ? getVehicle(ownedId) : null;
    if (existing) updateVehicleIdentity(existing.id, identity);
    else setOnboardingVehicleId(createVehicle(identity).id);

    advance();
  }

  return (
    <OnboardingScreen
      route="vehicle"
      title={t("onboardingA.vehicle.title")}
      footer={<Button label={t("onboardingA.continue")} onPress={onContinue} />}
    >
      <ChipRow
        legend={t("onboardingA.vehicle.year")}
        options={yearOptions}
        selected={olderOpen ? [OLDER] : [year]}
        onPress={onYearChip}
        scroll
      />
      {olderOpen ? (
        <Panel>
          <View style={{ padding: tokens.space.md }}>
            <Field
              label={t("onboardingA.vehicle.year")}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              placeholder={t("onboardingA.vehicle.yearPlaceholder")}
              onFocus={() => trackVehicleEntry("year", "focused")}
              onBlur={() => setYearTouched(true)}
              error={showYearError ? yearMessage : undefined}
            />
          </View>
        </Panel>
      ) : showYearError ? (
        <Text style={{ ...tokens.text.caption, color: tokens.color.red }}>{yearMessage}</Text>
      ) : null}

      <ChipRow
        legend={t("onboardingA.vehicle.make")}
        options={makeOptions}
        selected={otherOpen ? [OTHER] : [make]}
        onPress={onMakeChip}
      />
      {matches.length === 0 ? (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {t("onboardingA.vehicle.makeNone")}
        </Text>
      ) : null}
      {showMakeError && !otherOpen ? (
        <Text style={{ ...tokens.text.caption, color: tokens.color.red }}>{missingMessage}</Text>
      ) : null}

      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          {/* The filter is here rather than above the chips because it is the
              slower way to answer: the chips are the control, and a search box
              at the top of a list of them reads as the only way in. */}
          <Field
            label={t("onboardingA.vehicle.makeSearch")}
            value={query}
            onChangeText={setQuery}
            placeholder={t("onboardingA.vehicle.makePlaceholder")}
            onFocus={() => trackVehicleEntry("make", "focused")}
          />
          {otherOpen ? (
            <Field
              label={t("onboardingA.vehicle.make")}
              value={make}
              onChangeText={setMake}
              placeholder={t("onboardingA.vehicle.makePlaceholder")}
              onFocus={() => trackVehicleEntry("make", "focused")}
              error={showMakeError ? missingMessage : undefined}
            />
          ) : null}
          <Field
            label={t("onboardingA.vehicle.modelOptional")}
            value={model}
            onChangeText={setModel}
            placeholder={t("onboardingA.vehicle.modelPlaceholder")}
            onFocus={() => trackVehicleEntry("model", "focused")}
          />
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {valid
          ? t("onboardingA.vehicle.saved", { name: vehicleDisplayName(parts) })
          : t("onboardingA.vehicle.hint")}
      </Text>
    </OnboardingScreen>
  );
}
