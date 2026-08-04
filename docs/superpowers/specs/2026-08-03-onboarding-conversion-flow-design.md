# Glovebox — Onboarding as a Conversion Flow

Date: 2026-08-03
Status: implemented
Supersedes: §4 of `2026-08-01-glovebox-ui-ux-and-onboarding.md` (the six-screen setup flow)

---

## 0. What changed and why

The shipped flow was six screens of setup: welcome, car, mileage, one service,
a summary, a notification ask, then a native paywall fired from the last step.
It collected everything the app needs and then asked for money having never
once told the user what the money was for. Every screen was a form.

The replacement is modelled on the structure that consumer subscription apps
converge on — quiz, computed result, cost of the problem, the answer to it,
evidence, features, plan, offer, second offer. That structure works because it
spends the user's attention in the right order: small commitments first, a
payoff they did not have before, and the price last, when the thing being
priced is concrete.

Three things about the structure are usually fake, and all three are the reason
the previous spec rejected it outright (§3.2, "Pre-paywall *we built your plan*
loader: **No.** A fake loading bar on an app whose entire pitch is honesty is a
self-inflicted wound"). The structure is adopted here with those three replaced
rather than imported:

| Usual version | What ships here |
|---|---|
| Decorative quiz questions | Six questions; four write rows the app reads, two change what the flow computes and shows |
| Eight-second fake progress ring | Four lines of real computed output, ~1.8s total, then it replaces itself |
| Five-star wall and an invented user count | 1,715 real App Store reviews of the nine competing apps, tallied by complaint, none of them about Glovebox and none of them quoted |

## 1. The flow

```
welcome → intro → [vehicle · odometer · drive · service · tracking · worry]
        → analyzing → results → symptoms(×3) → help → reviews → features
        → plan → paywall → offer
```

One ordered array, `src/onboarding/flow.ts`, is the whole navigation model.
Back is the entry before you, Continue is the entry after you, and no screen
hard-codes the name of its neighbour. Inserting a screen is a one-line edit.

Two facts fall out of that array rather than being restated per screen:

- **Quiz position.** `quizStep(route)` returns `{step, total}` for the six
  question screens and `null` for everything else, which is what decides
  whether a screen shows "QUESTION 3 / 6" and a lamp row. The narrative screens
  deliberately show no progress: a counter over a finding about the user's own
  car invites them to measure how much is left rather than read it, and there
  is nothing honest to count anyway, since the flow can end at the paywall.
- **Transient screens.** `analyzing` advances itself and is skipped by
  `previousRoute`, so Back from the results lands on the last question instead
  of bouncing off a screen whose only behaviour is to move forward again.

`resumeRoute()` maps the two retired step names (`ready`, `reminders`) onto
their nearest survivors and sends anything unrecognised to `welcome`. Without
it, an install sitting mid-flow on a previous build would be redirected on
every launch to a route that no longer exists.

## 2. The quiz

| Screen | Writes | Read by |
|---|---|---|
| `vehicle` | `vehicles` row (year, make, model) | everything |
| `odometer` | `vehicles.odometer` | mileage intervals, projection |
| `drive` | `answers.drive` | `MILES_PER_YEAR` → dates for mileage-only services |
| `service` | a `service_records` row | every due date |
| `tracking` | `answers.tracking` | picks one symptom card and its answer |
| `worry` | `answers.worries` | picks the remaining symptom cards |

`drive` is the question that earns the flow's honesty claim. A service like
spark plugs at 60,000 miles has no date of its own; the annual-mileage answer
turns the remaining miles into one, and the plan takes whichever comes first,
the calendar date or the projected one. A projected date is labelled "about" so
it is never confused with one computed from a logged service.

`answers` live in one `app_state` JSON blob (`ONBOARDING_ANSWERS_KEY`) rather
than three rows, so a resumed flow cannot hold half an opinion. `parseAnswers`
is tolerant by construction: a value renamed by a later version, a key that no
longer exists or a half-written blob degrades to "not answered", because this
sits on the launch path.

## 3. The findings

`src/onboarding/plan.ts` is pure over vehicle mileage, records, intervals and
answers. Every screen from `analyzing` to `paywall` renders the same object, so
they cannot disagree about how many services are due.

- A service with nothing on file is **due**, not unknown — the same direction
  the quiz's "not sure" answer errs in.
- `Other` is excluded. It is a real interval for one record and reads as a
  service called Other in a list.
- Sort is worst-first, and undated rows sink beneath dated ones inside a
  status: "your brakes are 400 miles over" outranks "we have never seen a brake
  inspection" as something to act on today.

`src/onboarding/pain.ts` picks exactly three findings, deterministically, in
this priority: services actually overdue → what the user says they use today →
what they said they are trying to avoid → services with nothing on file →
a fixed fallback tail. Each card carries its own `fix`, and the screen after
the symptoms answers the same three cards in the same order — pain and answer
cannot drift apart because they are the same object.

The overdue count on the card deliberately excludes never-logged services, even
though the plan counts them as due. "Nine services are overdue" to someone who
has told us about one of them is technically our model and rhetorically a lie;
the two facts get one card each.

## 4. Red

`tone="alarm"` on `OnboardingScreen` washes the housing red, and the symptoms
screens are the only place it is used. Red is otherwise reserved for overdue
and destructive, which is exactly why it works here: this is the one moment in
the product that is supposed to read as a warning lamp coming on. The lamp is
lit on the symptoms cards and out on the screen that answers them — the same
panel with the alarms cleared, which is the argument made without a sentence.

## 5. The reviews screen

Glovebox has not shipped. It has no ratings, no testimonials and no user count,
and inventing them is the one thing a product whose whole pitch is "your
records are safe here" cannot come back from.

What it has is `research/reviews.json`: 1,715 App Store reviews of the nine
apps a new user would otherwise be choosing between, 691 of them one to three
stars. `src/onboarding/evidence.ts` holds the theme tallies (179 lost records
or failed syncs, 87 price or paywall, 83 forced account, 59 crashes),
reproducible from `research/reviews.py`, each paired with what Glovebox does
about it. Nothing is quoted: those reviews were written about somebody else's
app, and printing the words would borrow the reviewer as well as the evidence.
The screen says out loud that none of them are about Glovebox.

## 6. The two paywalls, and where the trial lives

`presentPaywall` (entitlement-gated, used by the garage and by Settings) is
unchanged. Onboarding uses `presentOffering(identifier?)`, which does not check
the entitlement first — the paywall here is a screen the user navigated to, and
a screen that renders nothing is a dead end.

**The first paywall has no free trial. The second is nothing but the trial.**

That cannot be done by hiding words. On the App Store a free trial is an
*introductory offer* attached to a product, and StoreKit applies it at checkout
to anyone eligible — a paywall that omits the wording still gives the trial
away. The two paywalls therefore sell different products, which the App Store
catalogue already supports as configured:

| Product | ID | Introductory offer | Offering |
|---|---|---|---|
| `pro_monthly` | 6797106420 | none | default / current |
| `pro_annual_standard` | 6797750757 | none | default / current |
| `pro_annual` | 6797106382 | 3-day free trial | `discount` |

Verified with `asc subscriptions offers introductory list --subscription-id
6797106382 --paginate`: 174 rows, every one `THREE_DAYS` / `FREE_TRIAL` /
1 period, and zero rows on the other two. No promotional or win-back offers
exist on any of them. Buying a product with no introductory offer does not
consume the subscription group's eligibility, so a user who says no to the
first paywall is still eligible at the second.

`pro_annual_standard` was created for this design so the first paywall can
still offer an annual plan. It mirrors `pro_annual` exactly — 19.99 USD base,
equalized across 175 price territories, on sale in the same 174 (China priced
but not sold, matching), group level 2 so the two annuals are crossgrades
rather than an upgrade path between themselves:

```
asc subscriptions create --group-id 22280869 --product-id pro_annual_standard \
  --reference-name "Glovebox Pro (Annual, no trial)" --subscription-period ONE_YEAR
asc subscriptions update --id 6797750757 --group-level 2 --review-note "…"
asc subscriptions localizations create --subscription-id 6797750757 --locale en-US \
  --name "Glovebox Pro (Annual)" --description "Unlimited vehicles and custom service intervals"
asc subscriptions pricing availability edit --subscription-id 6797750757 \
  --available-in-new-territories --territories "<174>,CHN"
asc subscriptions pricing equalize --subscription-id 6797750757 \
  --base-price 19.99 --base-territory "United States" --confirm
asc subscriptions pricing availability edit --subscription-id 6797750757 \
  --available-in-new-territories --territories "<174>"
```

CHN is added for the equalize step and removed after: equalization refuses to
run against partial territory coverage, and `pro_annual` is itself priced in
China without being sold there. It sits at `MISSING_METADATA` until an App
Review screenshot is uploaded — `asc subscriptions review screenshots create
--subscription-id 6797750757 --file <png>` — which needs a capture of the
paywall from a device.

`TRIAL_DAYS` in `src/purchases/index.ts` is the single source for copy naming
the length, and must match the catalogue above. Nothing names a price: the
paywall renders the price and Apple's required renewal disclosure.

`PaywallOutcome` distinguishes `dismissed` from `unavailable` because the
routing depends on it: a user who saw a price and closed it has earned the
trial; a paywall that could not present (no API key, no network, products not
yet fetchable) has told them nothing to reconsider. The trial screen is also
only reachable when a `discount` offering actually exists in the RevenueCat
dashboard, checked before the navigation, so it never promises a trial that
cannot be started.

`Start with the free app` on the paywall goes straight into the garage. The
trial is for someone who looked at the price, not for someone who declined to.

## 6a. Churn: what iOS actually gives you

**There is no app-deletion hook on iOS.** The home-screen long press and its
Delete App button belong to SpringBoard. The app is not running, is sent
nothing before or after, and has no callback to register. Nothing here
pretends otherwise. What the app *can* do is put its own rows in that same
menu, next to the button that deletes it.

The three moments the app gets with somebody leaving:

1. **A finger on the app icon** — the home-screen quick actions menu, the one
   that contains Delete App. `src/quickactions/index.ts` puts two rows in it:
   "Try Pro free" and "Send feedback". Set dynamically through
   `expo-quick-actions` rather than declared in Info.plist, because the trial
   row must not appear for a subscriber or when no `discount` offering exists —
   `syncQuickActions(!isPro && hasOffer)` reconciles it on every launch. Two
   rows, not Apple's permitted four: padding the list would push Delete App
   down a menu the user opened deliberately.
2. **A subscriber cancelling** — the Customer Center cancel path. RevenueCat
   renders it; the dashboard can put a custom row and a promotional offer on
   it. `onManagementOptionSelected` receives the custom row's URL (RevenueCat
   does not open it, the app does) and points it at the feedback form;
   `onPromotionalOfferSucceeded` banks the review signal.
