#!/usr/bin/env node
/**
 * Publishes an OTA update, or refuses to.
 *
 * `ship ota` answers one question — whether the native dependency graph still
 * matches the installed binaries — and then runs `eas update --branch … --message
 * … --non-interactive`. That command carries no `--environment`, and every
 * `EXPO_PUBLIC_*` value is inlined into the bundle at publish time from whatever
 * environment the publisher happened to have. With none, the keys are simply
 * absent, and an app that worked on its embedded bundle loses them the moment the
 * update applies.
 *
 * On 2026-08-25 that shipped: RevenueCat was left unconfigured on every install
 * that took the update, `RevenueCatUI.presentPaywall` reached `Purchases.shared`
 * before `configure`, and iOS killed the process on the paywall button. PostHog
 * lost its key in the same bundle, so the funnel went silent at the same instant
 * and the crash reported nothing. Both keys are one flag away at all times, which
 * is not a thing to remember.
 *
 * So this script never publishes a bundle it has not read. It exports with the
 * EAS environment loaded, greps the built bundle for the value of every key the
 * app cannot run without, publishes those exact bytes with `--input-dir`, and
 * then checks the served manifest's launch-asset key against the local md5 to
 * prove that what the phones will download is what was verified.
 *
 * usage: npm run ota -- --message "what changed" [--branch production] [--check]
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { easCommand } from "./eas-bin.mjs";

/**
 * The keys whose absence is a crash rather than a degradation.
 *
 * A missing RevenueCat key kills the app on the paywall; a missing PostHog key
 * hides that it happened. Anything merely optional does not belong here — this
 * list is a publish gate, not documentation of the environment.
 */
const REQUIRED = ["EXPO_PUBLIC_RC_IOS_KEY", "EXPO_PUBLIC_POSTHOG_KEY"];

const ENVIRONMENT = "production";
const PLATFORM = "ios";

