#!/usr/bin/env node
/**
 * Point this repo's config at a different Expo account, and put it back.
 *
 * Five values decide which EAS account a build lands in:
 *
 *   app.json         expo.owner                  ← which account owns the build
 *                    expo.extra.eas.projectId    ← which project inside it
 *                    expo.updates.url            ← baked into the binary
 *   ship.config.json eas.owner
 *                    eas.projectId
 *
 * They are rewritten by *splicing the string literals in place*, not by
 * JSON.parse -> JSON.stringify. A round-trip would reformat both files —
 * app.json is 2-space indented, ship.config.json is tab indented — and the
 * restore afterwards would then have to reproduce the original byte-for-byte
 * from a parsed object, which it cannot. Splicing means the only bytes that
 * change are the ones inside the quotes, so `git diff` shows five lines during a
 * build and nothing at all after the restore.
 *
 * Crash safety does not rely on this process living long enough to clean up: the
 * originals are copied to ~/.omp/eas before the first byte is written and a
 * state file records where they went. A later `--restore` — different process,
 * after a kill -9, whatever — finds that state and puts the files back.
 */
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { get as getAccount, REGISTRY_DIR } from "./eas-accounts.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const STATE_FILE = join(
  REGISTRY_DIR,
  `switch-state-${createHash("sha1").update(ROOT).digest("hex").slice(0, 12)}.json`,
);

/**
 * Which literal in which file carries which piece of account identity.
 *
 * `owner` is the only piece that always moves. The other two are marked
 * optional because there are two ways to build under a different account, and
 * only one of them changes the project:
 *
 * - **Transfer** (preferred). One EAS project, moved between accounts from the
 *   dashboard. The project id never changes on transfer, so `updates.url` —
 *   which is baked into every binary — stays put and the OTA install base stays
 *   whole. A registry record for this mode carries `owner` alone.
 * - **Separate projects**. A distinct EAS project per account, which does
 *   change `updates.url` and therefore permanently splits the install base: a
 *   binary built under account B can only ever receive updates from B. A record
 *   for this mode carries `projectId` and `updatesUrl` too.
 */
const TARGETS = [
  { file: "app.json", path: ["expo", "owner"], from: "owner" },
  { file: "app.json", path: ["expo", "extra", "eas", "projectId"], from: "projectId", optional: true },
  { file: "app.json", path: ["expo", "updates", "url"], from: "updatesUrl", optional: true },
  { file: "ship.config.json", path: ["eas", "owner"], from: "owner" },
  { file: "ship.config.json", path: ["eas", "projectId"], from: "projectId", optional: true },
];

// ---------------------------------------------------------------------------
// Byte-exact JSON literal surgery
// ---------------------------------------------------------------------------

const WS = new Set([" ", "\t", "\n", "\r"]);

function skipWs(text, i) {
  while (i < text.length && WS.has(text[i])) i += 1;
  return i;
}

/** End offset of the string literal starting at `i` (which must be a quote). */
function endOfString(text, i) {
  let j = i + 1;
  while (j < text.length) {
    if (text[j] === "\\") j += 2;
    else if (text[j] === '"') return j + 1;
    else j += 1;
  }
  throw new Error("unterminated string in JSON");
}

/**
 * Walk the value at `i`, recording `{start, end}` into `hits` when the walked
 * path equals `target`. Returns the offset just past the value.
 *
 * A hand-rolled walk rather than a JSON library because offsets are the whole
 * point: nothing in `JSON.parse` will tell you where in the text a value lived.
 */
function walk(text, i, path, target, hits) {
  i = skipWs(text, i);
  const ch = text[i];
  const atTarget =
    path.length === target.length && path.every((seg, n) => String(seg) === String(target[n]));

  if (ch === "{") {
    i += 1;
    for (;;) {
      i = skipWs(text, i);
      if (text[i] === "}") return i + 1;
      if (text[i] === ",") {
        i += 1;
        continue;
      }
      if (text[i] !== '"') throw new Error(`expected an object key at offset ${i}`);
      const keyEnd = endOfString(text, i);
      const key = JSON.parse(text.slice(i, keyEnd));
      i = skipWs(text, keyEnd);
      if (text[i] !== ":") throw new Error(`expected ':' at offset ${i}`);
      i = walk(text, i + 1, [...path, key], target, hits);
    }
  }

  if (ch === "[") {
    i += 1;
    let index = 0;
    for (;;) {
      i = skipWs(text, i);
      if (text[i] === "]") return i + 1;
      if (text[i] === ",") {
        i += 1;
        continue;
      }
      i = walk(text, i, [...path, index], target, hits);
      index += 1;
    }
  }

  const start = i;
  if (ch === '"') i = endOfString(text, i);
  else {
    while (i < text.length && !WS.has(text[i]) && text[i] !== "," && text[i] !== "}" && text[i] !== "]")
      i += 1;
  }
  if (atTarget) hits.push({ start, end: i });
  return i;
}

/** @returns {{start: number, end: number}} offsets of the literal at `path`. */
export function locate(text, path) {
  const hits = [];
  walk(text, 0, [], path, hits);
  if (hits.length !== 1)
    throw new Error(`expected exactly one ${path.join(".")} in this JSON, found ${hits.length}`);
  return hits[0];
}

