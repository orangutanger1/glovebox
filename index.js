/**
 * Bootstrap entry, ahead of the app graph.
 *
 * 1.1.0 dies before the first line of application code runs on device — the
 * launch never reaches the boot effect, so nothing the analytics SDK captures
 * ever exists and the failure is invisible from the outside. This file owns
 * startup so the earliest moments can speak: each stage of loading reports
 * itself with a raw POST (no SDK, no dependencies — the report must survive
 * whatever kills the bundle), and the app-graph require is wrapped so a
 * module-evaluation throw lands in PostHog with its stack instead of nowhere.
 */
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

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
            properties: {
              source: "entry",
              distinct_id: "entry-bootstrap",
              ...properties,
            },
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
 * The one channel the app code can trust to escape a sub-second launch.
 *
 * `track` + `flushNow` go through the PostHog SDK, which persists first and
 * POSTs on its own schedule; on a launch that aborts in under a second the
 * POST loses that race every time. Boot steps report through this as well as
 * through the SDK, so a failure is on the wire before anything can abort.
 */
globalThis.__wrenchyReport = report;

/**
 * Whatever killed the previous launch, in the words of the process that killed
 * it.
 *
 * A native fatal — anything that reaches `RCTFatal` rather than
 * `ErrorUtils` — is invisible from JavaScript: it does not pass the global
 * handler, it does not pass an error boundary, and the iOS crash report names
 * only `ErrorRecovery.crash()`, because expo-updates re-raises the original
 * error from its own queue and Apple keeps no reason string for it. But
 * expo-updates serialises that error to its persistent log before it aborts
 * (`ErrorRecovery.writeErrorOrExceptionToLog`), and that log outlives the
 * process. So the launch after a crash is the one that can say what the crash
 * was. Errors only: the log is otherwise a running commentary on update checks.
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Updates = require("expo-updates");
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

report("entry_reached", {});

let entry;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  entry = require("expo-router/entry");
} catch (error) {
  report("module_eval_fatal", {
    message: String((error && error.message) || error),
    stack: String((error && error.stack) || "").slice(0, 4000),
  });
  throw error;
}

report("app_graph_loaded", {});
module.exports = entry;
