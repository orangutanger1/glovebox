import { KM_PER_MILE, type DistanceUnit } from "../units";

/**
 * The only numbers in this flow that are not the user's own.
 *
 * Everything else onboarding shows is counted from what the user typed — see
 * the note at the top of `pain.ts`, which rules out picking three dramatic
 * statistics and printing them on a red screen. This file is the exception, and
 * it is allowed to be one on two conditions: the figures are real and current,
 * and the screen prints where they came from. A statistic the user cannot chase
 * is indistinguishable from one we invented.
 *
 * Both are AAA's, both were read from AAA's own publications, and both are
 * recorded with the date they were published so a later reader can tell how
 * stale they have gone. AAA republishes Your Driving Costs every September; when
 * the 2026 edition lands, the number below changes and nothing else does.
 */

/**
 * Maintenance, repair and tyres, as a rate per mile.
 *
 * From AAA's Your Driving Costs 2025 fact sheet, category table: "Maintenance,
 * Repair & Tires — 11.04¢/mile", averaged over five years and 75,000 miles, and
 * described there as covering "retail parts & labor for routine maintenance
 * specified by the vehicle manufacturer, a comprehensive extended warranty,
 * repairs to wear-and-tear items that require service during 5 years of
 * operation & one set of replacement tires."
 *
 * It is a US figure in US dollars, which is why `CURRENCY` is fixed rather than
 * read from the user's own currency setting. Formatting eleven cents a mile
 * into złoty because the phone is Polish would be inventing an exchange rate
 * and a Polish labour market in one step. The distance converts — a kilometre
 * is a kilometre — and the money stays in the currency it was published in,
 * with the screen saying so.
 */
export const MAINTENANCE_RATE = {
  centsPerMile: 11.04,
  currency: "USD",
  /** AAA's own horizon for the figure, and the one the screen quotes. */
  years: 5,
  source: "AAA Your Driving Costs",
  edition: "2025",
  publishedAt: "2025-09",
  url: "https://newsroom.aaa.com/wp-content/uploads/2025/09/UPDATE-AAA-Fact-Sheet-Your-Driving-Cost-9.2025-1.pdf",
} as const;

/**
 * What breaking down looks like at national scale.
 *
 * From AAA's Car Care Month release of 1 April 2025: AAA answered 27 million
 * roadside calls in 2024, of which roughly 13 million were tows and 7 million
 * were batteries — "roughly 74% of total calls" between them. The release
 * quotes AAA's own managing director for Automotive saying those calls "could
 * have been avoided had these vehicles been maintained", which is the claim the
 * screen leans on; the app does not make it on AAA's behalf.
 */
export const ROADSIDE = {
  calls: 27_000_000,
  year: 2024,
  towingAndBatteryPct: 74,
  source: "AAA",
  publishedAt: "2025-04",
  url: "https://newsroom.aaa.com/2025/04/aaa-urges-drivers-to-stay-proactive-on-auto-repair-and-maintenance/",
} as const;

/** Rounded to this, for the same reason the odometer estimate is: a projection
 *  printed to the dollar is a lie about how precise it is. */
const ROUND_TO = 10;

/**
 * What this driver's own mileage costs at AAA's rate, per year and over AAA's
 * five-year horizon.
 *
 * Takes the rate the plan is already projecting at, so the figure on this screen
 * and the due dates three screens earlier come from one number. Kilometres are
 * converted to miles because the published rate is per mile; nothing else about
 * the arithmetic changes.
 */
export function maintenanceCost(
  distancePerYear: number,
  unit: DistanceUnit
): { perYear: number; overFiveYears: number; miles: number } {
  const miles = unit === "km" ? distancePerYear / KM_PER_MILE : distancePerYear;
  const perYear = Math.round((miles * MAINTENANCE_RATE.centsPerMile) / 100 / ROUND_TO) * ROUND_TO;
  return {
    miles: Math.round(miles),
    perYear,
    overFiveYears:
      Math.round((perYear * MAINTENANCE_RATE.years) / ROUND_TO) * ROUND_TO,
  };
}
