import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Button } from "../src/design/Button";
import { ChipRow } from "../src/design/ChipRow";
import { Screen } from "../src/design/Screen";
import { tokens } from "../src/design/tokens";
import { addRecord } from "../src/db/records";
import { rescheduleAll } from "../src/notify";
import { useOnboardingFindings } from "../src/onboarding/usePlan";
import { distancePerYearFor, odometerDaysAgo } from "../src/onboarding/plan";
import {
  CATCHUP_DAYS_AGO,
  CATCHUP_WHEN,
  catchupServices,
  type CatchupWhen,
} from "../src/onboarding/catchup";
import { serviceName } from "../src/schedule/names";
import { getDistanceUnit } from "../src/units";
import { track } from "../src/analytics";
import { t } from "../src/i18n";

const WHEN_KEYS: Record<CatchupWhen, string> = {
  "Last month": "onboardingB.service.ago.lastMonth",
  "3 months ago": "onboardingB.service.ago.months3",
  "6 months ago": "onboardingB.service.ago.months6",
  "Over a year ago": "subscribed.catchup.overYear",
  "Not sure": "onboardingB.service.ago.notSure",
};

/**
 * Right after the receipt: when was each of the common services last done?
 *
 * The schedule a new subscriber opens otherwise has one dated row — the
 * service onboarding asked about — and the rest read "No record", counted as
 * due. On 2026-09-24 the buyers from the week before had almost all opened
 * their car once and never come back; a schedule of "due" rows with no dates
 * is not a reason to. A rough answer per service turns each row into a date.
 *
 * Optional and one screen. Every row may be left alone, "Skip" leaves them
 * all, and nothing is filed for "Not sure". Answers are filed as records at
 * the stated age, with the odometer counted back at the stated rate — the
 * same filing the onboarding question does.
 *
 * Reached from the subscribed screen only when there is something to ask;
 * both ways out land on the car with the garage under it, as that screen did.
 */
export default function Catchup() {
  const router = useRouter();
  const { vehicle, plan, answers } = useOnboardingFindings();
  const services = useMemo(() => catchupServices(plan), [plan]);
  const [chosen, setChosen] = useState<Record<string, CatchupWhen>>({});
  const [saving, setSaving] = useState(false);

  const whens = useMemo(
    () => CATCHUP_WHEN.map((value) => ({ value, label: t(WHEN_KEYS[value]) })),
    []
  );

  function toCar() {
    router.replace("/");
    if (vehicle) router.push(`/vehicle/${vehicle.id}` as never);
  }

  function onSave() {
    if (saving) return;
    setSaving(true);
    let filed = 0;
    if (vehicle) {
      const perYear = distancePerYearFor(answers, getDistanceUnit());
      for (const type of services) {
        const when = chosen[type];
        const daysAgo = when ? CATCHUP_DAYS_AGO[when] : null;
        if (daysAgo === null) continue;
        const performed = new Date();
        performed.setDate(performed.getDate() - daysAgo);
        performed.setHours(12, 0, 0, 0);
        try {
          addRecord({
            vehicle_id: vehicle.id,
            service_type: type,
            performed_at: performed.toISOString(),
            odometer:
              vehicle.odometer === undefined
                ? undefined
                : odometerDaysAgo(vehicle.odometer, perYear, daysAgo),
          });
          filed += 1;
        } catch {
          // One row that would not save is not worth stopping the rest.
        }
      }
    }
    track("history_catchup", {
      outcome: "saved",
      asked: services.length,
      answered: Object.keys(chosen).length,
      filed,
    });
    if (filed > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      rescheduleAll().catch(() => {});
    }
    toCar();
  }

  function onSkip() {
    track("history_catchup", {
      outcome: "skipped",
      asked: services.length,
      answered: Object.keys(chosen).length,
      filed: 0,
    });
    toCar();
  }

  return (
    <Screen
      // No native header, as on the subscribed screen before it.
      edges={["top", "bottom"]}
      footer={
        <>
          <Button label={t("subscribed.catchup.save")} onPress={onSave} disabled={saving} />
          <Button label={t("subscribed.catchup.skip")} onPress={onSkip} disabled={saving} variant="secondary" />
        </>
      }
    >
      <View style={{ gap: tokens.space.lg }}>
        <View style={{ gap: tokens.space.sm, paddingTop: tokens.space.xl }}>
          <Text style={{ ...tokens.text.hero, color: tokens.color.text }}>
            {t("subscribed.catchup.title")}
          </Text>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            {t("subscribed.catchup.body")}
          </Text>
        </View>
        {services.map((type) => (
          <ChipRow
            key={type}
            legend={serviceName(type)}
            options={whens}
            selected={chosen[type] ? [chosen[type]] : []}
            onPress={(when) => setChosen((prev) => ({ ...prev, [type]: when }))}
          />
        ))}
      </View>
    </Screen>
  );
}
