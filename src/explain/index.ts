import { formatDate, formatDueIn, t } from "../i18n";
import type { Interval } from "../schedule";
import type { DueState } from "../schedule/due";
import type { DistanceUnit } from "../units";
import { formatDistance } from "../units/format";

/**
 * Service explainers: one short card per shipped service, saying what it is,
 * why it matters and whether an owner can do it themselves.
 *
 * A retention feature, not a selling one: the cards sit behind the paywall,
 * render the same in both `app_design` arms apart from the palette and the
 * mascot, and never appear in onboarding. The copy is static catalog text
 * (`explain.<type>.*`), so a card works offline and needs no server.
 *
 * Spec: docs/superpowers/specs/2026-10-13-service-explainers-design.md.
 */

export type Difficulty = "easy" | "doable" | "shop";

/**
 * The services that have a card, and how hard each is to do yourself.
 * `null` means the tag doesn't apply (paperwork and the legal test). "Other"
 * and anything the owner typed themselves have no card: there is nothing
 * honest to say about a service the app can't name.
 */
const DIFFICULTY: Record<string, Difficulty | null> = {
  "Oil Change": "doable",
  "Tire Rotation": "shop",
  "Brake Inspection": "shop",
  "Air Filter": "easy",
  "Cabin Air Filter": "easy",
  "Wiper Blades": "easy",
  "Battery Check": "easy",
  "Coolant Flush": "shop",
  "Transmission Fluid": "shop",
  "Spark Plugs": "doable",
  Registration: null,
  Inspection: null,
};

export const EXPLAINED: readonly string[] = Object.keys(DIFFICULTY);

export function hasExplainer(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(DIFFICULTY, type);
}

export function difficultyOf(type: string): Difficulty | null {
  return DIFFICULTY[type] ?? null;
}

/** Where a card was opened from, as `explainer_opened.source` reports it. */
export type ExplainSource = "service_row" | "due_row" | "notification" | "log_form";

/** The route that opens a card. `vehicle` lets the card read that car's own
 *  schedule; without it the card shows the interval alone. */
export function explainPath(type: string, source: ExplainSource, vehicleId?: string): string {
  const params = [`type=${encodeURIComponent(type)}`, `source=${source}`];
  if (vehicleId) params.push(`vehicle=${encodeURIComponent(vehicleId)}`);
  return `/explain?${params.join("&")}`;
}

/** The card's status, as `explainer_opened.status` reports it. */
export type ExplainStatus = "ok" | "due_soon" | "overdue" | "never_logged";

export function explainStatus(state: DueState | undefined): ExplainStatus {
  if (!state) return "never_logged";
  if (state.status === "due") return "overdue";
  if (state.status === "soon") return "due_soon";
  return "ok";
}

/** "Every 6 months · 5,000 mi", or null when the owner tracks no interval. */
export function intervalLine(interval: Interval | undefined, unit: DistanceUnit): string | null {
  if (!interval) return null;
  const { months, distance } = interval;
  let every: string | null = null;
  if (months !== undefined && distance !== undefined) {
    every = t("intervals.monthsAndDistance", {
      count: months,
      distance: formatDistance(distance, unit),
    });
  } else if (months !== undefined) {
    every = t("intervals.months", { count: months });
  } else if (distance !== undefined) {
    every = formatDistance(distance, unit);
  }
  return every ? t("explain.every", { interval: every }) : null;
}

/**
 * The "Your schedule" lines, built from the owner's own interval and record —
 * never from the copy — so a metric market, or an owner who changed the
 * interval, reads their own numbers.
 *
 * Pure over its inputs so it can be asserted in Node with no database.
 */
export function scheduleLines(input: {
  interval: Interval | undefined;
  state: DueState | undefined;
  unit: DistanceUnit;
  now?: number;
}): string[] {
  const lines: string[] = [];
  const every = intervalLine(input.interval, input.unit);
  if (every) lines.push(every);

  const { state } = input;
  if (!state) {
    lines.push(t("explain.never"));
    return lines;
  }

  const date = formatDate(state.last.performed_at);
  lines.push(
    state.last.odometer !== undefined
      ? t("explain.last.odometer", {
          date,
          distance: formatDistance(state.last.odometer, input.unit),
        })
      : t("explain.last", { date }),
  );

  if (state.status === "due") {
    lines.push(
      state.overBy !== undefined
        ? t("explain.overdueBy", { distance: formatDistance(state.overBy, input.unit) })
        : t("explain.overdue"),
    );
  } else if (state.dueAt) {
    lines.push(t("explain.due", { when: formatDueIn(state.dueAt, input.now) }));
  } else if (state.dueOdometer !== undefined) {
    lines.push(t("explain.dueAt", { distance: formatDistance(state.dueOdometer, input.unit) }));
  }
  return lines;
}
