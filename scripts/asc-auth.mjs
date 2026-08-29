/**
 * Apple authentication for every eas-cli child this repo spawns.
 *
 * Two separate failures used to surface as the same symptom — eas-cli quietly
 * asking for an Apple ID password:
 *
 *   1. No usable API key, so eas-cli fell back to interactive Apple ID login
 *      (credentials/ios/appstore/resolveCredentials.js only takes the API-key
 *      path when one of EXPO_ASC_API_KEY_PATH / EXPO_ASC_KEY_ID /
 *      EXPO_ASC_ISSUER_ID is set). `loadAscEnv` supplies all three from
 *      `.asc.env`, plus EXPO_APPLE_TEAM_ID, which authenticate.js reads instead
 *      of prompting for the team.
 *
 *   2. A correct key rejected by Apple because this machine's clock is fast.
 *      eas-cli mints `exp = now + 1200`, exactly Apple's ceiling, and Apple
 *      compares against *its* clock: a local clock even one second ahead makes
 *      the token look 1201 s long and Apple answers 401 NOT_AUTHORIZED, which
 *      eas-cli reports as failed authentication and then offers the password
 *      prompt. Measured against api.appstoreconnect.apple.com with a valid key
 *      on a 1.1 s fast clock: ttl 1199 → 200, ttl 1200 → 401, ttl 1200
 *      backdated 2 s → 200. After `sudo hwclock -s`: ttl 1200 → 200.
 *      `assertAppleAuthUsable` probes for exactly that, and distinguishes it
 *      from a dead key.
 */
import { createPrivateKey, sign } from "node:crypto";
import { accessSync, constants, readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./eas-switch.mjs";

export const ASC_ENV_FILE = join(ROOT, ".asc.env");

/** Apple's hard ceiling on ASC token lifetime, in seconds. */
export const APPLE_JWT_MAX_SECONDS = 1200;

/** eas-cli's stock lifetime: exactly the ceiling, leaving no room for skew. */
export const EAS_JWT_SECONDS = 1200;

const EAS_AUTHENTICATE_JS = join(
  ROOT,
  "node_modules/eas-cli/build/credentials/ios/appstore/authenticate.js",
);

/**
 * The lifetime the eas-cli that will actually run asks Apple for.
 *
 * Reading it beats assuming it: the pinned local copy is patched down to 600 s
 * by scripts/patch-eas-jwt.mjs, and probing 1200 s against a machine whose clock
 * is a second fast would then fail a preflight for a build that works.
 */
export function easTokenSeconds({ file = EAS_AUTHENTICATE_JS } = {}) {
  try {
    const found = /const jwtDurationSeconds = (\d+);/.exec(readFileSync(file, "utf8"));
    if (found) return Number(found[1]);
  } catch {
    /* not installed locally — npx will fetch a stock copy */
  }
  return EAS_JWT_SECONDS;
}

/**
 * Minimal KEY=VALUE reader. Deliberately not a dotenv clone: no interpolation,
 * no `export` prefix, no multi-line values — anything this file needs to hold is
 * a flat identifier or a path.
 */
export function parseEnvFile(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length > 1 && /^(".*"|'.*')$/s.test(value)) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

/**
 * Merge `.asc.env` into `env` and return it.
 *
 * The ambient environment wins: a var exported by the caller is a deliberate
 * override for that one run, and silently replacing it would make the override
 * untestable. A missing file is not an error — EAS holds the same key
 * server-side, so builds work without it; it only removes the local fallback.
 */
export function loadAscEnv(env, { file = ASC_ENV_FILE, warn } = {}) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return env;
  }
  const vars = parseEnvFile(text);
  for (const [key, value] of Object.entries(vars)) if (env[key] === undefined) env[key] = value;

  const keyPath = env.EXPO_ASC_API_KEY_PATH;
  if (keyPath && warn) {
    try {
      accessSync(keyPath, constants.R_OK);
    } catch {
      warn(
        `.asc.env points EXPO_ASC_API_KEY_PATH at ${keyPath}, which is not readable — ` +
          `eas-cli will fall back to an interactive Apple ID login\n`,
      );
    }
  }
  return env;
}

/**
 * Ask Apple whether a token exactly like eas-cli's is acceptable right now.
 *
 * The first version of this file measured clock skew from Apple's `Date`
 * response header and refused to build when the machine looked more than half a
 * second fast. That was wrong twice over: HTTP `Date` has one-second resolution
 * and is floor-truncated, and the local reading is taken a round-trip later, so
 * the estimate runs 0–1000 ms plus latency *high*. It reported 1.1–1.5 s of skew
 * on a correctly synced clock — three reads 0.3 s apart disagreed by 320 ms,
 * which no clock does — and blocked a build that would have succeeded.
 *
 * So do not estimate. eas-cli's authentication succeeds or fails on exactly one
 * question: does Apple accept `exp = local_now + 1200`? Mint that token and ask.
 * One request, no arithmetic, and the answer is the thing being predicted.
 */
