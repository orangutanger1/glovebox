import type { Vehicle } from "../db/vehicles";
import type { ServiceRecord } from "../db/records";
import type { Interval } from "../schedule";
import type { DistanceUnit } from "../units";
import { dueStates, type DueState } from "../schedule/due";
import { lifeLeft, moodFor, type Mood, type Status } from "../mascot/mood";
import { formatTread, latestTread, treadStatus } from "../tires/tread";

/**
 * What the redesign's screens read: one view per vehicle, and the task lists
 * built from them.
 *
 * Pure over its inputs — the caller reads the vehicles, records and intervals
 * — so the rules that decide what is a task today, what is upcoming and what
 * mood the car is in can be asserted in Node. The due arithmetic itself is
 * `dueStates`, the same call the classic garage, the reminders and the widget
 * make, so the redesign cannot disagree with a notification about what is due.
 */

export type VehicleView = {
  vehicle: Vehicle;
  records: ServiceRecord[];
  states: DueState[];
  /** Worn tread, when the latest reading is at or under the warning depth. */
  tread?: { status: "due" | "soon"; depth: string };
  mood: Mood;
  /** Least interval left across tracked services, 0–1. Null with nothing tracked. */
  health: number | null;
  /** Interval left per tracked service, 0–1, most used-up first. Bevel's
   *  rings on Today draw the first three. */
  lives: { type: string; status: Status; left: number }[];
  /** The next thing this car needs: the worst state, soonest first. */
  next?: DueState;
};

const RANK: Record<Status, number> = { due: 2, soon: 1, ok: 0 };

export function vehicleView(input: {
  vehicle: Vehicle;
  records: ServiceRecord[];
  intervals: Record<string, Interval>;
  unit: DistanceUnit;
  now: string;
}): VehicleView {
  const { vehicle, records, intervals, unit, now } = input;
  const states = dueStates({ records, intervals, odometer: vehicle.odometer, unit, now });

  const worn = latestTread(records);
  const wornStatus = worn ? treadStatus(worn.mm) : "ok";
  const tread =
    worn && wornStatus !== "ok"
      ? { status: wornStatus, depth: formatTread(worn.mm, unit) }
      : undefined;

  const statuses: Status[] = states.map((s) => s.status);
  if (tread) statuses.push(tread.status);

  let health: number | null = null;
  const lives: VehicleView["lives"] = [];
  for (const s of states) {
    const interval = intervals[s.type];
    const left = lifeLeft({
      lastPerformedAt: s.last.performed_at,
      lastOdometer: s.last.odometer,
      months: interval?.months,
      distance: interval?.distance,
      odometer: vehicle.odometer,
      now,
    });
    if (left !== null) {
      health = health === null ? left : Math.min(health, left);
      lives.push({ type: s.type, status: s.status, left });
    }
  }
  lives.sort((a, b) => RANK[b.status] - RANK[a.status] || a.left - b.left);

  const next = [...states].sort(byUrgency)[0];

  return {
    vehicle,
    records,
    states,
    tread,
    mood: moodFor({ logged: records.length, statuses }),
    health,
    lives,
    next,
  };
}

/** Worst status first; within a status, the earliest due date first, and a
 *  state with no date (distance only) after the dated ones. */
export function byUrgency(a: DueState, b: DueState): number {
  const rank = RANK[b.status] - RANK[a.status];
  if (rank !== 0) return rank;
  if (a.overBy !== undefined || b.overBy !== undefined) return (b.overBy ?? 0) - (a.overBy ?? 0);
  if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
  return a.dueAt ? -1 : b.dueAt ? 1 : 0;
}

/** The garage's mood: the worst car's, or sleepy when nothing is logged anywhere. */
export function garageMood(views: readonly VehicleView[]): Mood {
  return moodFor({
    logged: views.reduce((n, v) => n + v.records.length, 0),
    statuses: views.flatMap((v) => [
      ...v.states.map((s) => s.status),
      ...(v.tread ? [v.tread.status] : []),
    ]),
  });
}

export type Task = {
  vehicleId: string;
  vehicleName: string;
  /** A service type, or "tread" for worn tyres. */
  type: string;
  status: "due" | "soon";
  state?: DueState;
  treadDepth?: string;
};

/** Planta's "Today": every overdue or due-soon service, across all cars,
 *  overdue first. Worn tread is a task too — it is what the tread field is for. */
export function todayTasks(views: readonly VehicleView[]): Task[] {
  const out: Task[] = [];
  for (const v of views) {
    for (const s of [...v.states].sort(byUrgency)) {
      if (s.status === "ok") continue;
      out.push({
        vehicleId: v.vehicle.id,
        vehicleName: v.vehicle.name,
        type: s.type,
        status: s.status,
        state: s,
      });
    }
    if (v.tread) {
      out.push({
        vehicleId: v.vehicle.id,
        vehicleName: v.vehicle.name,
        type: "tread",
        status: v.tread.status,
        treadDepth: v.tread.depth,
      });
    }
  }
  return out.sort((a, b) => RANK[b.status] - RANK[a.status]);
}

