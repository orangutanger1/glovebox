import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle } from "../../src/db/vehicles";
import { addRecord, listRecords, softDeleteRecord } from "../../src/db/records";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

const TYPES = [
  { value: "Oil Change", label: "Oil Change" },
  { value: "Tire Rotation", label: "Tire Rotation" },
  { value: "Brake Inspection", label: "Brake Inspection" },
  { value: "Air Filter", label: "Air Filter" },
  { value: "Inspection", label: "Inspection" },
  { value: "Something else", label: "Something else" },
] as const;

type ServiceChoice = (typeof TYPES)[number]["value"];

// Approximate answers are allowed. "Not sure" logs no record — the safe
// direction to be wrong in, since the app then treats the service as due now.
const WHEN = [
  { value: "Just now", label: "Just now", daysAgo: 0 },
  { value: "Last month", label: "Last month", daysAgo: 30 },
  { value: "3 months ago", label: "3 months ago", daysAgo: 90 },
  { value: "6 months ago", label: "6 months ago", daysAgo: 180 },
  { value: "Not sure", label: "Not sure", daysAgo: null },
] as const;

type WhenChoice = (typeof WHEN)[number]["value"];

export default function OnboardingService() {
  const advance = useAdvance("service");
  const [type, setType] = useState<ServiceChoice | null>(null);
  const [when, setWhen] = useState<WhenChoice | null>(null);

  // Both halves of the answer are required. The chips used to advance the
  // screen on tap, which meant a mis-tap committed a service record and moved
  // the flow on, with no route back to the screen that wrote it.
  const valid = type !== null && when !== null;

  function onContinue() {
    if (!valid) return;
    const daysAgo = WHEN.find((w) => w.value === when)!.daysAgo;
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;

    if (vehicle && daysAgo !== null) {
      const serviceType = type === "Something else" ? "Other" : type;
      // Stepping back into this screen and answering again must correct the
      // record, not stack a second one on the same service. Scoped to the car
      // this run created: against the first vehicle in the garage, a replay
      // tombstoned a real oil-change history the user could not get back from
      // inside the app.
      for (const r of listRecords(vehicle.id)) {
        if (r.service_type === serviceType) softDeleteRecord(r.id);
      }
      const performed = new Date();
      performed.setDate(performed.getDate() - daysAgo);
      addRecord({
        vehicle_id: vehicle.id,
        service_type: serviceType,
        performed_at: performed.toISOString(),
        odometer: vehicle.odometer,
      });
    }

    advance();
  }

  return (
    <OnboardingScreen
      route="service"
      title="What did you last get done?"
      subtitle="Close enough is fine — you can correct it later."
      footer={<Button label="Continue" onPress={onContinue} disabled={!valid} />}
    >
      <ChipRow legend="Service" options={TYPES} selected={type ? [type] : []} onPress={setType} />

      {/* The "when" half only appears once there is something to date. Both
          question and answer now stay on screen together, so the user can see
          what they picked instead of the title mutating out from under them. */}
      {type ? (
        <ChipRow
          legend={`When was the ${type === "Something else" ? "service" : type.toLowerCase()}?`}
          options={WHEN}
          selected={when ? [when] : []}
          onPress={setWhen}
        />
      ) : (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          Pick one. You can log the rest anytime.
        </Text>
      )}
    </OnboardingScreen>
  );
}
