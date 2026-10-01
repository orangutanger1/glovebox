import { Platform } from "react-native";
import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { getIntervals } from "../db/intervals";
import { dueStates } from "../schedule/due";
import { serviceName } from "../schedule/names";
import { getDistanceUnit } from "../units";
import { formatDistance } from "../units/format";
import { formatDate, t } from "../i18n";
import { buildWidgetProps, type WidgetProps } from "./snapshot";

/**
 * The widget's content, from the first car in the garage (the one the app
 * opened on), read from the records right now.
 */
export function currentWidgetProps(): WidgetProps {
  const vehicle = listVehicles()[0] ?? null;
  const unit = getDistanceUnit();
  const states = vehicle
    ? dueStates({
        records: listRecords(vehicle.id),
        intervals: getIntervals(),
        odometer: vehicle.odometer,
        unit,
        now: new Date().toISOString(),
      })
    : [];
  return buildWidgetProps({ vehicle, states, unit, serviceName, formatDistance, formatDate, t });
}

/**
 * Pushes the current content to the widget. Called from `rescheduleAll`,
 * which already runs on every launch and after every write, so the widget is
 * as fresh as the reminders. Required lazily: a binary built before the
 * widget extension has no native module, and an OTA must not crash it.
 * Never throws.
 */
export function syncWidget(): void {
  if (Platform.OS !== "ios") return;
  try {
    const widget = require("./NextService").default as { updateSnapshot(p: WidgetProps): void };
    widget.updateSnapshot(currentWidgetProps());
  } catch {
    // No widget extension in this binary, or no database yet.
  }
}
