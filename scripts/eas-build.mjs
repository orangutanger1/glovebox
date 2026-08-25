#!/usr/bin/env node
/**
 * Build iOS, and if the account's free-tier allotment is gone, build under the
 * next account that still has one.
 *
 * The loop is: pick an eligible account → ask the API what its remaining iOS
 * allotment is → if zero, record the reset date and move on without queueing
 * anything → otherwise switch the config, spawn the build, and watch the output.
 * A build that dies on the quota error is not a failure to report, it is new
 * information: record the reset date and try the next account.
 *
 * Every path out of here — success, quota block, build failure, SIGINT — goes
 * through `restore()`, so app.json and ship.config.json are never left pointing
 * at someone else's project. See eas-switch.mjs for why the restore is
 * byte-exact and survives a hard kill.
 */
import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { join } from "node:path";

import {
  detectExhaustion,
  isEligible,
  list,
  markExhausted,
  quota,
  REGISTRY_FILE,
} from "./eas-accounts.mjs";
import { apply, restore, ROOT } from "./eas-switch.mjs";

/** Keep the tail of the build log; the quota error is always at the end. */
const BUFFER_CAP = 1 << 20;

const USAGE = `usage: node scripts/eas-build.mjs [flags]

  --status              print the account registry and stop
  --live                with --status, also read live quota from the EAS API
  --dry-run             print the account and the exact command, change nothing
  --profile <name>      EAS build profile                     (default: production)
  --platform <ios|...>  platform to build and to meter        (default: ios)
  --no-probe            skip the pre-flight quota read, just try the build
  --raw-eas             bypass \`ship build\` and call eas-cli directly

Registry: ${REGISTRY_FILE}`;

function parseArgs(argv) {
  const opts = {
    status: false,
    live: false,
    dryRun: false,
    profile: "production",
    platform: "ios",
    probe: true,
    rawEas: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => argv[(i += 1)];
    switch (arg) {
      case "--status": opts.status = true; break;
      case "--live": opts.live = true; break;
      case "--dry-run": opts.dryRun = true; break;
      case "--no-probe": opts.probe = false; break;
      case "--raw-eas": opts.rawEas = true; break;
      case "--profile": opts.profile = value(); break;
      case "--platform": opts.platform = value(); break;
      case "--help":
      case "-h": opts.help = true; break;
      default:
        throw new Error(`unknown flag ${arg}`);
    }
  }
  return opts;
}