3. **A churned free user returning** — the launch after the absence.
   `shouldOfferWinback` in `src/winback/state.ts` decides: away ≥ 14 days
   (measured from the previous launch, which `recordOpen` returns before
   overwriting), not a subscriber, a `discount` offering exists, and not asked
   in the last 180 days. A clock that moved backwards reads as "not away"
   rather than as an enormous absence.

Taps are handled in the root layout with `useQuickActionCallback`, not the
package's `useQuickActionRouting` — its own source warns against the latter in
a root layout, and it would hand an `https` href to the router. A feedback row
opens Safari; it is not a route. `QUICK_ACTION_TRIAL` navigates to
`app/trial.tsx`, which is not a screen: it mounts, presents the trial offering,
and replaces itself with the garage. The user already read the offer — it was
the row they tapped — so a page in front of the paywall asks them to agree
twice.

Two orderings matter. A launch that came from the menu suppresses the win-back
(`QuickActions.initial` short-circuits the gate), because replacing a
destination the user chose with one they did not would also burn the win-back's
180-day cooldown. And a quick action mid-onboarding is ignored outright: a user
halfway through setup has no plan to buy Pro for, and a paywall there abandons
a half-written car.

`app/winback.tsx` is the return screen, built from the existing `Screen`,
`Panel`, `ListRow` and `Button`. It offers the feedback form as a tappable row
and the trial as the primary button, side by side rather than in sequence — a
survey standing between a user and a free trial is a survey that costs money.
It stamps `winback_shown_at` on arrival, so force-quitting it still counts as
having been asked.

