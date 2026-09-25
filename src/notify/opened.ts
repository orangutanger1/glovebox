import * as Notifications from "expo-notifications";
import { track } from "../analytics";
import { RESUME_NUDGE_IDS } from "./resume";

/**
 * Reports every notification the user tapped, as `notification_opened`.
 *
 * Reminders are the thing the subscription promises and the resume nudges are
 * the only way back into an abandoned onboarding, and until this the app could
 * say how many it scheduled and not one word about whether any of them brought
 * anyone back.
 *
 * Two sources, because iOS delivers a tap two ways: a tap that cold-launched
 * the app is waiting as the "last response" before any listener exists, and a
 * tap on a running or suspended app arrives through the listener. The same tap
 * can surface through both, so each is reported once per process, and the
 * last response is cleared once read so the next launch does not report it
 * again.
 *
 * A notification that carries a `url` in its data (check-ins, document
 * expiries) is also handed to `onOpen`, once per tap, so the caller can route
 * to the screen it is about. Service reminders carry none and just open the app.
 *
 * Call once, from boot. Returns the unsubscribe. Never throws.
 */
export function watchNotificationOpens(onOpen?: (url: string) => void): () => void {
  const seen = new Set<string>();

  function report(response: Notifications.NotificationResponse, cold: boolean): void {
    const request = response.notification.request;
    const key = `${request.identifier}:${response.notification.date}`;
    if (seen.has(key)) return;
    seen.add(key);
    track("notification_opened", { ...describe(request), cold });
    const url = request.content.data?.url;
    if (onOpen && typeof url === "string" && url.startsWith("/")) {
      try {
        onOpen(url);
      } catch {
        // A route that no longer exists: the app is open, which is most of it.
      }
    }
  }

  try {
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      report(last, true);
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((r) => report(r, false));
    return () => subscription.remove();
  } catch {
    // A missing native module or an old binary: nothing to watch.
    return () => {};
  }
}

/**
 * Which notification it was, without its text. Resume nudges are recognised by
 * their fixed identifiers; service reminders carry their service in `data`
 * (reminders scheduled before that field existed report `service_type: null`).
 */
function describe(request: Notifications.NotificationRequest): Record<string, string | number | null> {
  const nudge = RESUME_NUDGE_IDS.indexOf(request.identifier as (typeof RESUME_NUDGE_IDS)[number]);
  if (nudge >= 0) return { kind: "onboarding_nudge", nudge: nudge + 1 };
  const data = request.content.data ?? {};
  if (data.kind === "checkin") return { kind: "checkin" };
  if (data.kind === "document") {
    return {
      kind: "document",
      document_kind: typeof data.documentKind === "string" ? data.documentKind : null,
      days_left: typeof data.daysLeft === "number" ? data.daysLeft : null,
    };
  }
  const serviceType = typeof data.serviceType === "string" ? data.serviceType : null;
  return { kind: "reminder", service_type: serviceType };
}