export type HeroFigure =
  | { kind: "over"; vehicleId: string; vehicleName: string; type: string; overBy: number; last: DueState["last"] }
  | { kind: "date"; vehicleId: string; vehicleName: string; type: string; status: Status; dueAt: string }
  | { kind: "distance"; vehicleId: string; vehicleName: string; type: string; status: Status; left: number };

/** A v2's Today leads with one figure: the most urgent next service across
 *  every car, as the single number that says it best. Distance over beats a
 *  date; a date beats distance left, because it needs no odometer to be right. */
export function heroFigure(
  views: readonly VehicleView[],
  odometers: Record<string, number | undefined>,
): HeroFigure | null {
  const ranked = views
    .filter((v): v is VehicleView & { next: DueState } => v.next !== undefined)
    .sort((a, b) => byUrgency(a.next, b.next));
  const top = ranked[0];
  if (!top) return null;
  const s = top.next;
  const base = { vehicleId: top.vehicle.id, vehicleName: top.vehicle.name, type: s.type };
  if (s.overBy !== undefined) return { ...base, kind: "over", overBy: s.overBy, last: s.last };
  if (s.dueAt) return { ...base, kind: "date", status: s.status, dueAt: s.dueAt };
  const odo = odometers[top.vehicle.id];
  if (s.dueOdometer !== undefined && odo !== undefined) {
    return { ...base, kind: "distance", status: s.status, left: Math.max(0, s.dueOdometer - odo) };
  }
  return null;
}

export type Road = { vehicleId: string; vehicleName: string; odometer?: number; ahead: DueState[]; behind: DueState[] };

const AHEAD_MAX = 6;

/** A v2's Upcoming tab as a road: the car at its reading, what's next as signs
 *  ahead in the order it comes due, and anything overdue behind it. */
export function roadFor(view: VehicleView): Road {
  const sorted = [...view.states].sort(byUrgency);
  const ahead = sorted
    .filter((s) => s.status !== "due")
    .sort(
      (a, b) =>
        (a.dueAt ?? "~").localeCompare(b.dueAt ?? "~") ||
        (a.dueOdometer ?? Infinity) - (b.dueOdometer ?? Infinity),
    )
    .slice(0, AHEAD_MAX);
  return {
    vehicleId: view.vehicle.id,
    vehicleName: view.vehicle.name,
    odometer: view.vehicle.odometer,
    ahead,
    behind: sorted.filter((s) => s.status === "due"),
  };
}

/** One road per car with anything tracked, most urgent car first. */
export function roads(views: readonly VehicleView[]): Road[] {
  return views
    .filter((v) => v.states.length > 0)
    .sort((a, b) => (a.next && b.next ? byUrgency(a.next, b.next) : a.next ? -1 : b.next ? 1 : 0))
    .map(roadFor);
}

/** Where a service is next due, read off the view rebuilt after the log, so
 *  A v2's logged screen says what the schedule will say. Null when the type
 *  has no interval (a custom service). */
export function nextFor(view: VehicleView, type: string): { dueOdometer?: number; dueAt?: string } | null {
  const s = view.states.find((x) => x.type === type);
  if (!s || (s.dueOdometer === undefined && !s.dueAt)) return null;
  return { dueOdometer: s.dueOdometer, dueAt: s.dueAt };
}

export type UpcomingItem = { vehicleId: string; vehicleName: string; type: string; dueAt: string };

/** Planta's "Upcoming": every service on schedule that has a date, soonest
 *  first. The screen groups them under "In 12 days" headings. */
export function upcomingItems(views: readonly VehicleView[]): UpcomingItem[] {
  const out: UpcomingItem[] = [];
  for (const v of views) {
    for (const s of v.states) {
      if (s.status !== "ok" || !s.dueAt) continue;
      out.push({ vehicleId: v.vehicle.id, vehicleName: v.vehicle.name, type: s.type, dueAt: s.dueAt });
    }
  }
  return out.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

/** The services the plan is built on. An oil change, the tyres, the brakes and
 *  the air filter are what almost every car is due for most often; a schedule
 *  that knows when they were last done, and how far the car has gone, is one
 *  the app can actually keep. */
export const PLAN_BASIS = ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter"] as const;

export type PlanGap = { kind: "odometer" } | { kind: "service"; type: string };

/**
 * Planta's "info 90% complete — fill in missing info to improve accuracy",
 * for a car: one step for the odometer and one per basis service with a record.
 * `gap` is the first missing step, which is what the card offers to fill.
 */
export function planCompleteness(view: Pick<VehicleView, "vehicle" | "records">): {
  percent: number;
  gap: PlanGap | null;
} {
  const logged = new Set(view.records.map((r) => r.service_type));
  const gaps: PlanGap[] = [];
  if (view.vehicle.odometer === undefined) gaps.push({ kind: "odometer" });
  for (const type of PLAN_BASIS) if (!logged.has(type)) gaps.push({ kind: "service", type });
  const steps = PLAN_BASIS.length + 1;
  return { percent: Math.round(((steps - gaps.length) / steps) * 100), gap: gaps[0] ?? null };
}
