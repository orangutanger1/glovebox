#!/usr/bin/env node
/**
 * The Expo-account registry that `eas-build.mjs` rotates through.
 *
 * Lives outside the repo — `~/.omp/eas/accounts.json`, 0700 dir / 0600 file —
 * because every record can hold an `expoToken`, which is a bearer credential for
 * the whole Expo account (see docs.expo.dev/accounts/programmatic-access). A
 * token in the working tree is a token in a git object sooner or later.
 *
 * Two ways to learn that an account cannot build:
 *
 *   1. Ask first. `quota()` reads the same GraphQL field eas-cli itself reads in
 *      utils/usage/checkForOverages.js — account.usageMetrics.byBillingPeriod —
 *      and that payload carries a per-platform breakdown with a hard `limit`.
 *      A verified live response for `mayfield` on the Free plan:
 *          planMetrics[0] { serviceMetric: BUILDS, value: 15, limit: 30,
 *                           platformBreakdown: { ios: {value:15, limit:15},
 *                                                android: {value:0, limit:15} } }
 *          billingPeriod  { start: 2026-08-01Z, end: 2026-09-01Z }
 *      Note the aggregate (15/30) is only half-used while iOS (15/15) is spent:
 *      the aggregate is useless for this decision, the breakdown is the answer,
 *      and `billingPeriod.end` is the reset instant. So the quota *is* readable
 *      programmatically, and a doomed build never has to be queued at all.
 *
 *   2. Believe the failure. If the probe cannot run (no credential, API change),
 *      `detectExhaustion()` reads it off the build output instead. The server
 *      returns errorCode EAS_BUILD_FREE_TIER_IOS_LIMIT_EXCEEDED and eas-cli
 *      rethrows the *server's own message* verbatim
 *      (build/build/build.js -> SERVER_SIDE_DEFINED_ERRORS), so the text is what
 *      has to be matched.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const REGISTRY_DIR = join(homedir(), ".omp", "eas");
export const REGISTRY_FILE = join(REGISTRY_DIR, "accounts.json");

/**
 * The account this repo has always built under. `expoToken` is deliberately null:
 * no personal access token for `mayfield` exists on this host, and inventing one
 * would turn a missing credential into an authentication failure three minutes
 * into a build. Null means "spawn with the ambient `eas login` session", which is
 * exactly what has been working — `eas whoami` reports mayfield.
 */
const SEED = {
  name: "mayfield",
  email: "matthew.yen09@gmail.com",
  owner: "mayfield",
  expoToken: null,
  projectId: "fd84867d-9447-4a57-991a-d7e6a8ef1ac6",
  updatesUrl: "https://u.expo.dev/fd84867d-9447-4a57-991a-d7e6a8ef1ac6",
  exhaustedUntil: "2026-09-01T00:00:00.000Z",
  note: "iOS free-tier allotment spent for the 2026-08 billing period (15/15 verified via account.usageMetrics). No EXPO_TOKEN on this host — builds use the ambient `eas login` session.",
};

const FIELDS = [
  "name",
  "email",
  "owner",
  "expoToken",
  "projectId",
  "updatesUrl",
  "exhaustedUntil",
  "note",
];

/** Normalise to exactly the documented record shape, in a stable key order. */
function normalise(raw) {
  const out = {};
  for (const k of FIELDS) out[k] = raw?.[k] ?? null;
  return out;
}

export function load() {
  try {
    const parsed = JSON.parse(readFileSync(REGISTRY_FILE, "utf8"));
    const accounts = (Array.isArray(parsed) ? parsed : parsed?.accounts ?? []).map(normalise);
    return { version: 1, accounts };
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    const seeded = { version: 1, accounts: [normalise(SEED)] };
    save(seeded);
    return seeded;
  }
}

export function save(registry) {
  mkdirSync(REGISTRY_DIR, { recursive: true, mode: 0o700 });
  chmodSync(REGISTRY_DIR, 0o700);
  const body = { version: 1, accounts: registry.accounts.map(normalise) };
  writeFileSync(REGISTRY_FILE, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 });
  chmodSync(REGISTRY_FILE, 0o600);
  return REGISTRY_FILE;
}

export const list = () => load().accounts;

export const get = (name) => list().find((a) => a.name === name) ?? null;

/** An account is eligible when nothing says otherwise, or the block has expired. */
export function isEligible(account, now = new Date()) {
  if (!account.exhaustedUntil) return true;
  const until = new Date(account.exhaustedUntil);
  if (Number.isNaN(until.getTime())) return true;
  return until <= now;
}

export function pick(now = new Date()) {
  return list().find((a) => isEligible(a, now)) ?? null;
}

export function markExhausted(name, resetDateISO) {
  const registry = load();
  const account = registry.accounts.find((a) => a.name === name);
  if (!account) throw new Error(`no account "${name}" in ${REGISTRY_FILE}`);
  account.exhaustedUntil = resetDateISO ? new Date(resetDateISO).toISOString() : null;
  save(registry);
  return account;
}

export function clearExhausted(name) {
  return markExhausted(name, null);
}

