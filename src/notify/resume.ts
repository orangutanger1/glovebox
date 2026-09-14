import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { getVehicle } from "../db/vehicles";
import type { NudgeState } from "../onboarding/state";
import {
  isOnboarded,
  getOnboardingVehicleId,
  getOnboardingStep,
  getNudgeState,
  setNudgeState,
  clearNudgeState,
  tNamed,
} from "../onboarding";

/**
 * The two notifications an unfinished setup gets.
 *
 * Onboarding asks for notification permission immediately after the results
 * screen, five screens before the flow ends, and the whole reason it asks that
 * early is this: a user who quits partway through has a half-written car in the
 * database and no way to be told so. Without these, permission granted mid-flow
 * bought the app nothing until the user came back on their own — the service
 * reminders it schedules are all months out, and a car with one logged service
 * frequently has none at all.
 *
 * Two, not five. The first catches the interruption — a call, a train stop —
 * while the user still remembers what they were doing. The second catches the
 * next day, which is the last point at which "finish setting up your car" is a
 * reminder rather than an advert. Anything after that is a third ask for
 * attention from someone who has now twice declined to give it, and the app
 * that sends it is the app that gets notifications turned off entirely.
 */
const NUDGES = [
  { id: "onboarding-resume-1", afterHours: 2, key: "first" },
  { id: "onboarding-resume-2", afterHours: 24, key: "second" },
] as const;

/** Exported so the schedule rebuild can clear them without knowing the copy. */
export const RESUME_NUDGE_IDS = NUDGES.map((n) => n.id);

/** How many resume nudges one run of onboarding is ever allowed to deliver.
 *  The list is the cap: two defined, two sent, for the reasons above. */
const LIFETIME = NUDGES.length;

/** How many of the nudges armed at `armedAt` iOS has had time to deliver by
 *  `now`. The app cannot ask iOS what it actually showed, and the trigger dates
 *  are the closest thing to a record of it.
 *
 *  Only the nudges that were actually armed are counted — `arm` skips the
 *  `before` already delivered, so a pair re-armed after the first fired holds
 *  the day-out one alone. Counting the two-hour offset against that arming
 *  read "both delivered" two hours in and cancelled the one still pending. */
function elapsed(armedAt: number, before: number, now: number): number {
  return NUDGES.slice(before).filter((n) => armedAt + n.afterHours * 60 * 60 * 1000 <= now)
    .length;
}

/**
 * Whether iOS is still holding a pair armed by a build that had no lifetime
 * count. Tolerant of a platform that will not answer: an install we cannot ask
 * is treated as new, which grants a quota rather than spending one.
 */
async function hasPendingNudges(): Promise<boolean> {
  try {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    return pending.some((request) => RESUME_NUDGE_IDS.includes(request.identifier as never));
  } catch {
    return false;
  }
}

/**
 * Spends the quota of an install that was already mid-flow under the old build.
 *
 * Those are the installs that were in the loop, and how many nudges they have
 * already had is not recoverable: iOS does not report deliveries, and the old
 * code re-armed from the current moment on every launch, so the pair it left
 * pending records when the user last opened the app rather than how many fired.
 * Most of this cohort is past two. Seeding them spent is the answer that cannot
 * send a third; the cost is the user who abandoned twenty minutes ago, had one,
 * and now gets no second.
 *
 * Three conditions together, because a fresh install must not match: no record
 * of its own, a step already recorded, and a pair of the old identifiers still
 * pending. A new install reaches "step recorded and pending" only once the new
 * code has armed it, and arming writes the record — so this stops matching
 * after one launch and needs no migration flag of its own.
 */
async function adoptLegacyRun(step: string | null, now: number): Promise<NudgeState | null> {
  if (step === null) return null;
  if (!(await hasPendingNudges())) return null;
  const adopted: NudgeState = { armedAt: now, step, before: LIFETIME };
  setNudgeState(adopted);
  return adopted;
}

