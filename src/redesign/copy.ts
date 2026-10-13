import type { DueState } from "../schedule/due";
import { t, formatDueIn } from "../i18n";
import { getDistanceUnit } from "../units";
import { formatDistance } from "../units/format";
import { serviceName } from "../schedule/names";
import type { Task } from "./model";

/**
 * When a service is due, in the fewest words that are still exact: a magnitude
 * past due ("400 mi over") beats a date to subtract, a relative date ("In 12
 * days") beats an absolute one, and a distance-only service that is not close
 * is simply on schedule.
 */
export function whenLabel(s: DueState): string {
  if (s.status === "due" && s.overBy !== undefined) {
    return t("garage.over", { distance: formatDistance(s.overBy, getDistanceUnit()) });
  }
  if (s.status === "due") return t("garage.dueNow");
  if (s.dueAt) return formatDueIn(s.dueAt);
  return s.status === "soon" ? t("garage.dueSoon") : t("garage.onSchedule");
}

export function taskTitle(task: Task): string {
  return task.type === "tread" ? t("vehicle.tread.title") : serviceName(task.type);
}

export function taskDetail(task: Task): string {
  if (task.type === "tread") {
    return t(task.status === "due" ? "vehicle.tread.replaceNow" : "vehicle.tread.replaceSoon", {
      depth: task.treadDepth ?? "",
    });
  }
  return task.state ? whenLabel(task.state) : t("garage.dueSoon");
}
