# Subscription management and working reminders

Date: 2026-08-02
Status: approved, ready for planning

## Problem

Two unrelated things are broken for someone who has already paid, and for anyone
who turns on reminders.

**Subscriptions are a one-way door.** `presentPaywall` wraps
`RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: "pro" })`,
which returns `NOT_PRESENTED` once the `pro` entitlement is active. Every route
to the store is that one function, so a Pro subscriber cannot cancel from inside
the app and cannot see what they are paying for.
Replaying onboarding does not help — the paywall step there
calls the same function and silently shows nothing. Settings offers only
"Restore purchases".

**Reminders do not reliably fire.** Six defects, listed under Reminders below.
The worst is that enabling them from Settings schedules nothing at all.

## Scope

- A subscription entry point in Settings, backed by RevenueCat Customer Center.
- Fixes for the six reminder defects, plus enough visible state that "are my
  reminders working" is answerable without waiting six months for one to fire.

Out of scope: changing the paywall itself, the offering, prices, or what Pro
gates.

## Subscription management

### Approach

Use RevenueCat's Customer Center (`RevenueCatUI.presentCustomerCenter()`,
available in the installed `react-native-purchases-ui@10.6.0`). It is a native
sheet covering cancel, refund request, and missing purchase. Its contents are
configured in the RevenueCat dashboard, so there is no UI to build here.

Rejected: deep-linking to iOS Settings via `showManageSubscriptions()` — throws
the user out of the app. Rejected: a hand-built in-app subscription screen —
most work, and it would have to reimplement store rules Customer Center already
handles.

**Switching between monthly and annual is out of scope.** It needs
`pro_monthly` and `pro_annual` live in App Store Connect before RevenueCat will
offer them as change-plan targets, and both currently sit at
`store_status: MISSING_METADATA`. The CHANGE_PLANS path exists in the published
Customer Center config with no products behind it; it should be removed from
that config until the products are live, so subscribers are not shown a dead
row. Nothing in the app changes when it is added back later — Customer Center
picks it up from the dashboard.

### Behaviour

Pro subscribers never see the paywall again. Gated actions (Add vehicle, Service
intervals) simply work, and replaying onboarding skips the sell — Apple's review
guidelines take a dim view of selling someone a subscription they already own.
Cancelling and refunds happen only through Customer Center.

The Settings subscription row is state-dependent:

| State | Rows |
|---|---|
| Not Pro | `Upgrade to Pro` → paywall; `Restore purchases` |
| Pro | `Manage subscription` → Customer Center |

Restore folds into Customer Center for Pro subscribers — its "missing purchase"
flow is the same thing, and a subscriber who is already entitled has nothing to
restore.

### Components

`src/purchases/index.ts` gains two exports. Nothing existing changes:
`isPro`, `presentPaywall`, `restore`, and the `pro` entitlement constant keep
their current behaviour, and `app/index.tsx` and `app/onboarding/reminders.tsx`
are untouched.

- `presentCustomerCenter(): Promise<void>` — a thin wrapper over
  `RevenueCatUI.presentCustomerCenter()`. Rejects if the sheet cannot present;
  the caller shows the same store-unreachable message the other purchase paths
  use.
- `useIsPro(): boolean | null` — `null` while unknown, then the entitlement
  state. Seeded from `getCustomerInfo()`, kept current by
  `Purchases.addCustomerInfoUpdateListener`, which unsubscribes on unmount. The
  listener is what makes the Settings row flip the instant someone cancels or
  changes plan inside the sheet, with no manual refresh and no refetch on focus.

`useIsPro` returning `null` matters: rendering "Upgrade to Pro" for the
half-second before the entitlement resolves would show a subscriber an ad for
what they already bought. While `null`, the subscription rows are not rendered
at all; they appear once the entitlement resolves.

## Reminders

### Defects

1. **Enabling from Settings schedules nothing.** `app/settings.tsx` `onReminders`
   calls `requestPermission()` and never `rescheduleAll()`. Onboarding gets this
   right (`app/onboarding/reminders.tsx`). From Settings, nothing is scheduled
   until the next cold start or record write.
2. **Denial is a dead end.** Once iOS permission is hard-denied,
   `requestPermissionsAsync` returns denied without prompting. The screen prints
   "Reminders denied." and offers no way to reach iOS Settings, which is the
   only place the decision can be reversed.
3. **No visible state.** The button always reads "Enable reminders", whether
   reminders are off, on, or blocked.
4. **Deletes leave notifications behind.** `app/vehicle/[id].tsx` soft-deletes
   records and vehicles without rescheduling, so a car that was sold and deleted
   still announces that its oil change is due. `log.tsx` and `intervals.tsx`
   reschedule correctly; the delete paths were missed.
