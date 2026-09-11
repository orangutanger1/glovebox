/**
 * The only number in this flow that is not the user's own.
 *
 * Everything else onboarding shows is counted from what the user typed — see
 * the note at the top of `pain.ts`, which rules out picking three dramatic
 * statistics and printing them on a red screen. This file is the exception, and
 * it is allowed to be one on two conditions: the figure is real and current,
 * and the screen prints where it came from. A statistic the user cannot chase
 * is indistinguishable from one we invented.
 *
 * It used to hold two more. AAA's Your Driving Costs rate per mile drove a
 * money figure — this user's mileage at 11.04¢ — and AAA's Car Care Month
 * release supplied a roadside breakdown, 74% of 27 million calls being tows and
 * flat batteries. Both were real and both are gone, because the screen they
 * were on had three statistics and one point. The money was the weakest of
 * them: it is what the car costs whoever owns it, logged or not, which makes it
 * an argument for a cheaper car rather than for this app. Git has them if a
 * later screen wants one.
 *
 * The file and the route are still called `cost`. Renaming them would mean a
 * `RETIRED` entry in `flow.ts` for every install parked on the step, which is a
 * migration to buy a better word.
 */

/**
 * How much of the country is behind on the work this app tracks.
 *
 * From CARFAX's release of 18 November 2025 (Centreville, Va.): "Nearly half of
 * all drivers are behind on at least one major service", which the release puts
 * at "roughly 41% of vehicles nationwide". CARFAX names the major services it
 * counts — brakes, steering and suspension, transmission fluid, coolant, engine
 * and cabin air filters — and reports separately that almost 30% of cars are
 * behind on tire rotations and nearly 20% on oil changes.
 *
 * Those two are on the glass under the headline because they are the services a
 * driver can picture, and because they are the two this app's own schedule is
 * most often counting down to. The headline number is the argument; they are
 * what it looks like in a garage.
 *
 * No saving is claimed anywhere near it, deliberately. "A log saves you $100 a
 * visit" is the sentence this screen is structurally asking for; the only
 * published version of it is AAA's 2015 Preventive Maintenance fact sheet,
 * where 77% of AAA Approved Auto Repair shops estimated customers who forget
 * recommended maintenance "could save, on average, $100 or more per visit". It
 * is a decade old and it is a survey of shops' estimates, which is two reasons
 * not to put a dollar figure on this screen's most important claim.
 */
export const OVERDUE = {
  behindPct: 41,
  tireRotationPct: 30,
  oilChangePct: 20,
  year: 2025,
  source: "CARFAX",
  publishedAt: "2025-11",
  url: "https://www.prnewswire.com/news-releases/carfax-nearly-half-of-drivers-in-the-us-behind-on-major-services-302618419.html",
} as const;
