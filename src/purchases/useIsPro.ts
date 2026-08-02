import { useEffect, useState } from "react";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { ENTITLEMENT } from "./index";

/**
 * Live entitlement state: `null` until it is known, then whether Pro is active.
 *
 * The listener is the point. Cancelling or switching plans happens inside a
 * native Customer Center sheet that the app cannot see the end of, so polling
 * on focus would leave Settings describing a subscription that no longer
 * exists. `addCustomerInfoUpdateListener` fires on every entitlement change,
 * including ones made from the sheet, and the row re-renders on its own.
 *
 * The `null` state is not cosmetic either — rendering the free-user rows during
 * the moment before the entitlement resolves would show a paying subscriber an
 * advert for what they have already bought.
 */
export function useIsPro(): boolean | null {
  const [pro, setPro] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;

    Purchases.getCustomerInfo()
      .then((info) => {
        if (live) setPro(info.entitlements.active[ENTITLEMENT] !== undefined);
      })
      // No store, no key, no network. Treating that as "not Pro" matches
      // `isPro` and keeps the paid features gated rather than given away.
      .catch(() => {
        if (live) setPro(false);
      });

    // Returns void, so the listener has to be held and handed back to
    // `removeCustomerInfoUpdateListener` — dropping it leaks a setState into an
    // unmounted screen on every entitlement change.
    const listener = (info: CustomerInfo) => {
      if (live) setPro(info.entitlements.active[ENTITLEMENT] !== undefined);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      live = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return pro;
}