/**
 * Replace the literals at each `{path, value}` with JSON-encoded `value`,
 * touching nothing else. Applied back-to-front so earlier offsets stay valid.
 */
export function splice(text, edits) {
  const resolved = edits
    .map(({ path, value }) => ({ ...locate(text, path), value }))
    .sort((a, b) => b.start - a.start);
  let out = text;
  for (const { start, end, value } of resolved)
    out = out.slice(0, start) + JSON.stringify(value) + out.slice(end);
  return out;
}

// ---------------------------------------------------------------------------
// apply / restore
// ---------------------------------------------------------------------------

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const readState = () => {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
};

/** Is a switch currently in effect? */
export const applied = () => readState();

/**
 * Rewrite app.json and ship.config.json to build under `name`.
 *
 * Re-entrant: an in-effect switch is restored first, so `apply(a)` then
 * `apply(b)` backs up the pristine files both times rather than snapshotting
 * account a's values as the thing to return to.
 */
export function apply(name) {
  const account = getAccount(name);
  if (!account) throw new Error(`no account "${name}" in the registry`);
  if (!account.owner) throw new Error(`account "${name}" has no owner — cannot switch to it`);
  // A record carrying one of these but not the other would rewrite the project
  // id while leaving the update URL pointing at the old project, which is a
  // binary that checks for updates it can never be served.
  if (Boolean(account.projectId) !== Boolean(account.updatesUrl))
    throw new Error(
      `account "${name}" sets ${account.projectId ? "projectId" : "updatesUrl"} without the other — ` +
        `set both for a separate project, or neither for a transferred one`,
    );
  const moves = TARGETS.filter((t) => !t.optional || account[t.from]);

  if (readState()) restore();

  mkdirSync(REGISTRY_DIR, { recursive: true, mode: 0o700 });
  const backupDir = join(REGISTRY_DIR, "backups");
  mkdirSync(backupDir, { recursive: true, mode: 0o700 });

  const files = [...new Set(moves.map((t) => t.file))];
  const state = { project: ROOT, account: name, appliedAt: new Date().toISOString(), files: [] };

  // Back everything up before mutating anything: a failure halfway through must
  // still leave a complete set of originals on disk.
  const originals = new Map();
  for (const file of files) {
    const abs = join(ROOT, file);
    const bytes = readFileSync(abs);
    const backup = join(backupDir, `${file}.orig`);
    writeFileSync(backup, bytes, { mode: 0o600 });
    originals.set(file, bytes.toString("utf8"));
    state.files.push({ file, backup, sha256: sha256(bytes) });
  }
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  chmodSync(STATE_FILE, 0o600);

  const written = [];
  for (const file of files) {
    const edits = moves.filter((t) => t.file === file).map((t) => ({
      path: t.path,
      value: account[t.from],
    }));
    const next = splice(originals.get(file), edits);
    writeFileSync(join(ROOT, file), next, "utf8");
    written.push(file);
  }
  return { account, files: written, state: STATE_FILE };
}

/**
 * Put the originals back byte-for-byte. A no-op when no switch is in effect, so
 * it is safe in a `finally` that may run before `apply` ever did.
 */
export function restore() {
  const state = readState();
  if (!state) return { restored: [] };
  const restored = [];
  for (const entry of state.files) {
    const bytes = readFileSync(entry.backup);
    if (sha256(bytes) !== entry.sha256)
      throw new Error(`backup ${entry.backup} no longer matches its recorded hash — refusing to restore`);
    writeFileSync(join(state.project, entry.file), bytes);
    restored.push(entry.file);
  }
  rmSync(STATE_FILE, { force: true });
  return { restored, account: state.account };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `usage: node scripts/eas-switch.mjs <account-name>
       node scripts/eas-switch.mjs --restore
       node scripts/eas-switch.mjs --status

Rewrites expo.owner / expo.extra.eas.projectId / expo.updates.url in app.json and
eas.owner / eas.projectId in ship.config.json, preserving every other byte.`;

function main(argv) {
  const arg = argv[0];

  if (!arg || arg === "--help" || arg === "-h") {
    process.stdout.write(`${USAGE}\n`);
    return arg ? 0 : 1;
  }

  if (arg === "--status") {
    const state = readState();
    process.stdout.write(
      state
        ? `switched to ${state.account} at ${state.appliedAt}\n  originals: ${state.files
            .map((f) => f.backup)
            .join("\n             ")}\n`
        : "no switch in effect — config is as committed\n",
    );
    return 0;
  }

  if (arg === "--restore") {
    const { restored, account } = restore();
    process.stdout.write(
      restored.length
        ? `restored ${restored.join(", ")} (was switched to ${account})\n`
        : "nothing to restore\n",
    );
    return 0;
  }

  const { account, files } = apply(arg);
  process.stdout.write(
    `switched to ${account.name}\n` +
      `  owner       ${account.owner}\n` +
      `  projectId   ${account.projectId ?? "unchanged (transferred project)"}\n` +
      `  updates.url ${account.updatesUrl ?? "unchanged (OTA install base stays whole)"}\n` +
      `  rewrote     ${files.join(", ")}\n` +
      `  undo with   node scripts/eas-switch.mjs --restore\n`,
  );
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