export function upsert(record) {
  if (!record?.name) throw new Error("an account record needs a name");
  const registry = load();
  const at = registry.accounts.findIndex((a) => a.name === record.name);
  const merged = normalise({ ...(at === -1 ? {} : registry.accounts[at]), ...record });
  if (!merged.updatesUrl && merged.projectId)
    merged.updatesUrl = `https://u.expo.dev/${merged.projectId}`;
  if (at === -1) registry.accounts.push(merged);
  else registry.accounts[at] = merged;
  save(registry);
  return merged;
}

export function remove(name) {
  const registry = load();
  const before = registry.accounts.length;
  registry.accounts = registry.accounts.filter((a) => a.name !== name);
  if (registry.accounts.length === before) throw new Error(`no account "${name}"`);
  save(registry);
}

// ---------------------------------------------------------------------------
// Reactive detection — read the block off the build output.
// ---------------------------------------------------------------------------

/**
 * eas-cli rethrows the server's message unchanged, so both the coded form and
 * the prose form can appear depending on whether EAS_DEBUG dumped the GraphQL
 * error alongside it. Match either.
 */
const EXHAUSTED_PATTERNS = [
  /EAS_BUILD_FREE_TIER_(?:IOS_|ANDROID_)?LIMIT_EXCEEDED/,
  /has used its (?:iOS |Android )?builds from the Free plan this month/i,
  /used all .{0,20}(?:iOS |Android )?builds .{0,30}Free plan/i,
];

/** `(on Tue Sep 01 2026)` — the server spells the reset date out in the message. */
const RESET_ON = /which will reset (?:in [^()]*)?\(on ([A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4})\)/;
/** `will reset in 7 days` — relative fallback when the parenthetical is absent. */
const RESET_IN = /will reset in (\d+) days?/i;

/**
 * @returns {{exhausted: boolean, resetISO: string|null, evidence: string|null}}
 */
export function detectExhaustion(output, now = new Date()) {
  const text = String(output ?? "");
  const hit = EXHAUSTED_PATTERNS.find((re) => re.test(text));
  if (!hit) return { exhausted: false, resetISO: null, evidence: null };

  let resetISO = null;
  const onMatch = text.match(RESET_ON);
  if (onMatch) {
    const parsed = new Date(`${onMatch[1]} 00:00:00 UTC`);
    if (!Number.isNaN(parsed.getTime())) resetISO = parsed.toISOString();
  }
  if (!resetISO) {
    const inMatch = text.match(RESET_IN);
    if (inMatch)
      resetISO = new Date(now.getTime() + Number(inMatch[1]) * 86400_000).toISOString();
  }
  // Nothing parseable: block until the start of next month, which is when every
  // Expo billing period observed so far rolls over.
  if (!resetISO)
    resetISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  const line = text.split(/\r?\n/).find((l) => hit.test(l)) ?? null;
  return { exhausted: true, resetISO, evidence: line?.trim() ?? null };
}

// ---------------------------------------------------------------------------
// Proactive detection — ask the API before queueing anything.
// ---------------------------------------------------------------------------

const GRAPHQL = "https://api.expo.dev/graphql";

/** The session `eas login` left behind, used when an account has no token. */
export function ambientSessionSecret() {
  try {
    const state = JSON.parse(readFileSync(join(homedir(), ".expo", "state.json"), "utf8"));
    return { secret: state?.auth?.sessionSecret ?? null, username: state?.auth?.username ?? null };
  } catch {
    return { secret: null, username: null };
  }
}

const USAGE_QUERY = `query AccountBuildUsage($name: String!, $date: DateTime!) {
  account {
    byName(accountName: $name) {
      id
      name
      subscription { name planId }
      usageMetrics {
        byBillingPeriod(date: $date, service: BUILDS) {
          billingPeriod { start end }
          planMetrics {
            serviceMetric
            value
            limit
            platformBreakdown { ios { value limit } android { value limit } }
          }
        }
      }
    }
  }
}`;

/**
 * Live build-quota reading for one account.
 *
 * Auth precedence mirrors eas-cli's own SessionManager: EXPO_TOKEN wins, and the
 * stored login session is the fallback. An account with neither is unreadable,
 * which is a `null` result and not an error — the caller falls back to reactive
 * detection rather than refusing to build.
 *
 * @returns {Promise<null | {plan: string, periodStart: string, periodEnd: string,
 *   platform: {used: number, limit: number}, aggregate: {used: number, limit: number},
 *   exhausted: boolean}>}
 */
