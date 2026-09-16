# Custom paywall — design

Date: 2026-09-16
Status: approved in conversation, ready for implementation planning

## Why

The two money screens in onboarding are the argument; the price list is a
RevenueCat sheet presented over them. On 2026-09-16, the first day with
paid traffic (93 fresh installs), the sheet was where the funnel died:

- 65 of 93 reached the paywall route. The flow is not the problem.
- 59 saw the full-price sheet. **None bought.** None ever has: 0 of roughly
  130 presentations since launch.
- 58 landed on the trial screen. **23 tapped its button.** 35 sat on it and
  left without ever seeing the offer.
- The sheet takes a median **3.5 s** to appear after the tap; 11 of 89
  presentations stalled past 8 s. The user taps "see offer" and looks at
  their own screen.
- The sheet is cream on a `#0A0B0D` app. It says "Unlimited vehicles" to a
  user whose own screen, one tap earlier, said "2015 Corolla, 4 overdue,
  next due Oct 3". The argument is dropped at the ask.
- The sheet is opaque: no event for a plan tap, a hesitation, or a scroll.

The fix is to draw the price list ourselves and keep RevenueCat for
everything else. Purchases still go through `Purchases.purchasePackage`, so
the RevenueCat dashboard (customers, subscriptions, trials, MRR, churn,
cohorts, webhooks, Customer Center) is unchanged. What goes is
`RevenueCatUI.presentPaywall` and the dashboard paywall editor.

Two things were decided alongside this and are already done:

- `RESTORED` from the sheet was counted as a purchase whether or not the
  receipt held anything (`819369c`). Two installs on 09-16 "converted" that
  way. Fixed before this design; the funnel numbers above are post-fix.
- The `$0.99` first-week introductory offer on `pro_weekly` existed in the
  US only. It now exists in all 175 territories at Apple's equalised local
  tier (created 2026-09-16 via `asc subscriptions offers introductory
  import`). The "US only" comment in `src/purchases/index.ts` is stale and is
  corrected by this work.

## Decisions

| Question | Decision |
|---|---|
| Ladder | Two asks, as today. `paywall` sells the default offering at full price; `offer` sells the discount offering (`pro_weekly` with the intro week). Redesign both, keep the structure |
| Where the price list lives | Inline on both screens. No tap between the argument and the price |
| Scope | Everywhere. One `PlanPicker`; the five non-onboarding call sites open a full-screen `/paywall` route. `react-native-purchases-ui` stays for Customer Center only |
| Rollout | 100 %. Compared against the pre-period in PostHog, not A/B'd: at ~90 installs a day a paywall arm stacked on `onboarding_symptoms` would take weeks to read, and latency alone makes it not like-for-like |
| Paywall headline | `{name}, never miss a service.` Unnamed fallback `Never miss a service.` |
| CTA | `Continue with yearly` / `monthly` / `weekly`, following the selected plan. Both asks |
| Second-ask decline | `I'd rather pay full price`, returns to `paywall`. Replaces `No thanks` |
| Social proof | One card: the app's one App Store review (Tracy Deckenbach, 5★, 2026-09-01, US), excerpted. Left in English in every locale: it is a quotation |
| What we do not copy from the references | Countdown timers, "you will never see this again", "lowest price ever", gift-box reveals, a Free/Pro comparison table. The first four would not survive being checked (spec 2026-08-25, hard constraints); the last describes a tier the app does not have |
| Prices in copy | Never. Every figure on screen comes from StoreKit via the SDK, or is arithmetic on one |

## Architecture

### `src/purchases/plans.ts` (new)

Loads offerings once, shapes them for the screens, buys.

```ts
export type PlanPeriod = "week" | "month" | "year";

export type Plan = {
  id: string;                    // package identifier, e.g. "$rc_annual"
  period: PlanPeriod;
  package: PurchasesPackage;
  /** StoreKit's localised standard price string, e.g. "£79.99". */
  priceString: string;
  price: number;
  currency: string;
  /** The introductory price, only when this customer is eligible for it. */
  intro: { priceString: string; price: number; periods: number } | null;
  /** Standard price expressed per week and per month, formatted in the
   *  product's currency. Arithmetic on `price`, so it is right in every
   *  storefront and stays right when the tier changes. */
  perWeek: string;
  perMonth: string;
  /** Saving against the weekly plan in the same offering, whole percent.
   *  Undefined for the weekly plan itself and when there is no weekly. */
  savePct?: number;
};

export type OfferingId = "default" | typeof DISCOUNT_OFFERING;

/** Cached after the first successful load. `null` when the store could not
 *  answer; callers show a retry, never an empty picker. */
export function loadPlans(offering: OfferingId): Promise<Plan[] | null>;

/** Kicked off at boot so the screens render with prices already in hand. */
export function prefetchPlans(): void;

export type PurchaseResult = "purchased" | "dismissed" | "unavailable";
export function buy(plan: Plan, offering: OfferingId): Promise<PurchaseResult>;
```

