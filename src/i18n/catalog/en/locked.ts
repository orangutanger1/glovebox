import type { Fragment } from "../types";

/**
 * The wall: what a user who has declined both asks, or whose subscription has
 * lapsed, reads instead of the garage.
 *
 * Three keys, because the screen borrows the rest. Restoring a purchase says
 * the same three things here as it does in Settings (`settings.restore*`,
 * `settings.store.error`), and a second translation of "Restore purchases"
 * would be a second chance for the two screens to disagree about what a
 * successful restore is called.
 *
 * The body states plainly that there is no free version. Burying that is what
 * turns a subscription app into a one-star review: the user who finds out by
 * hitting a wall feels tricked, and the one who was told feels sold to.
 *
 * No price. StoreKit localises and converts it, and the sheet the button opens
 * is the only thing that knows what this storefront charges.
 */
export const locked: Fragment = {
  "locked.title": "Wrenchy is a subscription.",
  "locked.body":
    "Your car, your plan and your reminders are all still here. There is no free version — one subscription opens the whole app, and it starts with your first week.",
  "locked.cta": "Open my garage",
};
