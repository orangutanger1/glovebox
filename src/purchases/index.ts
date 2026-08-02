import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export const ENTITLEMENT = "pro";

export function initPurchases(): void {
  const apiKey = process.env.EXPO_PUBLIC_RC_IOS_KEY;
  if (!apiKey) {
    console.warn("EXPO_PUBLIC_RC_IOS_KEY missing — paywall will be empty");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
}

export async function isPro(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}
