import { getState, setState } from "../db/state";
import { deviceRegion } from "../i18n/device";
import { getLanguage } from "../i18n";

export const CURRENCY_KEY = "currency";

/**
 * The currency every cost in the app is read in.
 *
 * `service_records.cost` is a bare REAL: nothing has ever been stored beside it
 * saying what the number counts. That was survivable while a cost appeared once
 * per history row; an insights screen that adds costs together and prints one
 * total makes the missing label the loudest thing on the glass.
 *
 * App-wide rather than per vehicle, for the same reason the distance unit is
 * (see src/units): totals across the garage have to add up, and two vehicles
 * priced in different currencies have no honest sum.
 */
export type Currency = string;

/**
 * The storefronts the app ships a catalog for, plus the rest of the euro zone —
 * a German-language install in Austria is a different currency question from a
 * German-language install in Switzerland.
 *
 * Anything unlisted falls through to USD rather than to a guess: an unknown
 * region is exactly the case where inventing a symbol does damage.
 */
const REGION_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD",
  MX: "MXN", BR: "BRL", JP: "JPY", KR: "KRW", CH: "CHF",
  SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK",
  IN: "INR", ZA: "ZAR", SG: "SGD", HK: "HKD", AE: "AED",
  DE: "EUR", AT: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
  NL: "EUR", BE: "EUR", IE: "EUR", PT: "EUR", FI: "EUR",
  GR: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", LU: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
};

export function defaultCurrencyFor(region: string | null | undefined): Currency {
  return (region && REGION_CURRENCY[region.toUpperCase()]) || "USD";
}

let cached: Currency | null = null;

/**
 * The absent-key case is the one that matters, and it is the mirror of the
 * distance unit's.
 *
 * Every build before this module rendered a cost as `$${cost}` regardless of
 * language, so an install from before this setting existed holds numbers that
 * were entered while the screen said dollars. Reading the phone's region here
 * would relabel those numbers on first launch abroad — the same silent
 * relabelling `getDistanceUnit` refuses to do. So a missing row reads as USD,
 * and fresh installs get a currency written from the region during onboarding.
 */
export function getCurrency(): Currency {
  cached ??= getState(CURRENCY_KEY) ?? "USD";
  return cached;
}

export function setCurrency(currency: Currency): void {
  setState(CURRENCY_KEY, currency);
  cached = currency;
}

/** First launch picks a currency from the phone's region; every launch after
 *  that reads what is stored, so a user who changed it keeps their choice. */
export function initCurrency(): Currency {
  if (getState(CURRENCY_KEY) === null) setCurrency(defaultCurrencyFor(deviceRegion()));
  return getCurrency();
}

/** Test seam, matching `resetFormatters`: the cache outlives a database that
 *  a test rebuilds between cases. */
export function resetCurrency(): void {
  cached = null;
}

const moneyFormats: Record<string, Intl.NumberFormat> = {};

/**
 * "$1,240" / "1.240 €" / "¥124,000" — a cost, grouped and symbolised for the
 * reader's language and the garage's currency.
 *
 * Two separate questions, deliberately: the separators and symbol *placement*
 * follow the language (a French reader gets "1 240 €", never "€1,240"), while
 * the currency itself is the stored setting. Interpolating a symbol into a
 * template in each catalog would have hard-coded one order for both.
 *
 * Whole units, no minor digits. A maintenance log is a record of what a job
 * cost, not an invoice: "$1,240.00" spends four characters on a precision
 * nobody typed, and these numbers sit in narrow rows beside a date. JPY and KRW
 * have no minor unit anyway, so forcing two decimals would have been wrong
 * there in the other direction.
 *
 * Falls back to the grouped number with the code beside it if the runtime has
 * no currency data for the pair — Hermes ships a reduced ICU, and a total that
 * renders as "1,240 SEK" is worth more than one that throws.
 */
export function formatMoney(value: number, currency: Currency = getCurrency()): string {
  const language = getLanguage();
  const key = `${language}:${currency}`;
  try {
    moneyFormats[key] ??= new Intl.NumberFormat(language, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    return moneyFormats[key].format(value);
  } catch {
    return `${new Intl.NumberFormat(language).format(Math.round(value))} ${currency}`;
  }
}

/** Drops the memoised formatters, for the same reason `resetFormatters` does:
 *  a test that switches language must not read the previous one's cache. */
export function resetMoneyFormats(): void {
  for (const key of Object.keys(moneyFormats)) delete moneyFormats[key];
}
