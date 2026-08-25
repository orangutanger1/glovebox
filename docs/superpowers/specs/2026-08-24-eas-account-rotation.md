# EAS account rotation — 2026-08-24

`scripts/eas-build.mjs` will build under a different Expo account when the
current one has no free-tier iOS builds left. This is what it costs, and where it
is not safe to use. Written because the expensive parts are all invisible: the
OTA break shows up weeks later as users who stop receiving updates, and the
credential ceiling shows up as a build that cannot be finished non-interactively.

Every number and every quoted string below was read off the live API, the
installed `eas-cli@20.5.1` sources, or the primary vendor doc. Nothing here is
inferred.

## The state that prompted it

`mayfield`, Free plan, verified live from `account.usageMetrics`:

| metric | value | limit |
| --- | ---: | ---: |
| BUILDS, all platforms | 15 | 30 |
| BUILDS, iOS | **15** | **15** |
| BUILDS, Android | 0 | 15 |

Billing period `2026-08-01Z → 2026-09-01Z`. iOS is spent; the aggregate is only
half used. Version 1.0.2 / buildNumber 14 carries two native changes (PostHog
SDK, AdServices attribution), so OTA cannot substitute for a binary.

## The quota is readable programmatically — no guessing required

`eas` has no `quota` command, but the dashboard's number is a plain GraphQL field
and the session already on this host can read it:

```graphql
account { byName(accountName: $name) {
  subscription { name planId }
  usageMetrics { byBillingPeriod(date: $now, service: BUILDS) {
    billingPeriod { start end }
    planMetrics { serviceMetric value limit
                  platformBreakdown { ios { value limit } android { value limit } } }
  } }
} }
```

Auth is `Authorization: Bearer $EXPO_TOKEN`, or `expo-session:` with the
`auth.sessionSecret` that `eas login` leaves in `~/.expo/state.json`.

Two traps:

- **The aggregate lies.** `planMetrics[0]` is 15/30 while iOS is 15/15. Only
  `platformBreakdown.ios` answers "can this account build iOS". eas-cli's own
  pre-build warning (`build/utils/usage/checkForOverages.js`) reads the aggregate,
  which is why it prints nothing at all in this state.
- **`byBillingPeriod` needs `date: DateTime!`.** Omitting it is a validation
  error, not a default-to-now.

`billingPeriod.end` is the reset instant, so `exhaustedUntil` is a fact rather
than an estimate. `eas-build.mjs` reads this *before* queueing anything, so a
build that cannot succeed is never uploaded.

Reactive detection stays as the fallback for accounts whose credential cannot be
read. The server returns `errorCode: EAS_BUILD_FREE_TIER_IOS_LIMIT_EXCEEDED` and
eas-cli rethrows the server's message *verbatim* — `build/build/build.js` maps
the code to an error class and passes `graphQLErrors[0].message` straight into
it, and the class body is empty. So the text is the contract:

```
This account has used its iOS builds from the Free plan this month,
which will reset in 7 days (on Tue Sep 01 2026).
```

`detectExhaustion()` matches the code and the prose, and parses the reset date out
of the parenthetical.

## Rotating breaks OTA for every binary already in the field

This is the part that cannot be undone later.

An Expo account switch is an **EAS project** switch, and `expo.updates.url` is
derived from the project id — `https://u.expo.dev/<projectId>`. That URL is
compiled into the binary at build time; `expo-updates` in an installed app asks
the URL it was built with and nothing else. There is no server-side redirect and
no way to repoint an app that is already on a phone.

The update policy is (from `eas-update/how-it-works`): platform must match
exactly, `runtimeVersion` must match exactly, and a channel resolves to a branch
**inside one project**. All three are scoped to the project.

Consequences, concretely:

- `runtimeVersion` is `{ "policy": "appVersion" }` → `"1.0.2"`. That string is
  unchanged by rotation, so it is *not* the thing that protects you. Two binaries
  can both claim runtime `1.0.2` and still be permanently unreachable from each
  other, because they poll different hosts.
- The `production` channel exists once per project. After a rotation there are
  two `production` channels in two accounts, and `ship ota` publishes to whichever
  project `app.json` currently names. Publishing to the wrong one is silent: the
  update succeeds, the branch gets a new revision, and zero installed clients see
  it.
