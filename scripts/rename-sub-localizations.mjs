#!/usr/bin/env node
// Strips the stale "Glovebox " prefix from pro_annual_standard (6797750757)
// subscription localizations.
//
// Apple locks SubscriptionLocalization while the subscription is ACTIVE:
//   "Cannot edit SubscriptionLocalization when it is in ACTIVE state"
// The window opens when the subscription re-enters an editable state — i.e. when
// it is attached to a new version submission and moves out of ACTIVE. This polls
// for that window and applies the renames the moment it appears, then exits.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendFileSync, mkdirSync } from "node:fs";

const run = promisify(execFile);

const SUBSCRIPTION_ID = "6797750757";
const PREFIX = "Glovebox ";
const INTERVAL_MS = 30 * 60 * 1000; // 30 min — ASC state changes are not fast
const LOG = ".asc/rename-sub-localizations.log";

mkdirSync(".asc", { recursive: true });

function log(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  process.stdout.write(line);
  appendFileSync(LOG, line);
}

async function asc(args) {
  const { stdout } = await run("asc", args, { maxBuffer: 8 << 20 });
  return stdout;
}

async function pending() {
  const raw = await asc([
    "subscriptions", "localizations", "list",
    "--subscription-id", SUBSCRIPTION_ID,
  ]);
  return (JSON.parse(raw).data ?? [])
    .filter((l) => l.attributes.name.startsWith(PREFIX))
    .map((l) => ({
      id: l.id,
      locale: l.attributes.locale,
      from: l.attributes.name,
      to: l.attributes.name.slice(PREFIX.length),
    }));
}

async function attempt() {
  const todo = await pending();
  if (todo.length === 0) {
    log("nothing left to rename — done");
    return true;
  }

  let ok = 0;
  let locked = 0;
  for (const l of todo) {
    try {
      await asc([
        "subscriptions", "localizations", "update",
        "--id", l.id, "--name", l.to,
      ]);
      log(`renamed ${l.locale}: ${l.from} -> ${l.to}`);
      ok++;
    } catch (err) {
      const msg = String(err.stderr ?? err.message ?? err);
      if (msg.includes("ACTIVE state")) locked++;
      else log(`error ${l.locale}: ${msg.trim().split("\n")[0]}`);
    }
  }

  if (ok > 0) log(`applied ${ok}/${todo.length}`);
  if (locked > 0) log(`${locked} still locked (subscription ACTIVE) — retrying in 30m`);
  return ok === todo.length;
}

log(`watching subscription ${SUBSCRIPTION_ID} for an editable window`);
for (;;) {
  try {
    if (await attempt()) break;
  } catch (err) {
    log(`poll failed: ${String(err.stderr ?? err.message ?? err).trim().split("\n")[0]}`);
  }
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}
log("watcher exiting");
