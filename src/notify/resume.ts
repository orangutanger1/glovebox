import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { getVehicle } from "../db/vehicles";
import { isOnboarded, getOnboardingVehicleId, tNamed } from "../onboarding";

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

/**
 * Schedules both, or neither.
 *
 * A no-op once onboarding is finished, which is what makes this safe to call
 * from `rescheduleAll` on every launch and after every write: the one state
 * worth checking is the one the notification is about.
 *
 * Existing copies are cancelled first, so a user who quits, comes back, gets
 * two screens further and quits again is nudged from the second exit rather
 * than the first. Fixed identifiers are what make that possible; without them
 * the only way to clear one would be to cancel everything, including the
 * service reminders this app exists to send.
 */
export async function scheduleOnboardingNudges(now: number = Date.now()): Promise<void> {
  await cancelOnboardingNudges();
  if (isOnboarded()) return;

  const id = getOnboardingVehicleId();
  const vehicle = id ? getVehicle(id) : null;
  const name = vehicleSentenceName(vehicle?.name ?? t("system.vehicle.fallback"));

  for (const nudge of NUDGES) {
    await Notifications.scheduleNotificationAsync({
      identifier: nudge.id,
      content: {
        title: tNamed(`system.resume.${nudge.key}.title`, { vehicle: name }),
        body: t(`system.resume.${nudge.key}.body`),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(now + nudge.afterHours * 60 * 60 * 1000),
      },
    });
  }
}

/**
 * Called the moment the flow ends, because the alternative is a notification
 * telling a user who has just subscribed to finish setting up the car they
 * finished setting up. Cancelling by identifier rather than clearing the queue:
 * by this point the schedule the flow built is already in it.
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