const CERTS_URL = "https://api.appstoreconnect.apple.com/v1/certificates?limit=1";
const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

/**
 * ES256 ASC token. `backdateSeconds` exists only to separate the two reasons
 * Apple answers 401: a token that fails at offset 0 but passes when backdated
 * indicts the clock, and one that fails both ways indicts the key.
 */
export function mintAscToken({ keyPem, keyId, issuerId, ttlSeconds = EAS_JWT_SECONDS, backdateSeconds = 0 }) {
  const key = createPrivateKey(keyPem);
  const iat = Math.floor(Date.now() / 1000) - backdateSeconds;
  const head = b64u({ alg: "ES256", kid: keyId, typ: "JWT" });
  const body = b64u({ iss: issuerId, iat, exp: iat + ttlSeconds, aud: "appstoreconnect-v1" });
  const sig = sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${sig.toString("base64url")}`;
}

export const SKEW_REMEDY =
  "this machine's clock is ahead of Apple's, and eas-cli leaves no headroom.\n" +
  "  Durable fix:  npm install   (postinstall shortens eas-cli's token to 600s)\n" +
  "  Stopgap:      w32tm /resync (Windows, admin) or sudo hwclock -s (WSL)\n";

export const KEY_REMEDY =
  "the key itself is rejected — revoked, wrong issuer, or wrong Apple team.\n" +
  "  Regenerate at App Store Connect → Users and Access → Integrations → Team Keys (role Admin),\n" +
  "  then update .asc.env. EAS holds its own copy; update it with `npx eas-cli credentials -p ios`.\n";

/**
 * Preflight for a run that may authenticate to Apple locally.
 *
 * Returns `ok` for every state that is not a proven rejection: no key
 * configured, unreachable network, an unexpected status. A preflight that
 * guesses is what produced the false positive above — it may only block on an
 * answer Apple actually gave.
 */
export async function assertAppleAuthUsable({
  write,
  env = process.env,
  fetchImpl = fetch,
  timeoutMs = 15000,
  ttlSeconds = easTokenSeconds(),
} = {}) {
  const emit = write ?? ((s) => process.stdout.write(s));
  const keyPath = env.EXPO_ASC_API_KEY_PATH;
  const keyId = env.EXPO_ASC_KEY_ID;
  const issuerId = env.EXPO_ASC_ISSUER_ID;
  if (!keyPath || !keyId || !issuerId) {
    emit("apple auth: skipped — no local ASC key configured (EAS credentials are used server-side)\n");
    return { ok: true, level: "skipped" };
  }

  let keyPem;
  try {
    keyPem = readFileSync(keyPath, "utf8");
  } catch (err) {
    emit(`apple auth: FAILED — cannot read ${keyPath} (${err.code ?? err.message})\n`);
    return { ok: false, level: "fatal", reason: "unreadable-key" };
  }

  const ask = async (backdateSeconds) => {
    const token = mintAscToken({ keyPem, keyId, issuerId, ttlSeconds, backdateSeconds });
    const res = await fetchImpl(CERTS_URL, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.status;
  };

  let status;
  try {
    status = await ask(0);
  } catch (err) {
    emit(`apple auth: skipped — could not reach Apple (${err.message})\n`);
    return { ok: true, level: "skipped" };
  }

  if (status === 200) {
    emit(`apple auth: key ${keyId} accepted with a ${ttlSeconds}s token — the lifetime eas-cli will ask for\n`);
    return { ok: true, level: "ok", status };
  }
  if (status !== 401) {
    emit(`apple auth: inconclusive — Apple answered ${status}; not blocking\n`);
    return { ok: true, level: "warn", status };
  }

  // 401 at full lifetime. Backdating removes the clock from the equation, so
  // whichever way this goes names the actual culprit.
  let backdated;
  try {
    backdated = await ask(30);
  } catch {
    backdated = null;
  }
  if (backdated === 200) {
    emit(
      `apple auth: FAILED — key ${keyId} is rejected at ${ttlSeconds}s but accepted when backdated 30s.\n` +
        `Apple enforces exp - its own now <= ${APPLE_JWT_MAX_SECONDS}s, and this eas-cli asks for ${ttlSeconds}s,\n` +
        `so a fast clock pushes every token past the ceiling and eas-cli falls back to a password prompt.\n` +
        SKEW_REMEDY,
    );
    return { ok: false, level: "fatal", reason: "clock" };
  }
  emit(`apple auth: FAILED — key ${keyId} rejected (401) at every lifetime tried.\n${KEY_REMEDY}`);
  return { ok: false, level: "fatal", reason: "key" };
}