export async function quota(account, { platform = "ios", fetchImpl = fetch } = {}) {
  const headers = { "content-type": "application/json" };
  if (account.expoToken) headers.authorization = `Bearer ${account.expoToken}`;
  else {
    const ambient = ambientSessionSecret();
    // The query is scoped by account name, so a session that lacks access to
    // that account simply reads nothing back — there is no wrong-account risk in
    // trying, and trying is what makes organisations readable from a personal
    // login.
    if (!ambient.secret) return null;
    headers["expo-session"] = ambient.secret;
  }

  let body;
  try {
    const res = await fetchImpl(GRAPHQL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: USAGE_QUERY,
        variables: { name: account.owner, date: new Date().toISOString() },
      }),
    });
    body = await res.json();
  } catch {
    return null;
  }
  const period = body?.data?.account?.byName?.usageMetrics?.byBillingPeriod;
  if (!period) return null;

  const builds = (period.planMetrics ?? []).find((m) => m.serviceMetric === "BUILDS");
  if (!builds) return null;
  const per = builds.platformBreakdown?.[platform] ?? null;
  const used = per?.value ?? builds.value;
  const limit = per?.limit ?? builds.limit;

  return {
    plan: body.data.account.byName.subscription?.name ?? "unknown",
    periodStart: period.billingPeriod?.start ?? null,
    periodEnd: period.billingPeriod?.end ?? null,
    platform: { used, limit },
    aggregate: { used: builds.value, limit: builds.limit },
    exhausted: limit > 0 && used >= limit,
  };
}

// ---------------------------------------------------------------------------
// CLI — enough to register a real account without hand-editing the JSON.
// ---------------------------------------------------------------------------

const USAGE = `usage: node scripts/eas-accounts.mjs <command>

  list                                   print the registry
  quota [name]                           live build-quota reading (all, or one account)
  add --name N --owner O [--project-id P] [--email E] [--token T] [--note "..."]
                                         omit --project-id for a TRANSFERRED project:
                                         the id never changes on transfer, so only the
                                         owner moves and the OTA install base stays whole
  set --name N [any of the add flags]    update an existing record
  token --name N [--stdin]               store an EXPO_TOKEN (prompted, or from stdin)
  clear --name N                         drop the exhausted-until block
  remove --name N                        delete a record

Registry: ${REGISTRY_FILE} (0600)`;

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) flags[key] = true;
    else {
      flags[key] = next;
      i += 1;
    }
  }
  return flags;
}

const recordFromFlags = (f) => ({
  name: f.name,
  email: f.email,
  owner: f.owner ?? f.name,
  projectId: f["project-id"],
  updatesUrl: f["updates-url"],
  expoToken: f.token,
  note: f.note,
});

async function main(argv) {
  const [command, ...rest] = argv;
  const flags = parseFlags(rest);

  switch (command) {
    case "list":
    case undefined:
      process.stdout.write(`${JSON.stringify(load(), null, 2)}\n`);
      return 0;

    case "quota": {
      const accounts = rest[0] && !rest[0].startsWith("--") ? [get(rest[0])] : list();
      for (const account of accounts) {
        if (!account) {
          process.stderr.write("no such account\n");
          return 1;
        }
        const q = await quota(account);
        process.stdout.write(
          q
            ? `${account.name}: ${q.plan} plan · ios ${q.platform.used}/${q.platform.limit}` +
              ` · all platforms ${q.aggregate.used}/${q.aggregate.limit}` +
              ` · period ends ${q.periodEnd} · ${q.exhausted ? "EXHAUSTED" : "ok"}\n`
            : `${account.name}: quota unreadable (no usable credential for this account)\n`,
        );
      }
      return 0;
    }

    case "add":
    case "set": {
      if (!flags.name) {
        process.stderr.write("--name is required\n");
        return 1;
      }
      const record = recordFromFlags(flags);
      for (const k of Object.keys(record)) if (record[k] === undefined) delete record[k];
      const saved = upsert(record);
      process.stdout.write(
        `${command === "add" ? "added" : "updated"} ${saved.name} → ${REGISTRY_FILE}\n`,
      );
      return 0;
    }

    case "token": {
      if (!flags.name) {
        process.stderr.write("--name is required\n");
        return 1;
      }
      let token = typeof flags.token === "string" ? flags.token : null;
      if (!token && flags.stdin) token = readFileSync(0, "utf8").trim();
      if (!token) {
        // Never echo a bearer credential into the scrollback.
        const read = spawnSync("/bin/sh", ["-c", 'read -rs -p "EXPO_TOKEN: " t && echo "$t"'], {
          encoding: "utf8",
          stdio: ["inherit", "pipe", "inherit"],
        });
        process.stderr.write("\n");
        token = read.stdout?.trim() ?? "";
      }
      if (!token) {
        process.stderr.write("no token given — nothing stored\n");
        return 1;
      }
      upsert({ name: flags.name, expoToken: token });
      process.stdout.write(`stored a token for ${flags.name} (${token.length} chars)\n`);
      return 0;
    }

    case "clear":
      if (!flags.name) {
        process.stderr.write("--name is required\n");
        return 1;
      }
      clearExhausted(flags.name);
      process.stdout.write(`${flags.name} is eligible again\n`);
      return 0;

    case "remove":
      if (!flags.name) {
        process.stderr.write("--name is required\n");
        return 1;
      }
      remove(flags.name);
      process.stdout.write(`removed ${flags.name}\n`);
      return 0;

    default:
      process.stderr.write(`${USAGE}\n`);
      return command === "--help" || command === "-h" ? 0 : 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`)
  main(process.argv.slice(2)).then((code) => process.exit(code));