5. **The iOS 64-notification limit is unhandled.** `rescheduleAll` schedules one
   notification per vehicle per service type with a months interval — thirteen
   default types, so five vehicles reaches the cap. iOS silently drops the
   overflow, and which ones it drops is undefined.
6. **Notifications fire at arbitrary times.** `addMonths` in
   `src/schedule/index.ts` copies the hour, minute, and second from
   `performed_at`. A date chosen as a plain day is midnight UTC, which fires
   between 4pm and 7pm on the *previous* local day for US users; a service
   logged at 23:40 fires at 23:40.

Deliberately unchanged: services with a miles interval and no months interval
(`Spark Plugs: { miles: 60000 }`) never notify. `nextDue` returns no `dueAt` for
them and the app has no live odometer feed to trigger from. Mileage due state
still shows in the UI.

### Design

**`src/schedule/index.ts`** — `nextDue` normalizes `dueAt` to 9am local on the
due day rather than inheriting the clock time of `performed_at`. The date
arithmetic stays in UTC; only the final hour is pinned. 9am is early enough to
be actionable that day and late enough not to wake anyone.

**`src/notify/index.ts`** — two changes to `rescheduleAll` and one new export:

- Collect every candidate across all vehicles first, sort by `dueAt` ascending,
  then schedule at most 60. The soonest reminders survive deterministically
  instead of the OS dropping whichever ones it likes. The cap sits under 64 to
  leave headroom.
- `reminderStatus(): Promise<{ permission: "granted" | "denied" | "undetermined";
  count: number; nextAt?: string }>` — reads `getPermissionsAsync()` and
  `getAllScheduledNotificationsAsync()`. This is what makes the feature
  observable: it reports what iOS actually holds, not what the app believes it
  scheduled.

**`app/settings.tsx`** — the reminder row reflects `reminderStatus()`, refreshed
on focus and after any action:

| Permission | Row |
|---|---|
| undetermined | `Enable reminders` → request, then `rescheduleAll()` |
| granted | `Reminders on — 12 scheduled, next Sep 14` → re-runs `rescheduleAll()` |
| denied | `Reminders blocked — open iOS Settings` → `Linking.openSettings()` |

**`app/vehicle/[id].tsx`** — `rescheduleAll()` after record delete, after undo,
and after vehicle delete.

### Error handling

Every path already in place stays: notification and store calls are wrapped, and
a failure sets a message rather than throwing. `rescheduleAll` continues to
return early when permission is not granted, so it stays safe to call after any
write. A failure inside `reminderStatus` renders the row in its undetermined
form rather than blanking it.

## Testing

Pure, unit-tested in `tests/`:

- `nextDue` pins the due time to 9am local across month-end and DST boundaries,
  for records performed at midnight UTC, at 23:40, and mid-afternoon.
- The candidate sort-and-cap keeps the 60 soonest and drops the rest, including
  when the total is under, at, and over the cap.
- `useIsPro` state transitions, driven by a faked customer-info listener.

Device-only, verified on a TestFlight build:

- Settings shows `Manage subscription` for a subscriber and `Upgrade to Pro` for
  a free user, and the label flips after cancelling inside Customer Center.
- Customer Center opens and offers change-plan and cancel.
- Enabling reminders from Settings immediately reports a non-zero count and a
  plausible next date — the check that defect 1 is actually fixed.
- Deleting a vehicle drops its reminders from the count.

## Dashboard state

Checked against project `projf0d996da` on 2026-08-02. Customer Center is
configured: the MANAGEMENT screen carries all four paths — `MISSING_PURCHASE`,
`CHANGE_PLANS`, `CANCEL` (behind a feedback survey with a retention offer), and
`REFUND_REQUEST` — plus a `NO_ACTIVE` screen. Both `pro_monthly` and
`pro_annual` exist on the App Store app `app774f157580`.

Two gaps remain, neither of them code, and neither reachable through the
RevenueCat MCP tools — both need the dashboard by hand. The page is not in the
project's left nav; it is at
`app.revenuecat.com/projects/projf0d996da/customer-center`.

- `customer_center.change_plans` is `[]`, and the dashboard offers nothing to
  put in it: RevenueCat holds no synced store data for the two products —
  `subscription.duration` is null on both and each reports
  `store_status: MISSING_METADATA` — so there is nothing for a change-plan
  picker to list. Plan switching is deferred (see Approach); remove the
  CHANGE_PLANS path from the published config so it does not render as a dead
  row.
- `customer_center.support.email` is `""`, so the support path has no
  destination.

Both products do sit in App Store Connect subscription group "Pro", so nothing
blocks plan switching later beyond getting them live.