- `loadPlans` calls `Purchases.getOfferings()`, takes `offerings.current` for
  `"default"` and `offerings.all[DISCOUNT_OFFERING]` for the discount, sorts
  packages year → month → week, and computes the derived fields with
  `Intl.NumberFormat(locale, { style: "currency", currency })`. Weeks per
  year 52, weeks per month 52 / 12.
- `intro` is filled from `product.introPrice` only when
  `Purchases.checkTrialOrIntroductoryPriceEligibility([productId])` returns
  `ELIGIBLE`. `UNKNOWN` (offline) is treated as eligible: StoreKit applies
  the offer itself at purchase time, so showing it to someone who turns out
  ineligible costs a surprised glance, hiding it from someone eligible costs
  the conversion.
- `buy` wraps `Purchases.purchasePackage`. `userCancelled` → `dismissed`;
  any other error → `unavailable`; success → `purchased`, then the same
  `isPro()` check and `purchase_without_entitlement` report `presentOffering`
  does today.
- Events, same names as today so history stays comparable:
  `paywall_shown { offering }` on screen mount, `paywall_presented
  { offering, ms }` when the picker has plans to draw (`ms` from mount; the
  stall watchdog and `paywall_stalled` keep their meaning: 8 s with no plans),
  `paywall_plan_selected { offering, plan }` on a card tap,
  `paywall_purchase_started { offering, plan }` on the CTA,
  `paywall_closed { offering, outcome, result, plan }` where `result` is
  `PURCHASED` | `CANCELLED` | `ERROR` | `DECLINED` (the screen's own decline
  link). `paywall_unavailable` / `paywall_unconfigured` unchanged.

### `src/purchases/index.ts`

- `presentOffering(identifier?)` and `presentPaywall()` keep their names and
  return types but no longer touch `RevenueCatUI`. They push `/paywall` (see
  below) and resolve with what it reports. `presentPaywall` keeps its
  `isPro` short-circuit.
- `PAYWALL_RESULT` and the `RevenueCatUI.presentPaywall*` imports go.
  `presentCustomerCenter` stays.
- The `INTRO_DAYS` docblock loses its "United States only" paragraph.

### `src/paywall/PlanPicker.tsx` (new)

```ts
type Props = {
  plans: Plan[];
  selected: string;                 // plan id
  onSelect: (id: string) => void;
  /** "cards": side by side, for two plans. "rows": stacked, for three. */
  layout?: "cards" | "rows";        // default: cards when plans.length <= 2
};
```

- Card / row: period label (`Yearly` etc., from the catalog), big price,
  unit line. Yearly and monthly show `perWeek` large with the standard
  `priceString` in a `billed {price} per year` caption underneath (Buffro);
  weekly shows its own `priceString`.
- `Save {n}%` chip from `savePct`. `Best value` tag above the plan with the
  highest `savePct`, which is also the default selection.
- A plan with `intro` shows the standard price struck through beside the
  intro price, caption `then {priceString} per week`.