- Users on the current TestFlight/App Store build (project
  `fd84867d-9447-4a57-991a-d7e6a8ef1ac6`, owner `mayfield`) keep receiving updates
  only from `mayfield`. A build shipped from account B serves only its own
  installs. **The install base splits permanently along the build that produced
  it.**

Therefore: rotation is safe for a build that will be **superseded** — a
TestFlight build, a build that is about to be replaced by an App Store release
from the primary account — and unsafe for anything that will need OTA hotfixes
for months. If a rotated build reaches the App Store, `mayfield` must never again
be the account that publishes production updates, because the users who upgrade
to it will silently stop hearing from it.

`ship ota` is additionally gated on `.asc/native-lock.json`, which `ship build`
writes from the *tree* that was built. It records native dependency and expo-config
fingerprints, not the account, so a rotated build still leaves a usable baseline —
but the baseline says nothing about which project can serve it.

## iOS credentials: `credentialsSource: remote`, one Apple team, three certificates

Distribution certificates belong to the **Apple team**, not to the Expo account
(Apple: "Distribution certificates belong to the team and only one type of each
distribution certificate … is allowed"). eas-cli states the operational ceiling
in its own words:

> You can have only **three** Apple Distribution Certificates generated on your
> Apple Developer account. Revoke the old ones or reuse existing from your other
> apps. Remember that Apple Distribution Certificates are not application specific!

Live state of team `X36WU56Z39` (Nakodan Capital LLC), read from the account:

| serial | portal id | expires | held by |
| --- | --- | --- | --- |
| `63A8A070CA569B13EFD11381392D5E06` | `TYK5GP92RL` | 2027-01-17 | Expo account `mayfield` |

**One of three used. Each new Expo account that generates its own remote
credentials burns another.** Two rotations and the team is at the ceiling.

The certificate cannot be shared between Expo accounts through Expo: account B
can *see* the certificate exists on the Apple side, but the private key is only
retrievable at creation time, and the `.p12` sits in account A's credential store.
Account B has no read access to it, so its only option is to generate.

### The failure mode when the ceiling is hit

`ship build` runs eas-cli with `--non-interactive`. In that mode the recovery path
is closed:

```
Maximum number of Distribution Certificates generated on Apple Developer Portal.
Error: Start the CLI without the '--non-interactive' flag to revoke existing certificates.
```

The build stops after the project archive has already been uploaded. It is not a
quota error, so `eas-build.mjs` correctly does *not* rotate past it — rotating
would hit the same Apple ceiling from every account. Recovery is manual: run
`eas credentials` interactively and revoke, which is safe for App Store builds
("Distribution Certificates can be revoked with no side effects for App Store
builds") but immediately invalidates any local signing setup that used the revoked
cert.

### Which configuration is safe

**`credentialsSource: local` with a checked-out `credentials.json` is the correct
configuration for rotation.** Reasoning:

- With `remote` (the current, unset default), account B's first build generates a
  new distribution certificate. Certificates are consumed per Expo account, the
  team ceiling is three, and nothing warns before the third.
- With `local`, every account signs with the *same* certificate — the one already
  issued to `X36WU56Z39` — so rotation consumes zero certificates regardless of
  how many accounts join. eas-cli reads exactly this shape from the project root:

  ```json
  {
    "ios": {
      "provisioningProfilePath": "ios/certs/profile.mobileprovision",
      "distributionCertificate": {
        "path": "ios/certs/dist.p12",
        "password": "<from env, never committed>"
      }
    }
  }
  ```

  (`build/credentials/credentialsJson/read.js` base64-encodes both files at build
  time.) `eas credentials` can export the existing pair into that layout.

- The cost of `local` is that the `.p12`, the profile and the password become the
  operator's problem: they must not be committed, and `--refresh-ad-hoc-provisioning-profile`
  stops working (`credentialsSource "local"` rejects it outright). Provisioning
  profiles, unlike certificates, are freely regenerable and not the constraint.

This is **not configured yet** — `eas.json` sets no `credentialsSource`, so builds
are on `remote`. Switching is a prerequisite for the *second* rotation, not the
first: the first rotation has two certificate slots of headroom.

## Expo's terms do not permit extra free accounts

Expo's Terms of Service (last updated 2025-05-29, effective 2025-06-30), §2.3
Account Terms, states: "Accounts registered by 'bots,' 'agents,' or other
automated methods or means are not permitted," and "You may not maintain more
than one account for any individual person or entity without payment." Operating
a second free Expo account in order to obtain additional free builds is therefore
a breach of §2.3, and §7.2 permits Expo to suspend or terminate access for any
non-compliance without notice. The sanctioned ways to build more than the Free
plan allows are to pay for an EAS plan
(`https://expo.dev/accounts/mayfield/settings/billing`), or to wait for the
billing period to reset — for this account, `2026-09-01T00:00:00Z`.

Rotation as built here is legitimate where the additional accounts are ones the
operator genuinely holds: a paid account, an organisation account under a paid
plan, a client's account, or a teammate's account that has granted access. The
tooling asks for an account name and a token; it does not create accounts.

## What the scripts do

| file | role |
| --- | --- |
| `scripts/eas-accounts.mjs` | registry at `~/.omp/eas/accounts.json` (dir 0700, file 0600); `load/save/list/pick/markExhausted`, live `quota()`, `detectExhaustion()`; CLI: `list`, `quota`, `add`, `set`, `token`, `clear`, `remove` |
| `scripts/eas-switch.mjs` | `apply(name)` / `restore()` over `app.json` and `ship.config.json` |
| `scripts/eas-build.mjs` | the rotation loop; `--status`, `--live`, `--dry-run`, `--profile`, `--platform`, `--no-probe`, `--raw-eas` |

Tokens live in `~/.omp/eas/accounts.json`, never in the repo, because an
`EXPO_TOKEN` is a bearer credential for an entire Expo account.

`eas-build.mjs` prefers `ship build` over raw eas-cli whenever `ship` is on PATH,
because `ship build` also writes `.asc/native-lock.json`; calling eas-cli directly
skips that and leaves `ship ota` with nothing to diff against. `--raw-eas` forces
`npx --yes eas-cli@latest build --platform ios --profile production --non-interactive`.

### Why the config is edited by splicing, not by re-serialising

`app.json` is 2-space indented; `ship.config.json` is tab indented. A
`JSON.parse` → `JSON.stringify` round-trip reformats one of them on every build
and cannot reproduce the original bytes on restore. `eas-switch.mjs` therefore
walks the raw text, locates the offsets of the five string literals it owns, and
replaces only the bytes inside those quotes. Verified: applying and restoring
leaves both files byte-identical (`cmp` clean), and `git diff --stat` is
unchanged.

The five literals:

| file | path |
| --- | --- |
| `app.json` | `expo.owner`, `expo.extra.eas.projectId`, `expo.updates.url` |
| `ship.config.json` | `eas.owner`, `eas.projectId` |

Note that `"projectId"` occurs twice in `ship.config.json` — under `eas` and under
`revenuecat`. The walker is path-addressed and asserts exactly one match, so a
future third occurrence fails loudly instead of being rewritten by accident.

### Crash safety

Originals are copied to `~/.omp/eas/backups/` and a state file recording their
SHA-256 is written **before** the first mutation. `restore()` is a no-op when no
switch is in effect, runs in a `finally`, and is also wired to `SIGINT`/`SIGTERM`.
Because the state lives outside the process, a `SIGKILL` mid-build is recoverable
from a *later* process with `node scripts/eas-switch.mjs --restore`. Verified by
killing a switching process with `SIGKILL` and recovering byte-identically.

A non-quota build failure deliberately does **not** rotate — a broken build, a
signing problem or an Apple ceiling fails identically under every account, and
rotating would only spend other accounts' quota reproducing it.

## Before the first rotation

1. Register the second account and store its token:
   `node scripts/eas-accounts.mjs add --name <n> --owner <o> --project-id <id>`
   then `node scripts/eas-accounts.mjs token --name <n>`. The project id must
   already exist in that account — with a token, `eas` refuses to build a project
   it cannot resolve, so run `EXPO_TOKEN=… eas init --force --non-interactive`
   there first.
2. Decide whether the build is superseded or long-lived. If long-lived, do not
   rotate; the OTA split above is permanent.
3. Move to `credentialsSource: local` before the *second* rotation, or plan on
   revoking certificates interactively when the team hits three.
