import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { getVehicle } from "../db/vehicles";
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

/** How many of a pair armed at `armedAt` iOS has had time to deliver by `now`.
 *  The app cannot ask iOS what it actually showed, and the trigger dates are the
 *  closest thing to a record of it. */
function elapsed(armedAt: number, now: number): number {
  return NUDGES.filter((n) => armedAt + n.afterHours * 60 * 60 * 1000 <= now).length;
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
  const previous = getNudgeState();
  const delivered = previous ? previous.before + elapsed(previous.armedAt, now) : 0;

  if (delivered >= LIFETIME) {
    // Spent. Anything still pending is cancelled rather than left to fire,
    // because the count includes triggers that have passed, and a pair armed
    // minutes ago on a stale step would otherwise deliver a third.
    await cancelOnboardingNudges();
    setNudgeState({ armedAt: now, step, before: LIFETIME });
    return;
  }

  // Armed already, and the user has not moved since. Whatever is pending is
  // still the right pair at the right times; touching it is the bug.
  if (previous && previous.step === step) return;

  await cancelOnboardingNudges();

  // The remainder, not a fresh pair. Someone who was nudged at two hours and
  // then got one screen further is owed the day-out nudge and nothing else.
  for (const nudge of NUDGES.slice(delivered)) {
    await Notifications.scheduleNotificationAsync({
      identifier: nudge.id,
      content: {
        title: tNamed(`system.resume.${nudge.key}.title`, { vehicle: vehicleName() }),
        body: t(`system.resume.${nudge.key}.body`),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(now + nudge.afterHours * 60 * 60 * 1000),
      },
    });
  }

  setNudgeState({ armedAt: now, step, before: delivered });
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
