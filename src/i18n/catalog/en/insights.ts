import type { Fragment } from "../types";

/**
 * The costs screen.
 *
 * Every string here is written to be defensible against the log it is drawn
 * from. The screen adds up costs the user typed and nothing else, so the copy
 * never says "you spend" where it means "you recorded" — a total built from
 * three priced services out of eleven is a partial figure, and the caption
 * beside it has to say so rather than let the number stand as the whole year.
 */
export const insights: Fragment = {
  "insights.title": "Costs",
  "insights.subtitle": "What the garage has cost, straight from your log.",

  "insights.total.label": "Recorded so far",
  "insights.total.priced": {
    one: "From {count} service you priced.",
    other: "From {count} services you priced.",
  },
  "insights.total.unpriced": {
    one: "{count} more service has no cost recorded.",
    other: "{count} more services have no cost recorded.",
  },

  "insights.byVehicle.title": "By vehicle",
  "insights.byService.title": "Where it goes",
  "insights.byMonth.title": "Last 12 months",


  // The empty state is the common one on a fresh install, and it has to name the
  // one action that fixes it rather than apologise for the blank screen.
  "insights.empty.title": "Nothing priced yet",
  "insights.empty.body":
    "Add a cost when you log a service and it turns up here. Past services can be edited too.",
  "insights.empty.cta": "Go to my garage",

  "insights.open": "See costs",
};
