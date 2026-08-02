import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Chip } from "../../src/design/Chip";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { getVehicle } from "../../src/db/vehicles";
import { addRecord, listRecords, softDeleteRecord } from "../../src/db/records";
import { setOnboardingStep, getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";

const TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
  "Something else",
];

// Approximate answers are allowed. "Not sure" logs no record — the safe
// direction to be wrong in, since the app then treats the service as due now.
const WHEN: { label: string; daysAgo: number | null }[] = [
  { label: "Just now", daysAgo: 0 },
  { label: "Last month", daysAgo: 30 },
  { label: "3 months ago", daysAgo: 90 },
  { label: "6 months ago", daysAgo: 180 },
  { label: "Not sure", daysAgo: null },
];

export default function OnboardingService() {
  const router = useRouter();
  const [type, setType] = useState<string | null>(null);
  const [when, setWhen] = useState<string | null>(null);

  // Both halves of the answer are required. The chips used to advance the
  // screen on tap, which meant a mis-tap committed a service record and moved
  // the flow on, with no route back to the screen that wrote it.
  const valid = type !== null && when !== null;

  function onContinue() {
    if (!valid) return;
    const daysAgo = WHEN.find((w) => w.label === when)!.daysAgo;
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

    setOnboardingStep("ready");
    router.push("/onboarding/ready");
  }

  return (
    <OnboardingScreen
      step={3}
      title="What did you last get done?"
      subtitle="Close enough is fine — you can correct it later."
      footer={<Button label="Continue" onPress={onContinue} disabled={!valid} />}
    >
      <View style={{ gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>Service</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {TYPES.map((t) => (
            <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </View>

      {/* The "when" half only appears once there is something to date. Both
          question and answer now stay on screen together, so the user can see
          what they picked instead of the title mutating out from under them. */}
      {type ? (
        <View style={{ gap: tokens.space.sm }}>
          <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
            {`When was the ${type === "Something else" ? "service" : type.toLowerCase()}?`}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
            {WHEN.map((w) => (
              <Chip
                key={w.label}
                label={w.label}
                selected={when === w.label}
                onPress={() => setWhen(w.label)}
              />
            ))}
          </View>
        </View>
      ) : (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          Pick one. You can log the rest anytime.
        </Text>
      )}
    </OnboardingScreen>
  );
}
