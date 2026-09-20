import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { getVehicle } from "../db/vehicles";
import type { NudgeState } from "../onboarding/state";
import { isAskStep } from "../onboarding/routes";
import { readFindings } from "../onboarding/usePlan";
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
 * The seven notifications an unfinished setup gets.
 *
 * Onboarding asks for notification permission two questions into the quiz,
 * and the whole reason it asks that early is this: a user who quits partway
 * through has a half-written car in the database and no way to be told so.
 * Without these, permission granted mid-flow bought the app nothing until the
 * user came back on their own — the service reminders it schedules are all
 * months out, and a car with one logged service frequently has none at all.
 *
 * The cadence is front-loaded and then slow. The first two catch the
 * interruption — a call, a train stop — while the user still remembers what
 * they were doing. The next three are the days after, when the install is
 * still on the phone and the reason it was installed is still true. The last
 * two, at three weeks and a month, are for the user who kept the app without
 * opening it: the one who was never coming back has deleted it by then, and
 * iOS never delivers to a deleted app. Every message is a reason to come
 * back, never a complaint about not having done so — a nudge that sounds
 * disappointed is the one that gets notifications turned off.
 */
const NUDGES = [
  { id: "onboarding-resume-1", afterHours: 1, key: "first" },
  { id: "onboarding-resume-2", afterHours: 3, key: "second" },
  { id: "onboarding-resume-3", afterHours: 24, key: "third" },
  { id: "onboarding-resume-4", afterHours: 72, key: "fourth" },
  { id: "onboarding-resume-5", afterHours: 168, key: "fifth" },
  { id: "onboarding-resume-6", afterHours: 504, key: "sixth" },
  { id: "onboarding-resume-7", afterHours: 720, key: "seventh" },
] as const;

type NudgeKey = (typeof NUDGES)[number]["key"];
/** The catalog suffixes, in delivery order. Exported for the tests. */
export const NUDGE_KEYS: readonly NudgeKey[] = NUDGES.map((n) => n.key);

/** Exported so the schedule rebuild can clear them without knowing the copy. */
export const RESUME_NUDGE_IDS = NUDGES.map((n) => n.id);

/** How many resume nudges one run of onboarding is ever allowed to deliver.
 *  The list is the cap: seven defined, seven sent, for the reasons above. */
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
 * the nudges already delivered plus the ones this set has had time to deliver —
 * stops at the length of `NUDGES` and never arms again for this run. And a
 * launch that finds the user on the same step they were on when the current
 * set was armed leaves that set exactly where it is: opening the app and
 * closing it again is not progress and must not reset the clock.
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
 * The set minus the `skip` already delivered, minus any whose time has passed,
 * at the times counted from `armedAt`.
 *
 * The remainder, not a fresh set: someone who was nudged at three hours and
 * then got one screen further is owed the later three and nothing else, and a
 * relaunch on the same step is owed the ones still ahead of it at the moments
 * they were already promised for.
 */
async function arm(armedAt: number, skip: number, now: number): Promise<void> {
  const remaining = NUDGES.slice(skip).filter((n) => armedAt + n.afterHours * 60 * 60 * 1000 > now);
  if (remaining.length === 0) return;
  // Which of the two message sets depends on where the run stopped. A user parked
  // at the ask has answered everything and the plan is built; "finish setting
  // up your car" is untrue of them, and the message that brings them back is
  // the plan itself.
  const content = isAskStep(getOnboardingStep()) ? askCopy() : setupCopy();
  for (const nudge of remaining) {
    const at = armedAt + nudge.afterHours * 60 * 60 * 1000;
    await Notifications.scheduleNotificationAsync({
      identifier: nudge.id,
      content: { ...content[nudge.key], data: { dueAt: new Date(at).toISOString() } },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  }
}

type Copy = Record<NudgeKey, { title: string; body: string }>;

/** Every nudge's title and body from one key prefix, with the same variables
 *  in each. `override` swaps in a body computed some other way. */
function copyFrom(prefix: string, vars: Record<string, string | number>, override: Partial<Record<NudgeKey, string>> = {}): Copy {
  const out = {} as Copy;
  for (const key of NUDGE_KEYS) {
    out[key] = {
      title: tNamed(`${prefix}.${key}.title`),
      body: override[key] ?? t(`${prefix}.${key}.body`, vars),
    };
  }
  return out;
}

/** "Your plan is almost ready", for a run that stopped inside the quiz. Same
 *  shape as a service reminder, for the same reason: what the notification
 *  wants is in the title, and the car — which is as long as the user made it —
 *  is in the body. */
function setupCopy(): Copy {
  return copyFrom("system.resume", { vehicle: vehicleName() });
}

/**
 * The plan, for a run that stopped at the ask. Built from the same findings
 * the paywall was drawn from, so the count the notification names is the
 * count the user was shown. Only services with a history behind them count —
 * `pastDue` and `soon` — because a service the app has never been told about
 * is unknown, not late, and a notification that inflates the number is one
 * the user checks once and then distrusts. A car with nothing behind on it
 * gets the schedule sold instead of a zero.
 */
function askCopy(): Copy {
  const { vehiclePhrase: vehicle, plan } = readFindings();
  const count = plan.pastDue + plan.soon;
  return copyFrom(
    "system.resume.ask",
    { vehicle, count },
    count > 0 ? {} : { first: t("system.resume.ask.first.body.zero", { vehicle }) },
  );
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
