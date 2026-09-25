import { useMemo, useState } from "react";
import { Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Field } from "../src/design/Field";
import { Button } from "../src/design/Button";
import { Gauge } from "../src/design/Gauge";
import { tokens } from "../src/design/tokens";
import { getVehicle, setOdometerReading } from "../src/db/vehicles";
import { lastReadingAt, markOdometerRead } from "../src/db/checkin";
import { rescheduleAll } from "../src/notify";
import { track } from "../src/analytics";
import { parseNumber } from "../src/format";
import { t, formatDate, formatNumber } from "../src/i18n";
import { getDistanceUnit } from "../src/units";
import { distanceUnitLabel } from "../src/units/format";

/**
 * The monthly mileage check: one number, or "hasn't changed".
 *
 * Opened from the check-in notification and from the odometer on the car
 * screen. The field starts empty with the last reading as its placeholder,
 * the same choice the fuel form made: a prefilled number saved untouched says
 * nothing, and "hasn't changed" is its own button so that answer is one tap
 * rather than a Save on a number the owner did not look at.
 *
 * A reading below the last one is refused here rather than written. It is
 * almost always a typo, and the high-water rule every other screen follows
 * exists because a wound-back dash makes every distance-based service look
 * further away than it is. The edit screen is still where a wrong high
 * reading comes off, and the error says so.
 */
export default function Checkin() {
  const router = useRouter();
  const { vehicle: vehicleId, source } = useLocalSearchParams<{
    vehicle: string;
    source?: string;
  }>();
  const vehicle = useMemo(() => (vehicleId ? getVehicle(vehicleId) : null), [vehicleId]);
  const readAt = useMemo(() => (vehicle ? lastReadingAt(vehicle) : undefined), [vehicle]);
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");

  const unit = getDistanceUnit();
  const from = source === "notification" ? "notification" : "vehicle";

  function done(changed: boolean, value?: number) {
    if (!vehicle) return;
    markOdometerRead(vehicle.id);
    rescheduleAll().catch(() => {});
    track("odometer_checkin", {
      source: from,
      changed,
      had_reading: vehicle.odometer !== undefined,
      // How far it moved, bucketed: whether a month's check-in is catching
      // real driving or a car that sits.
      moved:
        !changed || value === undefined || vehicle.odometer === undefined
          ? null
          : bucket(value - vehicle.odometer),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // From a notification the screen underneath is the garage, and the thing
    // worth seeing now is what this number changed: the car's due list.
    if (from === "notification") router.replace(`/vehicle/${vehicle.id}`);
    else router.back();
  }

  function onSave() {
    if (!vehicle) return;
    setError("");
    const value = parseNumber(reading);
    if (value === undefined || value < 0) {
      setError(t("vehicleForms.number.invalid"));
      return;
    }
    if (vehicle.odometer !== undefined && value < vehicle.odometer) {
      setError(
        t("checkin.lower", {
          reading: formatNumber(vehicle.odometer),
          unit: distanceUnitLabel(unit),
        })
      );
      return;
    }
    if (value !== vehicle.odometer) setOdometerReading(vehicle.id, value);
    done(value !== vehicle.odometer, value);
  }

  if (!vehicle) {
    return (
      <Screen title={t("checkin.title")}>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          {t("checkin.gone")}
        </Text>
      </Screen>
    );
  }

  const hasReading = vehicle.odometer !== undefined;

  return (
    <Screen
      title={t("checkin.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label={t("checkin.save")} onPress={onSave} disabled={!reading.trim()} />
          {hasReading ? (
            <Button label={t("checkin.same")} variant="secondary" onPress={() => done(false)} />
          ) : null}
        </>
      }
    >
      <Card>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>{vehicle.name}</Text>
        {hasReading ? (
          <Gauge
            legend={
              readAt
                ? t("checkin.last", { date: formatDate(readAt) })
                : t("vehicle.odometer")
            }
            value={formatNumber(vehicle.odometer!)}
            unit={distanceUnitLabel(unit)}
          />
        ) : null}
      </Card>
      <Card>
        <Field
          label={t("checkin.field", { unit: distanceUnitLabel(unit) })}
          value={reading}
          onChangeText={(s) => {
            setReading(s);
            if (error) setError("");
          }}
          placeholder={hasReading ? String(vehicle.odometer) : undefined}
          keyboardType="numeric"
          autoFocus
        />
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {t("checkin.why")}
        </Text>
      </Card>
    </Screen>
  );
}

function bucket(delta: number): string {
  if (delta <= 0) return "0";
  if (delta < 250) return "<250";
  if (delta < 1000) return "250-1000";
  if (delta < 2500) return "1000-2500";
  return "2500+";
}
