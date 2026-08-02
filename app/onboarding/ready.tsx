import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { ListRow } from "../../src/design/ListRow";
import { tokens } from "../../src/design/tokens";
import { listVehicles } from "../../src/db/vehicles";
import { listRecords } from "../../src/db/records";
import { nextDue, DEFAULT_INTERVALS } from "../../src/schedule";
import { setOnboardingStep } from "../../src/onboarding";
import { maybeRequestReview } from "../../src/review";
import { OnboardingScreen } from "../../src/onboarding/Screen";

const HEADLINE_TYPES = ["Oil Change", "Tire Rotation", "Brake Inspection"];

export default function OnboardingReady() {
  const router = useRouter();
  // Every path into this screen creates a vehicle first, including Skip — but
  // a resumed onboarding step is persisted state, and reading `[0].id` off an
  // empty list is a crash on the one screen whose whole job is reassurance.
  const vehicle = listVehicles()[0] ?? null;
  const records = vehicle ? listRecords(vehicle.id) : [];

  // The one moment in the flow worth spending the ask on: the user has entered
  // a vehicle, an odometer reading and a real service, and this screen has just
  // handed them back a due date they did not have to work out. It fires here
  // rather than on Continue so the prompt lands over the payoff instead of
  // stacking on top of the notification ask and the paywall two taps later.
  //
  // The delay is for the push transition. A StoreKit modal requested mid-
  // animation is a modal presented onto a view controller that is still moving,
  // which iOS drops on the floor.
  useEffect(() => {
    const t = setTimeout(() => {
      void maybeRequestReview({ recordCount: records.length });
    }, 900);
    return () => clearTimeout(t);
  }, [records.length]);

  function onContinue() {
    setOnboardingStep("reminders");
    router.push("/onboarding/reminders");
  }

  const lines = HEADLINE_TYPES.map((type) => {
    const record = records.find((r) => r.service_type === type);
    if (!record) return { type, line: "not logged yet" };
    const due = nextDue({
      lastPerformedAt: record.performed_at,
      lastOdometer: record.odometer,
      interval: DEFAULT_INTERVALS[type],
    });
    const parts: string[] = [];
    if (due.dueAt) parts.push(new Date(due.dueAt).toLocaleDateString());
    if (due.dueOdometer) parts.push(`${due.dueOdometer.toLocaleString()} mi`);
    return { type, line: parts.join(" · ") || "not logged yet" };
  });

  return (
    <OnboardingScreen
      step={4}
      title="Done. Here is what Glovebox knows."
      footer={<Button label="Continue" onPress={onContinue} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge legend="Vehicle" value={vehicle?.name ?? "My car"} />
            <Gauge
              legend="Odometer"
              value={vehicle?.odometer ? vehicle.odometer.toLocaleString() : "—"}
              unit={vehicle?.odometer ? "mi" : undefined}
              align="right"
            />
          </View>
          <View style={{ gap: tokens.space.xs }}>
            {lines.map((l) => (
              <ListRow key={l.type} title={l.type} subtitle={l.line} status="ok" />
            ))}
          </View>
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        Whichever comes first, date or mileage.
      </Text>
    </OnboardingScreen>
  );
}
