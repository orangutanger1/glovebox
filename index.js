/**
 * Bootstrap entry, ahead of the app graph.
 *
 * This file exists because of the 1.1.0 launch crash. A native fatal — anything
 * that reaches `RCTFatal` rather than `ErrorUtils` — is invisible from
 * JavaScript: it does not pass the global handler, it does not pass an error
 * boundary, and the iOS crash report names only `ErrorRecovery.crash()`,
 * because expo-updates re-raises the original error from its own queue and
 * Apple keeps no reason string for it. Four crash reports across builds 17-20
 * contained no message at all for exactly that reason.
 *
 * What survives is expo-updates' persistent log, which the recovery path writes
 * the serialised `NSError`/`NSException` into *before* it aborts. So the launch
 * after a crash is the one that can say what the crash was, and reading that
 * log needs to happen before the app graph — which is what owning the entry
 * buys.
 *
 * The channel is a raw `fetch`: no SDK, no queue, no storage. The PostHog SDK
 * persists first and POSTs on its own schedule, and on a launch that aborts in
 * under a second that POST loses the race every time.
 *
 * It reports only on failure. The build-20 version also announced
 * `entry_reached` and `app_graph_loaded` on every launch, which was the right
 * trade while the crash was unexplained and is pure ingestion noise now that it
 * is fixed: two events per open, on every device, that no question is asked of.
 */
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * expo-updates, required once and up front.
 *
 * Two things need it and both need it early: the bundle identity below, and the
 * previous launch's error log. Guarded because this file also runs under a bare
 * `expo start` where the module may be absent.
 */
let Updates;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Updates = require("expo-updates");
} catch {
  Updates = null;
}

/**
 * Which bundle these reports came from.
 *
 * The SDK gets this from `customAppProperties` (src/analytics/index.ts), and
 * without it here the raw channel was a stream of rows that could not be
 * attributed to a build, a runtime or an update — so a `previous_launch_error`
 * could not be told apart from one two OTAs ago. Same five keys, same names, so
 * the two transports segment identically.
 *
 * `distinct_id` is deliberately a constant. These are process-level failures
 * reported before any identity exists on the device — there is no anonymous id
 * to read without loading the SDK's storage, which is one of the things that
 * may be broken. The bucket is named so it is obvious in the data and easy to
 * exclude; the bundle keys are what the analysis actually segments on.
 */
const IDENTITY = (() => {
  const base = { source: "entry", distinct_id: "entry-bootstrap" };
  if (!Updates) return base;
  try {
    return {
      ...base,
      ota_update_id: Updates.updateId || "embedded",
      ota_is_embedded: Updates.isEmbeddedLaunch,
      ota_channel: Updates.channel,
      ota_runtime_version: Updates.runtimeVersion,
      ota_created_at: Updates.createdAt ? Updates.createdAt.toISOString() : null,
    };
  } catch {
    return base;
  }
})();

function report(event, properties) {
  try {
    if (!POSTHOG_KEY) return;
    const pending = fetch(`${HOST}/batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        batch: [
          {
            event,
            properties: { ...IDENTITY, ...properties },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
  } catch {
    /* the report must never be the failure */
  }
}

try {
  const utils = globalThis.ErrorUtils;
  const previous =
    utils && typeof utils.getGlobalHandler === "function" ? utils.getGlobalHandler() : undefined;
  if (utils && typeof utils.setGlobalHandler === "function") {
    utils.setGlobalHandler((error, isFatal) => {
      report("entry_fatal", {
        message: String((error && error.message) || error),
        stack: String((error && error.stack) || "").slice(0, 4000),
        fatal: isFatal === true,
      });
      if (typeof previous === "function") previous(error, isFatal);
    });
  }
} catch {
  /* the report must never be the failure */
}

/**
 * Whatever killed the previous launch, in the words of the process that killed
 * it. Errors only: the log is otherwise a running commentary on update checks.
 */
try {
  if (Updates && typeof Updates.readLogEntriesAsync === "function") {
    Updates.readLogEntriesAsync(24 * 60 * 60 * 1000)
      .then((entries) => {
        const errors = (entries || []).filter((e) => e && e.level !== "info" && e.level !== "debug");
        if (errors.length === 0) return;
        report("previous_launch_error", {
          count: errors.length,
          entries: JSON.stringify(errors).slice(0, 8000),
        });
      })
      .catch(() => {});
  }
} catch {
  /* the report must never be the failure */
}

let entry;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  entry = require("expo-router/entry");
} catch (error) {
  // A throw while evaluating the app graph, which no handler inside that graph
  // can be installed in time to see.
  report("module_eval_fatal", {
    message: String((error && error.message) || error),
    stack: String((error && error.stack) || "").slice(0, 4000),
  });
  throw error;
}

module.exports = entry;
