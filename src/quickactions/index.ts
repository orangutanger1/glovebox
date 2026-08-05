import * as QuickActions from "expo-quick-actions";
import { TRIAL_DAYS } from "../purchases";

/**
 * The home-screen long-press menu.
 *
 * This is the menu that also contains Delete App, which is the only reason it
 * is worth building: iOS never tells an app it is being deleted, but it does
 * render two of our rows next to the button that deletes it. Somebody with
 * their finger on the icon is the closest thing to a caught churn this
 * platform allows, and they get the same two things every other exit gets —
 * somewhere to complain, and a free trial.
 *
 * Set dynamically rather than declared in Info.plist. Static actions would
 * appear before the first launch, which buys nothing (there is nothing to
 * churn from yet) and costs the one thing that matters here: a subscriber must
 * not be shown "Try Pro free" in a menu they open every day.
 */
export const QUICK_ACTION_TRIAL = "trial";
export const QUICK_ACTION_FEEDBACK = "feedback";

/**
 * Apple allows four and puts its own rows below ours. Two is what there is to
 * say; padding it out with "Log a service" shortcuts would push Delete App off
 * the bottom of a menu the user opened for a reason.
 */
export function quickActionItems(canTrial: boolean): QuickActions.Action[] {
  const items: QuickActions.Action[] = [];
  if (canTrial) {
    items.push({
      id: QUICK_ACTION_TRIAL,
      title: "Try Pro free",
      subtitle: `${TRIAL_DAYS} days, then it renews unless you cancel`,
      // SF Symbols rather than a branded glyph: these sit directly above
      // Apple's own rows, and anything off-weight looks like a mistake.
      icon: "symbol:gift",
    });
  }
  items.push({
    id: QUICK_ACTION_FEEDBACK,
    title: "Send feedback",
    subtitle: "Tell us what went wrong",
    icon: "symbol:envelope",
  });
  return items;
}

/**
 * Reconciles the menu with what the user is actually eligible for. Called on
 * every launch, so cancelling, subscribing, or the trial offering being pulled
 * from the dashboard all take effect on the next cold start.
 *
 * Never throws: the menu is a nicety and the app opening is not.
 */
export async function syncQuickActions(canTrial: boolean): Promise<void> {
  try {
    await QuickActions.setItems(quickActionItems(canTrial));
  } catch {
    // Unsupported device, or no native module in this binary.
  }
}