/** PATH lookup without shelling out. */
function which(bin) {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    if (!dir) continue;
    const candidate = join(dir, bin);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

/**
 * `ship build` is this project's real build path — it runs the same
 * `eas build --platform … --profile … --non-interactive` and then writes the
 * native fingerprint baseline that `ship ota` needs to tell a safe JS-only
 * update from one that would crash every installed client. Calling eas-cli
 * directly skips that record, so `ship` wins whenever it is installed.
 */
export function buildCommand({ profile, platform, rawEas }) {
  const ship = rawEas ? null : which("ship");
  if (ship) return { command: ship, args: ["build", "--profile", profile], via: "ship" };
  return {
    command: "npx",
    args: [
      "--yes",
      "eas-cli@latest",
      "build",
      "--platform",
      platform,
      "--profile",
      profile,
      "--non-interactive",
    ],
    via: "eas-cli",
  };
}

const quoteArg = (a) => (/[^\w./:@=-]/.test(a) ? `'${a.replaceAll("'", `'\\''`)}'` : a);
const renderCommand = ({ command, args }) => [command, ...args].map(quoteArg).join(" ");

/**
 * Run the build, mirroring its output to this terminal while keeping a copy.
 *
 * stdout/stderr have to be pipes rather than inherited, because the whole point
 * is to read the failure text — but they are written straight through, so the
 * build still looks live.
 */
function runBuild({ command, args, env }) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let buffer = "";
    const collect = (chunk, sink) => {
      sink.write(chunk);
      buffer += chunk.toString("utf8");
      if (buffer.length > BUFFER_CAP) buffer = buffer.slice(-BUFFER_CAP);
    };
    child.stdout.on("data", (c) => collect(c, process.stdout));
    child.stderr.on("data", (c) => collect(c, process.stderr));

    child.on("error", reject);
    child.on("close", (code, signal) => resolvePromise({ code: code ?? 1, signal, output: buffer }));
  });
}

/**
 * Child environment for one account.
 *
 * EXPO_TOKEN is deleted when the account has no token — a leftover token in the
 * ambient environment would silently authenticate as the wrong account, and
 * eas-cli prefers EXPO_TOKEN over the stored login (SessionManager reads
 * `process.env.EXPO_TOKEN` first), so leaving it in place is the one way to
 * build under an account nobody asked for.
 */
function envFor(account) {
  const env = { ...process.env };
  if (account.expoToken) env.EXPO_TOKEN = account.expoToken;
  else delete env.EXPO_TOKEN;
  return env;
}

const fmtDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");

function printStatus(accounts, live) {
  const rows = accounts.map((a) => ({
    account: a.name,
    owner: a.owner ?? "—",
    mode: a.projectId ? "separate project" : "transfer",
    projectId: a.projectId ?? "(unchanged)",
    exhaustedUntil: fmtDate(a.exhaustedUntil),
    eligible: isEligible(a) ? "yes" : "no",
    quota: a.quotaText ?? "",
  }));
  const columns = live
    ? ["account", "owner", "mode", "projectId", "exhaustedUntil", "eligible", "quota"]
    : ["account", "owner", "mode", "projectId", "exhaustedUntil", "eligible"];
  const width = Object.fromEntries(
    columns.map((c) => [c, Math.max(c.length, ...rows.map((r) => String(r[c]).length))]),
  );
  const line = (cells) => columns.map((c) => String(cells[c]).padEnd(width[c])).join("  ").trimEnd();

  process.stdout.write(`${line(Object.fromEntries(columns.map((c) => [c, c])))}\n`);
  process.stdout.write(`${columns.map((c) => "-".repeat(width[c])).join("  ")}\n`);
  for (const row of rows) process.stdout.write(`${line(row)}\n`);
  process.stdout.write(`\n${accounts.length} account(s) · ${REGISTRY_FILE}\n`);
}

async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  if (opts.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  if (opts.status) {
    const accounts = list();
    if (opts.live)
      await Promise.all(
        accounts.map(async (a) => {
          const q = await quota(a, { platform: opts.platform });
          a.quotaText = q
            ? `${q.platform.used}/${q.platform.limit} ${opts.platform} · ${q.plan} · resets ${fmtDate(q.periodEnd)}`
            : "unreadable";
        }),
      );
    printStatus(accounts, opts.live);
    return 0;
  }

  const spec = buildCommand(opts);

  if (opts.dryRun) {
    const accounts = list();
    const chosen = accounts.find((a) => isEligible(a));
    if (!chosen) {
      process.stdout.write(
        `dry-run — nothing was changed and nothing was queued\n\n` +
          `  account      (none eligible)\n` +
          `  via          ${spec.via}\n` +
          `  cwd          ${ROOT}\n` +
          `  command      ${renderCommand(spec)}\n\n` +
          `every registered account is blocked until its reset date:\n\n`,
      );
      printStatus(accounts, false);
      return 1;
    }
    process.stdout.write(
      `dry-run — nothing was changed and nothing was queued\n\n` +
        `  account      ${chosen.name}${chosen.email ? ` <${chosen.email}>` : ""}\n` +
        `  owner        ${chosen.owner}\n` +
        `  projectId    ${chosen.projectId ?? "(unchanged — transferred project)"}\n` +
        `  updates.url  ${chosen.updatesUrl ?? "(unchanged — OTA install base stays whole)"}\n` +
        `  auth         ${chosen.expoToken ? "EXPO_TOKEN from the registry" : "ambient `eas login` session (no token stored)"}\n` +
        `  via          ${spec.via}\n` +
        `  cwd          ${ROOT}\n` +
        `  command      ${renderCommand(spec)}\n\n` +
        (chosen.projectId
          ? `would rewrite app.json (expo.owner, expo.extra.eas.projectId, expo.updates.url)\n` +
            `           and ship.config.json (eas.owner, eas.projectId)\n`
          : `would rewrite only the owner: app.json (expo.owner) and ship.config.json (eas.owner)\n`),
    );
    return 0;
  }

  // A switch left behind by a killed run would make this build inherit the wrong
  // project. Clear it before choosing anything.
  restore();

  const attempted = [];
  try {
    for (;;) {
      const account = list().find((a) => isEligible(a) && !attempted.includes(a.name));
      if (!account) break;
      attempted.push(account.name);

      process.stdout.write(`\n=== ${account.name} (${account.owner}) ===\n`);

      if (opts.probe) {
        const q = await quota(account, { platform: opts.platform });
        if (q) {
          process.stdout.write(
            `quota: ${q.platform.used}/${q.platform.limit} ${opts.platform} builds used` +
              ` on the ${q.plan} plan · period ends ${q.periodEnd}\n`,
          );
          if (q.exhausted) {
            markExhausted(account.name, q.periodEnd);
            process.stdout.write(
              `${account.name} is out of ${opts.platform} builds — nothing queued, marked exhausted until ${fmtDate(q.periodEnd)}\n`,
            );
            continue;
          }
        } else {
          process.stdout.write(
            "quota: unreadable for this account (no usable credential) — relying on the build output instead\n",
          );
        }
      }

      if (!account.expoToken)
        process.stdout.write(
          "auth: no EXPO_TOKEN stored — using the ambient `eas login` session, which must have access to this account\n",
        );

      apply(account.name);
      const result = await runBuild({ ...spec, env: envFor(account) });

      if (result.code === 0) {
        process.stdout.write(`\nbuild succeeded under ${account.name}\n`);
        return 0;
      }

      const blocked = detectExhaustion(result.output);
      if (!blocked.exhausted) {
        process.stdout.write(
          `\nbuild failed under ${account.name} (exit ${result.code}${result.signal ? `, ${result.signal}` : ""}) —` +
            " not a quota problem, so rotating would only fail the same way\n",
        );
        return result.code;
      }

      markExhausted(account.name, blocked.resetISO);
      restore();
      process.stdout.write(
        `\n${account.name} is out of ${opts.platform} builds: ${blocked.evidence ?? "free-tier limit reached"}\n` +
          `marked exhausted until ${fmtDate(blocked.resetISO)} — trying the next account\n`,
      );
    }
  } finally {
    restore();
  }

  const accounts = list();
  process.stderr.write(
    `\nno account can build ${opts.platform} right now.\n\n`,
  );
  for (const a of accounts)
    process.stderr.write(
      `  ${a.name.padEnd(20)} resets ${fmtDate(a.exhaustedUntil)}${a.note ? `  — ${a.note}` : ""}\n`,
    );
  process.stderr.write(
    `\nOptions: wait for the reset above, upgrade the account at` +
      ` https://expo.dev/accounts/${accounts[0]?.owner ?? "<account>"}/settings/billing,\n` +
      `or register another account you legitimately hold:\n` +
      `  node scripts/eas-accounts.mjs add --name <n> --owner <o> --project-id <id>\n` +
      `  node scripts/eas-accounts.mjs token --name <n>\n`,
  );
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // A ^C during a build must not leave the config switched.
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      restore();
      process.exit(130);
    });
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      restore();
      process.stderr.write(`${err?.stack ?? err}\n`);
      process.exit(1);
    },
  );
}