/**
 * Arms the resume nudges, at most twice per run of onboarding.
 *
 * A no-op once onboarding is finished, which is what makes this safe to call
 * from `rescheduleAll` on every launch and after every write.
 *
 * Safe to call, but no longer *effective* on every call, and that is the point.
 * This used to cancel and re-arm from the current moment unconditionally, and
 * `rescheduleAll` runs at every cold start — so an abandoned flow was nudged at
 * two hours, opened by the notification it sent, re-armed by that very launch,
 * and nudged again two hours later, forever. Two pending at a time and no limit
 * at all on how many were delivered. The module doc above explains why the
 * third ask is the one that gets notifications turned off; nothing in the code
 * was enforcing it.
 *
 * So two things are checked before anything is scheduled. The lifetime count —
 * the nudges already delivered plus the ones this pair has had time to deliver —
 * stops at two and never arms again for this run. And a launch that finds the
 * user on the same step they were on when the current pair was armed leaves that
 * pair exactly where it is: opening the app and closing it again is not progress
 * and must not reset the clock.
 *
 * Re-arming on a *changed* step is kept, because that was the original intent
 * and it is still right: a user who quits, comes back, gets three screens
 * further and quits again should be nudged from the second exit. What they get
 * then is the remainder of the two, not two more.
 */
export async function scheduleOnboardingNudges(now: number = Date.now()): Promise<void> {
  if (isOnboarded()) {
    await cancelOnboardingNudges();
    clearNudgeState();
    return;
  }

  const step = getOnboardingStep();
  // An install with no record is either new or was mid-flow under the build
  // that had no lifetime count. Only the second kind is left holding a pair.
  const previous = getNudgeState() ?? (await adoptLegacyRun(step, now));
  const delivered = previous
    ? previous.before + elapsed(previous.armedAt, previous.before, now)
    : 0;

  if (delivered >= LIFETIME) {
    // Spent. Anything still pending is cancelled rather than left to fire,
    // because the count includes triggers that have passed, and a pair armed
    // minutes ago on a stale step would otherwise deliver a third.
    await cancelOnboardingNudges();
    setNudgeState({ armedAt: now, step, before: LIFETIME });
    return;
  }

  // Armed already, and the user has not moved since. The pair is still the
  // right pair at the right times, so the clock is not touched — but the
  // notifications themselves are re-armed at those same times, because the
  // caller has usually just wiped them: `rescheduleAll` cancels every pending
  // notification before it gets here. Returning early kept the bookkeeping and
  // lost the nudges, so any launch mid-flow silently switched them off. The
  // identifiers are fixed, so re-arming one that is still pending replaces it
  // rather than doubling it.
  if (previous && previous.step === step) {
    await arm(previous.armedAt, previous.before, now);
    return;
  }

  await cancelOnboardingNudges();
  await arm(now, delivered, now);
  setNudgeState({ armedAt: now, step, before: delivered });
}

/**
 * The pair minus the `skip` already delivered, minus any whose time has passed,
 * at the times counted from `armedAt`.
 *
 * The remainder, not a fresh pair: someone who was nudged at two hours and then
 * got one screen further is owed the day-out nudge and nothing else, and a
 * relaunch on the same step is owed the ones still ahead of it at the moments
 * they were already promised for.
 */
async function arm(armedAt: number, skip: number, now: number): Promise<void> {
  for (const nudge of NUDGES.slice(skip)) {
    const at = armedAt + nudge.afterHours * 60 * 60 * 1000;
    if (at <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: nudge.id,
      content: {
        // Same shape as a service reminder, for the same reason: what the
        // notification wants is in the title, and the car — which is as long
        // as the user made it — is in the body.
        title: tNamed(`system.resume.${nudge.key}.title`),
        body: t(`system.resume.${nudge.key}.body`, { vehicle: vehicleName() }),
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  }
}

/** The half-written car the nudge is about, or the honest stand-in for a run
 *  that has not reached the vehicle step yet. */
function vehicleName(): string {
  const id = getOnboardingVehicleId();
  const vehicle = id ? getVehicle(id) : null;
  return vehicleSentenceName(vehicle?.name ?? t("system.vehicle.fallback"));
}

/**
 * Called the moment the flow ends, because the alternative is a notification
 * telling a user who has just subscribed to finish setting up the car they
 * finished setting up. Cancelling by identifier rather than clearing the queue:
 * by this point the schedule the flow built is already in it.
 *
 * Only the pending requests. The record of what was already delivered is left
 * alone, because this is also called from inside `scheduleOnboardingNudges`,
 * where clearing the count would hand every caller a fresh quota of two.
 */
export async function cancelOnboardingNudges(): Promise<void> {
  for (const id of RESUME_NUDGE_IDS) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Nothing scheduled under that identifier. iOS treats cancelling an
      // absent request as a no-op; this catch is for the platforms that don't.
    }
  }
}
