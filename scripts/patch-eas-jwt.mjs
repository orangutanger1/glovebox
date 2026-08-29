#!/usr/bin/env node
/**
 * Shorten eas-cli's App Store Connect token lifetime, in place, after install.
 *
 * eas-cli asks Apple for `exp = local_now + 1200`, which is exactly Apple's
 * ceiling, so the token is valid only if this machine's clock is not ahead of
 * Apple's by even one second. On this workstation (WSL2) it always is: the
 * offset against an unbiased reference measured +1162 ms, then +370 ms thirty
 * seconds later — WSL periodically resyncs to the Windows host and the clock
 * runs ahead in between. Measured effect, with a valid key on /v1/certificates:
 * ttl 1200 → 401 at +1.1 s, → 200 immediately after a resync, → 401 again four
 * seconds later. `sudo hwclock -s` therefore fixes it for seconds at a time,
 * which is not a fix.
 *
 * 600 s is Apple's own documented example lifetime and leaves ten minutes of
 * headroom for skew, which is far more than the observed band. Nothing else
 * about the request changes.
 *
 * This runs from `postinstall`, so it survives `npm ci` and any reinstall of the
 * pinned devDependency. It does not survive `npx eas-cli@latest`, which fetches
 * its own copy — that is why the repo pins eas-cli and scripts/eas-bin.mjs
 * prefers the local binary.
 */
import { readFileSync, writeFileSync } from "node:fs";

const TARGET = new URL(
  "../node_modules/eas-cli/build/credentials/ios/appstore/authenticate.js",
  import.meta.url,
);

const WANT = 600;
const PATTERN = /const jwtDurationSeconds = (\d+);[^\n]*/;

function main() {
  let source;
  try {
    source = readFileSync(TARGET, "utf8");
  } catch {
    // eas-cli is optional for anyone who only runs the app or the tests.
    process.stdout.write("patch-eas-jwt: eas-cli not installed, nothing to patch\n");
    return 0;
  }

  const found = PATTERN.exec(source);
  if (!found) {
    process.stderr.write(
      "patch-eas-jwt: could not find `jwtDurationSeconds` in eas-cli — upstream changed.\n" +
        "  Re-check credentials/ios/appstore/authenticate.js before trusting local Apple auth.\n",
    );
    return 1;
  }

  const current = Number(found[1]);
  if (current === WANT) {
    process.stdout.write(`patch-eas-jwt: already ${WANT}s\n`);
    return 0;
  }

  writeFileSync(
    TARGET,
    source.replace(
      PATTERN,
      `const jwtDurationSeconds = ${WANT}; // patched from ${current}: see scripts/patch-eas-jwt.mjs`,
    ),
  );
  process.stdout.write(`patch-eas-jwt: ${current}s -> ${WANT}s\n`);
  return 0;
}

process.exit(main());
