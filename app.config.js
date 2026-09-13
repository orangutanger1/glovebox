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

/**
 * The Sentry config plugin, added only when the build knows which project it
 * is reporting to.
 *
 * It lives here rather than in app.json because its two required options are
 * an organisation and a project slug, and a slug hard-coded in the committed
 * config is a value that is wrong for every clone and silently wrong in CI.
 * With the variables unset the plugin is simply absent: the SDK still reports
 * — `EXPO_PUBLIC_SENTRY_DSN` is what turns reporting on — and what is lost is
 * source map upload, so stacks arrive minified rather than not at all.
 *
 * What the plugin does that the SDK cannot: it wires the native iOS build to
 * upload debug symbols and the bundle's source map under the same release and
 * dist that `src/crash` reports with. That pairing is the whole difference
 * between a stack naming your code and a stack naming a bytecode offset.
 *
 * `SENTRY_AUTH_TOKEN` is read by the upload step itself and is a real secret:
 * it belongs in EAS as a secret-type environment variable, never in the repo.
 */
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

function withSentry(plugins) {
  if (!SENTRY_ORG || !SENTRY_PROJECT) return plugins;
  return [
    ...plugins,
    ["@sentry/react-native/expo", { organization: SENTRY_ORG, project: SENTRY_PROJECT }],
  ];
}

module.exports = ({ config }) => {
  const base = { ...config, plugins: withSentry(config.plugins ?? []) };
  if (!IS_DEV) return base;

  return {
    ...base,
    name: "Wrenchy (dev)",
    scheme: `${base.scheme}dev`,
    ios: {
      ...base.ios,
      bundleIdentifier: `${base.ios.bundleIdentifier}.dev`,
    },
  };
};
