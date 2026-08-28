import type { Fragment } from "../types";

/**
 * The settings screen: the privacy promise, the seven rows, and every message
 * the OS or the store can make this screen say.
 *
 * The reminder row is one message per state rather than a stem with suffixes.
 * It reports a count and sometimes a date, and both of those move around the
 * sentence from one language to the next, so "on", "on with a count" and "on
 * with a count and a date" are three finished sentences here.
 */
export const settings: Fragment = {
  "settings.title": "Settings",
  "settings.privacy":
    "Your records live on this phone only. No account, no server. Export any time, because export is never gated.",

  "settings.export": "Export all records (CSV)",
  "settings.export.error": "Could not open the share sheet. Your records are unchanged.",

  "settings.intervals": "Service intervals",

  "settings.theme.label": "Appearance",

  // Two rows a localized app has to have: which language, and which unit. The
  // unit dialog is worded to be boring on purpose — it names both units and
  // shows what one real reading becomes, so nobody can be surprised afterwards.
  "settings.language": "Language: {language}",
  "settings.units": "Units: {unit}",
  "settings.units.title": "Switch to {unit}?",
  "settings.units.body":
    "Every odometer reading and interval you have saved will be converted from {from} to {to}. A 50,000 {from} reading becomes {example}.",
  "settings.units.cancel": "Cancel",
  "settings.units.confirm": "Convert",

  "settings.reminders.enable": "Enable reminders",
  "settings.reminders.blocked": "Reminders blocked, open iOS Settings",
  "settings.reminders.none": "Reminders on, nothing due yet",
  "settings.reminders.on": {
    one: "Reminders on, {count} scheduled",
    other: "Reminders on, {count} scheduled",
  },
  "settings.reminders.onNext": {
    one: "Reminders on, {count} scheduled, next {date}",
    other: "Reminders on, {count} scheduled, next {date}",
  },
  "settings.reminders.scheduled": "Reminders scheduled.",
  "settings.reminders.denied": "Reminders denied. You can turn them on in iOS Settings.",
  "settings.reminders.error": "Could not ask for notification permission.",
  "settings.reminders.openSettings":
    "Open iOS Settings › Wrenchy › Notifications to turn reminders back on.",

  "settings.manage": "Manage subscription",
  "settings.manage.error": "Could not open subscription settings. Try again on a better connection.",
  "settings.upgrade": "Upgrade to Pro",
  "settings.restore": "Restore purchases",
  "settings.restore.done": "Pro restored.",
  "settings.restore.none": "No purchase found.",
  "settings.store.error": "Could not reach the store. Try again on a better connection.",
  "settings.pro.on": "Pro is on. Thank you.",
  "settings.offer.applied": "That offer is applied. Nothing else to do.",

  "settings.replay": "Replay onboarding",
  "settings.replay.title": "Replay onboarding?",
  "settings.replay.body":
    "Your vehicles and records are kept. Walking the flow again adds another vehicle, which you can delete afterwards.",
  "settings.replay.cancel": "Cancel",
  "settings.replay.confirm": "Replay",
};
