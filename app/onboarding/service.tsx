import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle } from "../../src/db/vehicles";
import { addRecord, listRecords, softDeleteRecord } from "../../src/db/records";
import { t } from "../../src/i18n";
import { serviceName } from "../../src/schedule/names";
import { getDistanceUnit } from "../../src/units";
import { getAnswers, getOnboardingVehicleId, setAnswers } from "../../src/onboarding";
import { distancePerYearFor, odometerDaysAgo } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import {
  SERVICE_TYPES,
  SERVICE_WHEN,
  type ServiceTypeAnswer,
  type ServiceWhenAnswer,
} from "../../src/onboarding/state";

// Approximate answers are allowed. "Not sure" logs no record, which is the
// safe direction to be wrong in, since the app then treats the service as due
// now.
const DAYS_AGO: Record<ServiceWhenAnswer, number | null> = {
  "Just now": 0,
  "Last month": 30,
  "3 months ago": 90,
  "6 months ago": 180,
  "Not sure": null,
};

const WHEN_KEYS: Record<ServiceWhenAnswer, string> = {
  "Just now": "onboardingB.service.ago.now",
  "Last month": "onboardingB.service.ago.lastMonth",
  "3 months ago": "onboardingB.service.ago.months3",
  "6 months ago": "onboardingB.service.ago.months6",
  "Not sure": "onboardingB.service.ago.notSure",
};

/** "Something else" is a chip, not a service. It lands in the same catch-all
 *  bucket the log form uses, and the plan leaves that bucket out of the list. */
function recordType(answer: ServiceTypeAnswer): string {
  return answer === "Something else" ? "Other" : answer;
}

export default function OnboardingService() {
  const advance = useAdvance("service");
  const saved = useMemo(getAnswers, []);
  const [type, setType] = useState<ServiceTypeAnswer | null>(saved.service ?? null);
  const [when, setWhen] = useState<ServiceWhenAnswer | null>(saved.serviceWhen ?? null);

  // Both halves of the answer are required. The chips used to advance the
  // screen on tap, which meant a mis-tap committed a service record and moved
  // the flow on, with no route back to the screen that wrote it.
  const valid = type !== null && when !== null;

  // Built at render rather than at import: both label sets are copy, and a
  // module-level const would freeze whichever language was active when this
  // file was first pulled in.
  const types = useMemo(
    () =>
      SERVICE_TYPES.map((value) => ({
        value,
        label:
          value === "Something else"
            ? t("onboardingB.service.somethingElse")
            : serviceName(value),
      })),
    []
  );
  const whens = useMemo(
    () => SERVICE_WHEN.map((value) => ({ value, label: t(WHEN_KEYS[value]) })),
    []
  );

  function onContinue() {
    if (!valid) return;
    const daysAgo = DAYS_AGO[when];
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;

    if (vehicle) {
      // Stepping back into this screen and answering again must correct the
      // record rather than stack a second one, and that includes changing
      // which service it was: the row this run wrote last time is cleared
      // whatever type it carried, and so is any row of the type now chosen.
      // Clearing runs even for "Not sure", which writes nothing, or a user who
      // downgraded their answer kept a date they had just taken back.
      const chosen = recordType(type);
      const answeredBefore = saved.service ? recordType(saved.service) : null;
      for (const r of listRecords(vehicle.id)) {
        if (r.service_type === chosen || r.service_type === answeredBefore) softDeleteRecord(r.id);
      }

      if (daysAgo !== null) {
        // Noon local, the same as every other date this app stores: midnight
        // local serialises to the previous calendar day in UTC, and the
        // history list reads the date straight off that string.
        const performed = new Date();
        performed.setDate(performed.getDate() - daysAgo);
        performed.setHours(12, 0, 0, 0);
        addRecord({
          vehicle_id: vehicle.id,
          service_type: chosen,
          performed_at: performed.toISOString(),
          // Counted back from today's reading at the rate the previous
          // question established. Filing a six-month-old oil change at today's
          // mileage claims the car has not moved since, and pushed the next
          // mileage-due point a whole interval into the future.
          odometer:
            vehicle.odometer === undefined
              ? undefined
              : odometerDaysAgo(
                  vehicle.odometer,
                  distancePerYearFor(saved, getDistanceUnit()),
                  daysAgo
                ),
        });
      }
    }

    setAnswers({ service: type, serviceWhen: when });
    advance();
  }

  return (
    <OnboardingScreen
      route="service"
      title={t("onboardingB.service.title")}
      subtitle={t("onboardingB.service.subtitle")}
      footer={<Button label={t("onboardingB.continue")} onPress={onContinue} disabled={!valid} />}
    >
      <ChipRow
        legend={t("onboardingB.service.legend")}
        options={types}
        selected={type ? [type] : []}
        onPress={setType}
      />

      {/* The "when" half only appears once there is something to date. Both
          question and answer now stay on screen together, so the user can see
          what they picked instead of the title mutating out from under them. */}
      {type ? (
        <ChipRow
          legend={
            type === "Something else"
              ? t("onboardingB.service.whenOther")
              : t("onboardingB.service.when", { service: serviceName(type) })
          }
          options={whens}
          selected={when ? [when] : []}
          onPress={setWhen}
        />
      ) : (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {t("onboardingB.service.caption")}
        </Text>
      )}
    </OnboardingScreen>
  );
}