- Selection: `color.hairlineLit` ring in the accent, check glyph. Press
  feedback as the rest of the design system (`Button`'s press language).
- Pure: no store calls, no state beyond what it is given. Rendered in tests
  from fixture plans.

### `src/paywall/BuyFooter.tsx` (new)

CTA `Continue with {period}`, busy state, one legal line built from the
selected plan (`Renews at {priceString} per {period}. Cancel anytime.`;
with an intro: `{intro} for the first week, then {priceString} per week.
Cancel anytime.`), then `Terms · Privacy · Restore`. Restore calls
`restore()` and reports `restore_attempted { source }` as the trial screen
does today. Everything Apple looks for on a subscription screen is on this
one component, and one screen test pins it.

### `app/onboarding/paywall.tsx`

One page, no scroll on a 4.7" screen. Top to bottom:

1. Title `offer.paywall.title[.named]` → `{name}, never miss a service.`
   Subtitle unchanged.
2. Three check rows from `useOnboardingFindings()`: the vehicle by name and
   how many services it now tracks; what is overdue today and the next
   warning date (`nextUp`); the reminder promise. The gauges go; their
   numbers stay, as sentences.
3. A one-line chip strip of the feature titles the trial screen already
   lists (`offer.trial.gets.*`), wrapping to two lines at most.
4. The review card: five stars, the excerpt, `Tracy Deckenbach`, `App Store`.
5. `PlanPicker` on the default offering, `rows` layout.
6. `BuyFooter`. Under it a text link `Not now` that advances to `offer` and
   reports `paywall_closed { result: "DECLINED" }`. Back arrow as today.

Purchase → `finish("paid")` and `recordReviewEvent("purchase")`, unchanged.

### `app/onboarding/offer.tsx`

1. Title `offer.trial.title[.named]`, unchanged.
2. `PlanPicker` with the discount offering's single plan, `cards` layout
   at full width, intro strike-through when eligible.
3. The three `offer.trial.*` rows (today / runs / ends), unchanged.
4. `BuyFooter`. Under it, before decline: `I'd rather pay full price`
   (`offer.trial.decline`, reworded), which goes back to `paywall`. After
   decline, or when relaunched with `walled=1`: the link becomes Restore
   and Back is hidden, exactly the wall behaviour shipped today.

Purchase → `paid("trial")` as today. `offer_declined` keeps firing.

### `app/paywall.tsx` (new route)

Full-screen, `headerShown: false`, own top inset. Params
`offering=default|discount`, `source=<caller>`. Close glyph top-right.
Body: title `Wrenchy Pro`, the same chip strip, the review card,
`PlanPicker`, `BuyFooter`. Resolves the pending `presentPaywall` /
`presentOffering` promise through a module-level resolver in
`src/paywall/present.ts` (`open(offering, source): Promise<PurchaseResult>`
pushes the route and parks the resolver; the route calls `settle(result)` on
purchase or close; a second `open` while one is parked settles the first as
`dismissed`). Purchases here never touch onboarding state.

`app/trial.tsx` keeps its contract (mount, present, leave) by calling
`presentOffering(DISCOUNT_OFFERING)` as it does now; nothing else there
changes. `index.tsx`, `settings.tsx`, `insights.tsx`, `winback.tsx` are
unchanged except that the sheet they awaited is now a screen.

### `app/_layout.tsx`

`boot("plans", prefetchPlans)` after `boot("purchases", initPurchases)`.
Register the `paywall` route with `headerShown: false`, `presentation:
"fullScreenModal"`.

### Copy

New keys in `offer` and a new `paywall` fragment, mirrored across the 16
catalogs with real translations except the review, which is quoted verbatim
everywhere:

- `offer.paywall.title` / `.named` reworded.
- `offer.paywall.point.tracked` `{vehicle} now tracks {count} services`,
  `.overdue` `{count} overdue today, next warning {date}` (with a zero
  variant), `.reminders` `A reminder before each one, by date or distance`.
- `offer.paywall.notNow` `Not now`.
- `offer.trial.decline` → `I'd rather pay full price`.
- `paywall.period.week|month|year` `Weekly|Monthly|Yearly`,
  `paywall.cta` `Continue with {period}`, `paywall.billed` `billed {price}
  per {period}`, `paywall.save` `Save {pct}%`, `paywall.bestValue`
  `Best value`, `paywall.then` `then {price} per week`,
  `paywall.legal.standard`, `paywall.legal.intro`, `paywall.cancel`
  `Cancel anytime`, `paywall.terms`, `paywall.privacy`, `paywall.restore`,
  `paywall.close`, `paywall.title` `Wrenchy Pro`, `paywall.review.quote`,
  `paywall.review.name`, `paywall.review.source` `App Store`.
- No em or en dashes anywhere. Typographic apostrophes.

### Removed

`RevenueCatUI.presentPaywall`, `presentPaywallIfNeeded`, `PAYWALL_RESULT`,
the `withStallWatch` wrapper around a native call (the watchdog logic moves
to the screen, timing "plans loaded" instead of "sheet returned"), the
`Gauge` block on `paywall.tsx`. The two RevenueCat dashboard paywalls are
left in place, unattached to nothing; they are simply not presented.

## Testing

`tests/plans.test.ts` (logic): shaping from a fixture `PurchasesOfferings`
(three packages, then one); `perWeek` / `perMonth` / `savePct` arithmetic in
USD, GBP, JPY (zero-decimal); `intro` present only on `ELIGIBLE` and
`UNKNOWN`; `buy` mapping of `userCancelled`, other errors, success, and the
`purchase_without_entitlement` report; `loadPlans` returns `null` and
reports `paywall_unavailable` when `getOfferings` throws.

`tests/paywall-present.test.ts` (logic): `open` resolves with what `settle`
is given; a second `open` settles the first as `dismissed`; `settle` with
nothing parked is a no-op.

`tests/paywall-screens.test.tsx` (screens): `PlanPicker` renders every plan,
the default selection is the highest `savePct`, a tap changes the selection
and fires `paywall_plan_selected`; the strike-through appears only with
`intro`; `BuyFooter` shows price, period, `Cancel anytime`, Terms, Privacy
and Restore for every plan (the compliance test); `OnboardingPaywall` prints
the named title, the vehicle name, the review, and no `/free app/i`;
`OnboardingOffer` shows `I'd rather pay full price` before decline and
Restore after. Existing assertions that pin paywall copy are updated to the
new copy, not weakened.

`tests/onboarding-screens.test.tsx`: the em-dash sweep now covers the two
new components; the `See Wrenchy Pro` assertion becomes `Continue with`.

`tests/i18n.test.ts`: key and placeholder parity holds across 16 locales.

## Out of scope

- Price changes. The ladder stays $79.99 / $9.99 / $2.99 as configured.
- A comparison table, FAQ, or a second review.
- A/B testing the paywall against the sheet.
- Android.
- Removing `react-native-purchases-ui` from the bundle (Customer Center).