**Feedback goes to a hosted form** (`src/feedback/index.ts`), opened with
`Linking.openURL`. The app has no server and no support address, so an in-app
form would write the answer to a phone only its owner can read. No in-app
browser: `expo-web-browser` is a native dependency and a new build for one
link.

## 7. Notification priming

The permission ask moved onto the plan screen, next to six dated services. iOS
gives an app exactly one system prompt and opt-in collapses when it fires
without context; "allow notifications?" on its own screen is context-free by
construction. "Not now" is a real answer and is never re-asked.

## 8. Files

New: `src/onboarding/flow.ts`, `plan.ts`, `pain.ts`, `evidence.ts`, `nav.ts`,
`usePlan.ts`, `src/design/ChipRow.tsx`, `src/winback/{state,index}.ts`,
`src/feedback/index.ts`, `src/quickactions/index.ts`, `app/winback.tsx`,
`app/trial.tsx`, and the onboarding screens `intro`, `drive`, `tracking`,
`worry`, `analyzing`, `results`, `symptoms`, `help`, `reviews`, `features`,
`plan`, `paywall`, `offer`.

Changed: `src/onboarding/state.ts` (answers), `index.ts` (answers, replay
clears them), `Screen.tsx` (route-addressed, alarm tone, back override),
`src/purchases/index.ts` (offering-aware presentation, `TRIAL_DAYS`, Customer
Center callbacks), `app/_layout.tsx` (validated resume, win-back gate, quick
actions, `winback` and `trial` routes), `app/settings.tsx` (Customer Center
callbacks), `welcome`, `vehicle`, `odometer`, `service`.

Removed: `app/onboarding/ready.tsx` and `reminders.tsx`, absorbed into
`results` and `plan`.

Dependency: `expo-quick-actions@6.0.2`. Native, so the quick actions ship on a
new build and not over the air.

Tests: `onboarding-flow`, `onboarding-plan`, `onboarding-pain`,
`onboarding-run` (walks the quiz through real SQLite and asserts the findings),
`winback-state`, plus answer parsing in `onboarding-state`.

App Store Connect: `pro_annual_standard` (6797750757) created — see §6.
Outstanding there: an App Review screenshot, then submission.

RevenueCat dashboard, outstanding: current offering = `pro_monthly` +
`pro_annual_standard` with a paywall; offering `discount` = `pro_annual` with a
paywall; optionally a custom feedback row and a promotional offer on the
Customer Center cancel path.
