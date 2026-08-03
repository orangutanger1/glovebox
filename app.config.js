/**
 * Two installable identities from one config.
 *
 * The development build and the TestFlight build previously shared
 * `com.idea6.carmaintenancelog`, and iOS allows exactly one app per bundle
 * identifier — so installing from TestFlight silently replaced the dev client,
 * which is what took Fast Refresh away with no error anywhere. Suffixing the
 * identifier and the URL scheme for the dev variant lets both sit on the phone
 * at once, and makes it obvious on the home screen which one you opened.
 *
 * `APP_VARIANT=development` is set by the `development` profile in eas.json for
 * builds, and by the `start`/`ios` scripts for the local dev server. The dev
 * server has to agree with the installed app about the scheme, or the deep link
 * the QR code encodes opens the wrong app.
 *
 * Anything not overridden here comes straight from app.json.
 */
const IS_DEV = process.env.APP_VARIANT === "development";

module.exports = ({ config }) => {
  if (!IS_DEV) return config;

  return {
    ...config,
    name: "Glovebox (dev)",
    scheme: `${config.scheme}dev`,
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
    },
  };
};
