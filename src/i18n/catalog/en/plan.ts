import type { Fragment } from "../types";

/**
 * The one-line "when" under a service, shared by the results, plan and paywall
 * screens so the same row cannot be described three ways.
 *
 * "about {date}" carries the app's honesty rule into every language: that date
 * was projected from the owner's own estimate of how far they drive, and it must
 * never read as firmly as one computed from a logged service.
 */
export const plan: Fragment = {
  "plan.line.nothing": "Nothing on file",
  "plan.line.about": "about {date}",
  "plan.line.noInterval": "No interval set",
};
