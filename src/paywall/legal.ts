/**
 * The two links App Review expects under every subscription button
 * (Guideline 3.1.2). The RevenueCat sheet drew them from its dashboard
 * config; the app draws its own paywall now, so it carries them itself.
 *
 * Terms is Apple's standard EULA, which is what the app has always shipped
 * under (no custom EULA is set in App Store Connect). Privacy is the same
 * gist `ship.config.json` publishes to the store listing.
 */
export const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const PRIVACY_URL =
  "https://gist.github.com/orangutanger1/ce492daa25c4acdbc7db49068c33ce3f/raw/473d9af8d5d1594e990aaa5d33fd581234b9ec58/PrivacyPolicy.md";
