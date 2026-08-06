import { t } from "../i18n";
import { SERVICE_TYPES } from "./index";

/**
 * The reader's words for a service, from the app's stable identifier.
 *
 * "Oil Change" is three things at once in this app: a `service_intervals`
 * primary key, the value written into `service_records.service_type`, and a
 * column in the CSV the user has already built a spreadsheet against. So it is
 * never translated in place — the English identifier stays in the database
 * forever and only ever reaches the glass through here.
 *
 * A type the app has no key for (an override the user typed themselves, a row
 * from a future version) comes back as itself. That is the honest answer: it is
 * their own word, and inventing a translation for it would be worse.
 */
export function serviceName(type: string): string {
  const key = `service.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

/** The shipped types in offer order, each already in the reader's language —
 *  what a picker or a chip row renders. */
export function serviceOptions(): { type: string; label: string }[] {
  return SERVICE_TYPES.map((type) => ({ type, label: serviceName(type) }));
}
