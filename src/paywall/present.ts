import { router } from "expo-router";
import type { OfferingId, PurchaseResult } from "../purchases/plans";

/**
 * The sheet's promise, kept, for a screen.
 *
 * Five places in the app do `const bought = await presentPaywall(); if
 * (!bought) return;` and carry on in the same function. The RevenueCat sheet
 * made that shape natural because a native modal is a promise. The paywall
 * is now a route, and a route is not a promise, so this parks one: `open`
 * pushes the screen and returns a promise, the screen calls `settle` with
 * what happened, and the caller's code reads exactly as it did.
 *
 * One at a time. A second `open` while the first is parked would leave the
 * first caller waiting forever, so it is settled as dismissed first: the
 * user has plainly moved on from whatever asked.
 */
let pending: ((result: PurchaseResult) => void) | null = null;

export function isPaywallOpen(): boolean {
  return pending !== null;
}

export function openPaywall(offering: OfferingId, source: string): Promise<PurchaseResult> {
  if (pending) pending("dismissed");
  const promise = new Promise<PurchaseResult>((resolve) => {
    pending = resolve;
  });
  router.push(
    `/paywall?offering=${encodeURIComponent(offering)}&source=${encodeURIComponent(source)}` as never
  );
  return promise;
}

export function settlePaywall(result: PurchaseResult): void {
  const resolve = pending;
  pending = null;
  resolve?.(result);
}
