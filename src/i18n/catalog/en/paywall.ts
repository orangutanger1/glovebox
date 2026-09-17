import type { Fragment } from "../types";

/**
 * The price list, drawn by the app since 2026-09-16.
 *
 * Nothing in here is a price. `{price}`, `{intro}` and `{pct}` are filled from
 * StoreKit's own strings and from arithmetic on them (`src/purchases/plans.ts`),
 * so the catalog can be translated without knowing a tier and stays true when
 * the tier changes.
 *
 * The CTA is one key per period rather than "Continue with {period}": the
 * period word inflects in half the catalog (German, Polish, Portuguese) and a
 * placeholder cannot carry a case ending.
 *
 * `paywall.review.quote` is a quotation from the App Store and is identical in
 * every language on purpose. Translating a customer's words would put
 * sentences in their mouth they did not write.
 */
export const paywall: Fragment = {
  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Close",

  "paywall.period.week": "Weekly",
  "paywall.period.month": "Monthly",
  "paywall.period.year": "Yearly",
  "paywall.per.week": "per week",
  "paywall.per.month": "per month",
  "paywall.billed.month": "billed {price} per month",
  "paywall.billed.year": "billed {price} per year",
  "paywall.save": "Save {pct}%",
  "paywall.intro.label": "Your first week",

  "paywall.cta.week": "Continue with weekly",
  "paywall.cta.month": "Continue with monthly",
  "paywall.cta.year": "Continue with yearly",

  "paywall.legal.week": "Renews at {price} per week. Cancel anytime.",
  "paywall.legal.month": "Renews at {price} per month. Cancel anytime.",
  "paywall.legal.year": "Renews at {price} per year. Cancel anytime.",
  "paywall.terms": "Terms",
  "paywall.privacy": "Privacy",
  "paywall.restore": "Restore",

  "paywall.included": "Included with Pro",
  "paywall.loading": "Loading prices",
  "paywall.retry": "Try again",

  "paywall.review.quote":
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  // First name and an initial: a customer's full surname on a sales screen is
  // more of her than she put in the review's byline.
  "paywall.review.name": "Tracy D.",
};
