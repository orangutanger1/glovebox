import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { serviceName } from "../schedule/names";
import { formatDate, t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { tNamed } from "../onboarding";
import { collectCheckins, collectDocumentAlerts, collectReminders } from "./collect";
import { documentName } from "../documents/names";
import { MAX_SCHEDULED, scheduledAt, selectReminders } from "./select";
import { scheduleOnboardingNudges } from "./resume";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export { MAX_SCHEDULED, selectReminders, type Reminder } from "./select";
export {
  collectReminders,
  collectCheckins,
  collectDocumentAlerts,
  nextReminder,
  nextReminders,
} from "./collect";
export { scheduleOnboardingNudges, cancelOnboardingNudges, RESUME_NUDGE_IDS } from "./resume";

export type ReminderStatus = {
  permission: "granted" | "denied" | "undetermined";
  count: number;
  nextAt?: string;
};

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Whether asking iOS would actually put an alert on the glass.
 *
 * iOS is the only honest record of this. The app used to keep its own flag and
 * skip the request whenever the flag was set, which is how "Turn on reminders"
 * came to do nothing visible: an earlier build stamped the flag on a screen
 * that only recorded an intention and deferred the real prompt, so the tap that
 * promises the alert found the flag already set and asked for nothing. A local
 * flag can only ever be a guess about a fact the system already holds.
 *
 * `canAskAgain` is false once the user has denied, and `requestPermissionsAsync`
 * would return denied without prompting in that case anyway; this just means the
 * caller can tell "nothing will appear" from "nothing appeared".
 */
export async function canAskPermission(): Promise<boolean> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return status !== "granted" && canAskAgain;
}

/**
 * The rebuild in progress, if any. Each call queues behind the previous one.
 *
 * Fifteen call sites fire `rescheduleAll` without awaiting it — a logged
 * service and a Back, a delete and another delete, Settings mounting while
 * its reminder row is tapped. Two rebuilds in flight at once interleaved as
 * clear, clear, schedule, schedule: the second clear wiped the first run's
 * half-built queue and then both runs scheduled the rest, so iOS ended up
 * holding every reminder twice. Service reminders carry no identifier, so
 * nothing on the OS side collapsed the copies.
 *
 * Queued rather than coalesced: the later call was made after a later write,
 * and it must run against those rows. A run that fails does not poison the
 * chain — the next caller starts fresh.
 */
let queue: Promise<void> = Promise.resolve();

/**
 * Clears and rebuilds every scheduled notification from the current records.
 * Cheap enough to call after any write; avoids drift between DB and OS state.
 * Runs are serialised; see `queue`.
 */
export function rescheduleAll(): Promise<void> {
  const run = queue.then(rebuild);
  queue = run.catch(() => {});
  return run;
}

async function rebuild(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Rebuilt here rather than only where onboarding grants permission, because
  // this function clears the queue: any other caller — a logged service, a cold
  // start — would otherwise silently delete the nudges an unfinished flow is
  // relying on. A no-op once onboarding is done.
  await scheduleOnboardingNudges();

  const now = Date.now();

  // Document expiries first: a lapsed insurance policy is a legal problem and
  // a late oil change is not, so when the 64-slot queue is short these are the
  // last to be dropped. Capped at half the queue so a glovebox full of papers
  // can never crowd the service schedule out entirely.
  const documents = collectDocumentAlerts(now).slice(0, MAX_SCHEDULED / 2);
  for (const d of documents) {
    const vehicle = vehicleSentenceName(d.vehicleName);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t("documents.notify.title", {
          document: documentName(d),
          date: formatDate(d.expiresAt),
        }),
        body: t("documents.notify.body", { vehicle }),
        data: {
          dueAt: d.at,
          kind: "document",
          documentKind: d.kind,
          daysLeft: d.daysLeft,
          url: `/vehicle/${d.vehicleId}/document?doc=${d.documentId}`,
        },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(d.at) },
    });
  }

  const checkins = collectCheckins(now);
  for (const c of checkins) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tNamed("checkin.notify.title"),
        body: t("checkin.notify.body", { vehicle: vehicleSentenceName(c.vehicleName) }),
        data: {
          dueAt: c.at,
          kind: "checkin",
          url: `/checkin?vehicle=${c.vehicleId}&source=notification`,
        },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(c.at) },
    });
  }

  const room = Math.max(0, MAX_SCHEDULED - documents.length - checkins.length);
  for (const reminder of selectReminders(collectReminders(), now, room)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        // Addressed to the driver by name where the app has one. The name is
        // baked in at schedule time rather than at delivery time, which is the
        // only option iOS gives — a pending notification is a fixed string —
        // and is harmless here: `rescheduleAll` runs on every launch and after
        // every write, so a name typed today is in every reminder by tomorrow.
        // The service leads, because it is the payload and the title is the
        // line iOS truncates: a name, a user-typed vehicle and "Brake
        // Inspection" ran to seventy-odd characters against the forty iOS
        // gives, and the word that fell off the end was always the service.
        // The car moves to the body, which gets two lines and is not competing
        // with the driver's name for them.
        title: tNamed("system.notify.title", {
          service: serviceName(reminder.serviceType),
        }),
        body: t("system.notify.body", {
          vehicle: vehicleSentenceName(reminder.vehicleName),
          date: formatDate(reminder.lastPerformedAt),
        }),
        // iOS keeps a `DATE` trigger only as seconds-from-now, so the due
        // date itself has to ride along for `reminderStatus` to read back.
        data: { dueAt: reminder.dueAt, serviceType: reminder.serviceType },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(reminder.dueAt) },
    });
  }
}

/**
 * What iOS is actually holding, as opposed to what the app believes it
 * scheduled. Settings shows this so that "are my reminders working" has an
 * answer that does not involve waiting six months for one to fire.
 */
export async function reminderStatus(): Promise<ReminderStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  const permission =
    status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";

  if (permission !== "granted") return { permission, count: 0 };

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const times = pending
    .map((n) => scheduledAt(n))
    .filter((at): at is number => at !== undefined)
    .sort((a, b) => a - b);

  return {
    permission,
    count: pending.length,
    nextAt: times.length ? new Date(times[0]).toISOString() : undefined,
  };
}
