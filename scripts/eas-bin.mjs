/**
 * Resolve the eas-cli this repo should run.
 *
 * `npx --yes eas-cli@latest` — what every script here used to call — downloads a
 * fresh copy into the npx cache on every resolve. That is why the local Apple
 * token-lifetime patch kept disappearing: it was applied to a cache entry that
 * npx replaces. The repo pins eas-cli as a devDependency and patches it from
 * `postinstall` (scripts/patch-eas-jwt.mjs), so the local binary is the only one
 * that is reliably correct.
 *
 * The npx form stays as a fallback so a clean checkout without node_modules
 * still works — it just authenticates to Apple with an unpatched 1200 s token.
 */
import { accessSync, constants } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./eas-switch.mjs";

export const LOCAL_EAS = join(ROOT, "node_modules", ".bin", "eas");

export function hasLocalEas(path = LOCAL_EAS) {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * `easCommand(["build", "--platform", "ios"])` → `{ command, args, local }`,
 * ready to spawn.
 */
export function easCommand(args, { path = LOCAL_EAS } = {}) {
  if (hasLocalEas(path)) return { command: path, args: [...args], local: true };
  return { command: "npx", args: ["--yes", "eas-cli@latest", ...args], local: false };
}
