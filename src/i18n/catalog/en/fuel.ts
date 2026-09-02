import type { Fragment } from "../types";

/**
 * The fuel log.
 *
 * The copy carries one idea the arithmetic cannot: a figure appears only
 * between two full tanks, so the empty and one-fill states have to say what is
 * still needed rather than show a dash. A user whose first fill produced no
 * number reads the app as broken unless it tells them the second full tank is
 * where the figure arrives.
 *
 * No unit appears in any sentence here. Volume and efficiency labels live in
 * the unit fragment and are chosen from the region.
 */
export const fuel: Fragment = {
  "fuel.title": "Fuel",
  "fuel.log": "Log fuel",
  "fuel.seeAll": "See all fills",

  "fuel.summary.last": "Last tank",
  "fuel.summary.average": "Average",
  "fuel.summary.needFirst": "Log a fill-up and it turns up here.",
  "fuel.summary.needSecond": "One more full tank and your first figure appears.",

  "fuel.history.title": "Fill-ups",
  "fuel.history.empty": "No fill-ups logged yet.",
  "fuel.row.partial": "Part fill",
  "fuel.deleted": "Fill-up deleted",
  "fuel.undo": "Undo",
  "fuel.swipe.delete": "Delete",

  "fuel.form.title": "Log fuel",
  "fuel.form.odometer": "Odometer ({unit})",
  "fuel.form.volume": "Fuel ({unit})",
  "fuel.form.cost": "Total paid (optional)",
  "fuel.form.full": "Filled the tank",
  "fuel.form.fullHint": "Leave this on unless you stopped short of full.",
  "fuel.form.when": "When",
  "fuel.form.today": "Today",
  "fuel.form.yesterday": "Yesterday",
  "fuel.form.otherDate": "Another day",
  "fuel.form.save": "Save fill-up",
  "fuel.form.error": "That fill-up could not be saved.",
  "fuel.form.needOdometer": "Enter the odometer reading and how much fuel went in.",

  "fuel.card.title": "Fuel",
  "fuel.card.spend": "Fuel spend",
  "fuel.card.perDistance": "Cost per 100 {unit}",
  "fuel.card.efficiency": "Efficiency",
  "fuel.card.months": "Last 12 months",
  "fuel.card.fills": {
    one: "From {count} fill you priced.",
    other: "From {count} fills you priced.",
  },
  "fuel.card.unpriced": {
    one: "{count} more fill has no cost recorded.",
    other: "{count} more fills have no cost recorded.",
  },
  "fuel.card.locked.title": "See what fuel is costing you",
  "fuel.card.locked.body":
    "Your fill-ups are already logged. Pro turns them into efficiency, spend and cost per distance.",
  "fuel.card.locked.cta": "Unlock fuel insights",
  "fuel.card.empty": "Log two full tanks and this fills in.",
};
