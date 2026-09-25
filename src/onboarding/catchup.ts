import type { Plan } from "./plan";

/**
 * The questions the post-purchase catch-up asks: when each service with
 * nothing on file was last done.
 *
 * Onboarding asks about one service. Every other service in the plan is then
 * "No record", which the plan treats as due now — so the schedule a subscriber
 * has just paid for opens with most of its rows reading overdue, and not one
 * of them is a date. Asking a handful more, right after the receipt, turns
 * those rows into real due dates in one screen.
 *
 * The common services first, and no more than four: past that it is a form.
 */
export const CATCHUP_ORDER = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
] as const;

export const CATCHUP_LIMIT = 4;

export const CATCHUP_WHEN = ["Last month", "3 months ago", "6 months ago", "Over a year ago", "Not sure"] as const;
export type CatchupWhen = (typeof CATCHUP_WHEN)[number];

/** Days back each answer files the record at. "Not sure" files nothing, the
 *  same safe direction the onboarding question errs in. */
export const CATCHUP_DAYS_AGO: Record<CatchupWhen, number | null> = {
  "Last month": 30,
  "3 months ago": 90,
  "6 months ago": 180,
  "Over a year ago": 400,
  "Not sure": null,
};

/** The services to ask about, in asking order: tracked here, and unlogged. */
export function catchupServices(plan: Plan): string[] {
  const unlogged = new Set(plan.items.filter((i) => !i.logged).map((i) => i.type));
  return CATCHUP_ORDER.filter((type) => unlogged.has(type)).slice(0, CATCHUP_LIMIT);
}