function fail(message) {
  console.error(`\n  REFUSED  ${message}\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0)
    fail(`${command} ${args.join(" ")} exited ${result.status}`);
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options });
}

function flag(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const branch =
  flag("branch") ??
  JSON.parse(readFileSync("ship.config.json", "utf8")).eas.channel;
const check = process.argv.includes("--check");
const inner = process.argv.includes("--inner");

/* The outer half: the safety verdict, then a re-exec of this same script with
 * the EAS environment loaded. `eas env:exec` is the only way to hold those
 * values in the process that runs the export, and it takes a bash string. */
if (!inner) {
  const message = flag("message");
  if (!message && !check)
    fail(
      "--message is required: an update nobody can identify is unreviewable",
    );

  // Reused rather than reimplemented: `ship` owns the fingerprint baseline, and
  // an OTA that outruns the native graph bricks installed clients regardless of
  // what its environment held.
  run("ship", ["ota", "--check"]);
  if (check) {
    console.log(
      "\n  native graph is safe; run again with --message to publish\n",
    );
    process.exit(0);
  }

  const argv = [
    "--inner",
    "--branch",
    branch,
    "--message-b64",
    Buffer.from(message, "utf8").toString("base64"),
  ];
  const envExec = easCommand([
    "env:exec",
    ENVIRONMENT,
    `node scripts/ota.mjs ${argv.join(" ")}`,
    "--non-interactive",
  ]);
  run(envExec.command, envExec.args);
  process.exit(0);
}

/* The inner half, running with the environment the update will carry. */
const message = Buffer.from(flag("message-b64") ?? "", "base64").toString(
  "utf8",
);

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  fail(
    `${missing.join(", ")} absent from the ${ENVIRONMENT} environment — the bundle would ship without it`,
  );
}

rmSync("dist", { recursive: true, force: true });
/* `--clear` is load-bearing, not hygiene. `EXPO_PUBLIC_*` values are inlined by
 * the transformer, and Metro's transform cache is keyed on the file, not on the
 * environment that produced it — so any earlier export run without the EAS
 * environment leaves modules cached with the keys compiled out, and this
 * script's own gate then refuses a bundle that the environment would have
 * inlined correctly. Clearing makes the verdict depend on the environment
 * rather than on what was exported on this machine yesterday. */
run("npx", ["--yes", "expo", "export", "--platform", PLATFORM, "--clear"]);

const bundleDir = join("dist", "_expo", "static", "js", PLATFORM);
const bundles = readdirSync(bundleDir).filter(
  (name) => name.endsWith(".hbc") || name.endsWith(".js"),
);
if (bundles.length !== 1)
  fail(
    `expected exactly one ${PLATFORM} bundle in ${bundleDir}, found ${bundles.length}`,
  );
const bundlePath = join(bundleDir, bundles[0]);
const bundle = readFileSync(bundlePath);
const md5 = createHash("md5").update(bundle).digest("hex");

// The value, not the variable name: `process.env.X` is compiled away, so the
// only proof that inlining happened is the secret itself sitting in the bytes.
// This is the gate the 2026-08-25 update needed and did not have.
const text = bundle.toString("latin1");
const absent = REQUIRED.filter((key) => !text.includes(process.env[key]));
if (absent.length > 0)
  fail(
    `${absent.join(", ")} did not reach the bundle — this is the crash, refusing to publish`,
  );

console.log(`\n  verified  ${bundlePath} (md5 ${md5})`);
for (const key of REQUIRED)
  console.log(`            ${key} inlined by the ${ENVIRONMENT} environment`);
console.log();

/* Published with the same environment this export was verified under. `eas
 * update` bundles again rather than shipping these bytes — `--input-dir` is not
 * honoured alongside a fresh export — so the local export's role is to prove
 * that the environment inlines what the app needs, not to be the artefact. */
const publishSpec = easCommand([
  "update",
  "--branch",
  branch,
  "--platform",
  PLATFORM,
  "--environment",
  ENVIRONMENT,
  "--message",
  message,
  "--json",
  "--non-interactive",
]);
const published = JSON.parse(
  capture(publishSpec.command, publishSpec.args, {
    stdio: ["inherit", "pipe", "inherit"],
  }),
);
const update =
  published.find((entry) => entry.platform === PLATFORM) ?? published[0];
if (!update?.id) fail("eas update published nothing this script can identify");

/* What the phones will actually ask for. A published update that the channel
 * does not serve is the other way this goes wrong quietly: a branch mapped
 * somewhere else, or a runtime version no installed binary reports. */
const manifest = parseManifest(
  capture("curl", [
    "-fsS",
    app.updates.url,
    "-H",
    `expo-platform: ${PLATFORM}`,
    "-H",
    `expo-runtime-version: ${app.version}`,
    "-H",
    `expo-channel-name: ${branch}`,
    "-H",
    "expo-protocol-version: 1",
    "-H",
    "expo-api-version: 1",
    "-H",
    "expo-expect-signature: false",
  ]),
);

/**
 * The manifest out of an update response.
 *
 * Protocol 1 answers in `multipart/mixed`: the manifest is the first part, and
 * the parts after it carry the extensions and directives an updates client
 * cares about and this script does not. Taking the first JSON object up to the
 * next boundary is the whole of what is needed here, and it reads a protocol 0
 * bare-JSON response unchanged.
 */
function parseManifest(raw) {
  const start = raw.indexOf("{");
  if (start === -1) fail("the update server answered with no manifest at all");
  const boundary = raw.indexOf("\n---", start);
  const body = boundary === -1 ? raw.slice(start) : raw.slice(start, boundary);
  try {
    return JSON.parse(body.trim());
  } catch (error) {
    return fail(
      `the update server answered with something that is not a manifest: ${error}`,
    );
  }
}

if (manifest.id !== update.id) {
  fail(
    `${branch} serves update ${manifest.id}, not the ${update.id} just published — check the channel's branch mapping`,
  );
}

console.log(`  published ${update.id}`);
console.log(
  `  serving   runtime ${app.version} on ${branch}, from the ${ENVIRONMENT} environment\n`,
);
