import type { Fragment } from "../types";

/**
 * The copy that is not on a screen: notifications iOS renders while the app is
 * closed, the CSV export's header row, the home-screen long-press menu, and the
 * name a vehicle falls back to when its parts are all blank.
 *
 * The CSV cells stay machine-readable — service types are identifiers, dates are
 * ISO, numbers are unformatted — because a spreadsheet built against last
 * month's export must still open this month's. Only the header row is
 * translated, which is the half a person actually reads.
 */
export const system: Fragment = {
  "system.notify.title": "{service} is due",
  "system.notify.title.named": "{name}, your {service} is due",
  "system.notify.body": "{vehicle} · Last done {date}.",
  // The seven nudges an unfinished onboarding gets: one hour, three hours, a
  // day, three days, a week, three weeks and a month after the user walked
  // away. Two sets — this one for a run that stopped inside the quiz, the
  // `.ask.` set below for one that stopped at the paywall or the offer.
  // Every line is a reason to come back, never a complaint about not having
  // done so; the last ones say "still" rather than "last".
  "system.resume.first.title": "Your plan is almost ready",
  "system.resume.first.title.named": "{name}, your plan is almost ready",
  "system.resume.first.body": "{vehicle} · One more minute and every service date is set.",
  "system.resume.second.title": "Pick up where you left off",
  "system.resume.second.title.named": "{name}, pick up where you left off",
  "system.resume.second.body": "{vehicle} · Everything you entered is saved. One minute finishes it.",
  "system.resume.third.title": "Your schedule is waiting",
  "system.resume.third.title.named": "{name}, your schedule is waiting",
  "system.resume.third.body": "{vehicle} · Finish setup and see exactly what's due, and when.",
  "system.resume.fourth.title": "Two minutes to a full plan",
  "system.resume.fourth.title.named": "{name}, two minutes to a full plan",
  "system.resume.fourth.body": "{vehicle} · Every interval dated and tracked. Finish setup today.",
  "system.resume.fifth.title": "Still saved, still ready",
  "system.resume.fifth.title.named": "{name}, still saved, still ready",
  "system.resume.fifth.body": "{vehicle} · Your setup is right where you left it. One minute to done.",
  "system.resume.sixth.title": "Your car deserves a plan",
  "system.resume.sixth.title.named": "{name}, your car deserves a plan",
  "system.resume.sixth.body": "{vehicle} · Most owners finish in under two minutes. Yours is halfway there.",
  "system.resume.seventh.title": "Your setup is still here",
  "system.resume.seventh.title.named": "{name}, your setup is still here",
  "system.resume.seventh.body": "{vehicle} · Whenever you're ready, one minute finishes it.",
  // For a user who reached the paywall or the exit offer and left. "Almost
  // ready" is untrue of them: every question is answered and the plan is
  // built. So the plan is the message — the count is the services this car
  // has a history for and is now due or close to, never the ones the app has
  // simply not been told about. `.zero` is what a car with nothing behind on
  // it gets, because "0 services need attention" is an argument against
  // buying.
  "system.resume.ask.first.title": "Your plan is ready",
  "system.resume.ask.first.title.named": "{name}, your plan is ready",
  "system.resume.ask.first.body": {
    one: "{vehicle} · 1 service needs attention. Pro handles it from here.",
    other: "{vehicle} · {count} services need attention. Pro handles every one.",
  },
  "system.resume.ask.first.body.zero": "{vehicle} · Every service dated and tracked. Pro handles it from here.",
  "system.resume.ask.second.title": "One tap from covered",
  "system.resume.ask.second.title.named": "{name}, one tap from covered",
  "system.resume.ask.second.body": "{vehicle} · Your plan is built and saved. One tap and Pro runs it.",
  "system.resume.ask.third.title": "Your plan is waiting",
  "system.resume.ask.third.title.named": "{name}, your plan is waiting",
  "system.resume.ask.third.body": "{vehicle} · Nothing to re-enter. One tap and every service is tracked.",
  "system.resume.ask.fourth.title": "Nothing slips with Pro",
  "system.resume.ask.fourth.title.named": "{name}, nothing slips with Pro",
  "system.resume.ask.fourth.body": "{vehicle} · Your plan is saved. Most owners catch a forgotten service in month one.",
  "system.resume.ask.fifth.title": "Your plan is still saved",
  "system.resume.ask.fifth.title.named": "{name}, your plan is still saved",
  "system.resume.ask.fifth.body": "{vehicle} · One tap and Pro picks up every service date from here.",
  "system.resume.ask.sixth.title": "The odometer keeps climbing",
  "system.resume.ask.sixth.title.named": "{name}, the odometer keeps climbing",
  "system.resume.ask.sixth.body": "{vehicle} · Your plan is ready to keep up. One tap and you're covered.",
  "system.resume.ask.seventh.title": "A month on, still ready",
  "system.resume.ask.seventh.title.named": "{name}, a month on, still ready",
  "system.resume.ask.seventh.body": "{vehicle} · Your plan is saved and waiting. One tap and Pro takes it from here.",

  "system.notify.when.today": "Today",
  "system.notify.when.tomorrow": "Tomorrow",
  "system.notify.when.days": {
    one: "In {count} day",
    other: "In {count} days",
  },
  "system.notify.when.months": {
    one: "In {count} month",
    other: "In {count} months",
  },

  "system.csv.header.vehicle": "Vehicle",
  "system.csv.header.service": "Service",
  "system.csv.header.date": "Date",
  "system.csv.header.odometer": "Odometer ({unit})",
  "system.csv.header.cost": "Cost",
  "system.csv.header.notes": "Notes",
  "system.csv.header.deleted": "Deleted",
  "system.csv.cell.deleted": "deleted",
  "system.csv.fuel.volume": "Fuel ({unit})",
  "system.csv.fuel.full": "Full tank",
  "system.csv.cell.yes": "Yes",
  "system.csv.cell.no": "No",

  "system.quickaction.trial.title": "Try Pro",
  "system.quickaction.trial.subtitle": "A year of Pro at the offer price",
  "system.quickaction.feedback.title": "Send feedback",
  "system.quickaction.feedback.subtitle": "Tell us what went wrong",

  "system.vehicle.fallback": "My car",
};
