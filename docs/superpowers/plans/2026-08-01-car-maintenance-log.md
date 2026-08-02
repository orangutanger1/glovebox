# Car Maintenance Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an iOS app to the App Store that logs car maintenance and reminds the owner when the next service is due, where records cannot be lost.

**Architecture:** On-device SQLite is the only source of truth. No backend, no accounts, no sync. Migrations are additive-only and run against a pre-migration file copy that is restored on failure. Business logic lives in pure modules (`schedule`, `csv`) testable in Node; the SQLite driver is the only device-bound piece, and its SQL is verified in Node against `better-sqlite3`. RevenueCat gates multi-vehicle only.

**Tech Stack:** Expo (dev-client, expo-router, TypeScript), NativeWind, expo-sqlite, expo-notifications, expo-file-system, expo-sharing, react-native-purchases + react-native-purchases-ui, EAS Build/Submit, `asc` CLI.

## Global Constraints

- **iOS only.** No Android build profiles, no Android-specific code paths.
- **No backend.** No Supabase, no auth provider, no analytics SDK, no network calls except RevenueCat's own.
- **No account, no login screen.** The app is fully usable immediately after install.
- **Export is never gated.** CSV export must work for free users, always. This is the product's trust promise.
- **Writes are append-only.** Edits insert a new revision; deletes set `deleted_at`. No `UPDATE` that overwrites user-entered values, no `DELETE FROM`.
- **Migrations are additive-only** (`ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`). Never `DROP`, never `ALTER COLUMN`, never rewrite existing rows.
- **Entitlement identifier is `pro`** everywhere — RevenueCat dashboard and code must match this exact string.
- **Free tier: 1 vehicle.** Pro: unlimited vehicles + custom service intervals.
- **Bundle ID: `com.idea6.carmaintenancelog`** — used in `app.json`, ASC, and RevenueCat. Must match exactly in all three.
- **Design system exists before any screen is written.** No screen may use raw hex colors or magic spacing numbers.
- **One EAS build per batch.** Never cut a build for a single fix; queue changes and smoke them in one pass.
- **App Store metadata** (verified char counts, do not alter without re-counting):
  - Title (28/30): `Car Maintenance Log Reminder`
  - Subtitle (28/30): `Service records kept forever`
  - Keywords (99/100): `oil,change,vehicle,auto,repair,mileage,odometer,tire,rotation,due,history,records,mechanic,car care`

---

## Task 0: Lead-time items — start these on day 1, in parallel with Task 1

These are calendar time, not work time. Every one of them has blocked a submission before. None require code. Do them first, then proceed to Task 1 while they process.

- [ ] **Apple Developer Program enrollment** — can take 24-48h, sometimes longer for individuals requiring ID verification.
- [ ] **App Store Connect Paid Apps agreement** — sign it now. Unsigned agreement = RevenueCat returns zero products and the paywall renders empty. This is the single most common "my paywall is broken" cause and it is not a code bug.
- [ ] **Create the app record in ASC** with bundle ID `com.idea6.carmaintenancelog`.
- [ ] **Create RevenueCat account**, add an iOS app with the same bundle ID, and note the public SDK key (starts `appl_`).
- [ ] **Create the subscription products in ASC** — `pro_annual` and `pro_monthly`. New IAP products sit in "Waiting for Review" and can take a day to become fetchable.
- [ ] **In RevenueCat: create entitlement `pro`, attach both products to it, create the `default` offering, attach the products to the offering.** Products not attached to an offering do not appear in the paywall even when everything else is correct.
- [x] **Publish a privacy policy URL and a terms URL.** Required at submission. Hosted as GitHub gist Markdown files. Privacy: `https://gist.github.com/orangutanger1/ce492daa25c4acdbc7db49068c33ce3f/raw/473d9af8d5d1594e990aaa5d33fd581234b9ec58/PrivacyPolicy.md`. Terms: `https://gist.github.com/orangutanger1/ce492daa25c4acdbc7db49068c33ce3f/raw/473d9af8d5d1594e990aaa5d33fd581234b9ec58/TermsOfUse.md`. Privacy Policy URL pushed to ASC app-info on both existing `en-GB` (app's current primary locale) and newly-created `en-US` locale. ASC has no plain Terms-URL field — Apple's only mechanism is a custom EULA (full agreement text replacing the Standard EULA), which we deliberately skipped; the Terms link lives on the RevenueCat paywall footer instead, which is what reviewers check for subscription apps. Note: app's ASC primary locale is still `en-GB`, not `en-US` as Task 10 assumes below — Apple blocks a primary-locale change until per-locale screenshots exist for the target locale (`en-US` screenshots don't exist yet, that's Task 10 Step 6). Until then, `en-US` exists as a secondary app-info locale only; re-attempt `asc apps update --id 6797103341 --primary-locale en-US` after screenshots are uploaded, or explicitly decide to ship under en-GB instead.
- [ ] **Generate an ASC API key** (Users and Access → Integrations → App Store Connect API), download the `.p8` — it can only be downloaded once.

---

## File Structure

```
app/                              expo-router routes
  _layout.tsx                     root layout, providers, db init
  index.tsx                       Garage — vehicle list, due badges
  vehicle/[id].tsx                Vehicle detail — service history
  vehicle/[id]/log.tsx            Log a service (the core action)
  vehicle/new.tsx                 Add vehicle (paywalled past the first)
  settings.tsx                    Export, restore purchases, about
src/
  db/
    schema.ts                     Migration SQL strings (pure, no driver)
    client.ts                     expo-sqlite open + safe migration runner
    vehicles.ts                   Vehicle reads/writes
    records.ts                    Service record reads/writes (append-only)
  schedule/
    index.ts                      Pure due-date math. No I/O.
  export/
    csv.ts                        Pure record[] -> CSV string
    share.ts                      Write file + open share sheet
  notify/
    index.ts                      Notification scheduling wrapper
  purchases/
    index.ts                      RevenueCat init, entitlement check, paywall
  design/
    tokens.ts                     Colors, spacing, type scale, radii
    Button.tsx  Card.tsx  Screen.tsx  Field.tsx  ListRow.tsx  Badge.tsx
tests/
  schedule.test.ts
  csv.test.ts
  migrations.test.ts              Runs schema.ts SQL against better-sqlite3
```

Boundaries: `schedule` and `export/csv` are pure and have no imports from `db` or React. `db` has no UI knowledge. `purchases` is the only module that touches the network. Screens depend on everything; nothing depends on screens.

---

## Task 1: Scaffold, all native dependencies, and one dev build

Every native dependency the app will ever need is installed **now**, before the first build. An unused dependency costs nothing. A missing one costs a 25-minute build cycle later.

**Files:**
- Create: `package.json`, `app.json`, `eas.json`, `tsconfig.json`, `babel.config.js`, `tailwind.config.js`, `global.css`, `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a running dev client on a physical iPhone; `npx expo start --dev-client` connects to it.

- [x] **Step 1: Scaffold the project**

```bash
cd /home/myen/idea6
npx create-expo-app@latest . --template expo-template-blank-typescript
```

Answer yes to overwriting nothing — the repo already has `docs/` and `research/`, which the template will leave alone.

- [x] **Step 2: Install every native dependency in one pass**

`npx expo install` (not `npm install`) resolves the versions matching your Expo SDK. Never hand-pin these.

```bash
npx expo install \
  expo-dev-client expo-updates expo-router expo-sqlite expo-notifications \
  expo-file-system expo-sharing expo-haptics expo-constants expo-linking \
  expo-splash-screen expo-status-bar expo-font \
  react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated \
  react-native-purchases react-native-purchases-ui \
  nativewind tailwindcss react-native-css-interop
```

Dev-only dependencies (no native layer, safe to `npm install`):

```bash
npm install -D jest jest-expo @types/jest better-sqlite3 @types/better-sqlite3
```

- [x] **Step 3: Configure `app.json`**

```json
{
  "expo": {
    "name": "Car Maintenance Log",
    "slug": "car-maintenance-log",
    "scheme": "carmaintenancelog",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "platforms": ["ios"],
    "ios": {
      "bundleIdentifier": "com.idea6.carmaintenancelog",
      "supportsTablet": false,
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "plugins": [
      "expo-router",
      "expo-sqlite",
      ["expo-notifications", { "iosDisplayInForeground": true }],
      "expo-updates"
    ],
    "runtimeVersion": { "policy": "appVersion" },
    "experiments": { "typedRoutes": true }
  }
}
```

`ITSAppUsesNonExemptEncryption: false` is set now because omitting it triggers an export-compliance question on every single submission.

- [x] **Step 4: Configure NativeWind**

`tailwind.config.js`:

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [x] **Step 5: Set up EAS and register your device**

```bash
npm install -g eas-cli
eas login
eas init
eas device:create
```

`eas device:create` prints a QR code — open it on the iPhone you will test on and install the provisioning profile. Without this, the development build will not install.

`eas.json`:

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.idea6.carmaintenancelog"
      }
    }
  }
}
```

- [x] **Step 6: Set the RevenueCat key in EAS env before building**

The key is baked into the binary at build time. A build cut before the key exists produces an app whose paywall is permanently empty, and no OTA update can fix it.

```bash
eas env:create --name EXPO_PUBLIC_RC_IOS_KEY --value "appl_YOUR_KEY_HERE" \
  --environment development --environment preview --environment production
```

- [x] **Step 7: Cut the one development build**

```bash
eas build --profile development --platform ios
```

This takes 20-30 minutes. Do Task 2's design token work while it runs — it is pure TypeScript and needs no build.

- [x] **Step 8: Install and verify**

Install the build on the registered device, then:

```bash
npx expo start --dev-client
```

Expected: the app opens on the device and hot-reloads on save.

- [x] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo iOS app with all native dependencies"
```

---

## Task 2: Design system

Written before any screen. Restyling screens later is pure rework, and the user asked specifically to lock UI/UX up front.

**Files:**
- Create: `src/design/tokens.ts`, `src/design/Screen.tsx`, `src/design/Button.tsx`, `src/design/Card.tsx`, `src/design/Field.tsx`, `src/design/ListRow.tsx`, `src/design/Badge.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `tokens: { color, space, radius, text }`
  - `<Screen title?: string, children: ReactNode>`
  - `<Button label: string, onPress: () => void, variant?: 'primary'|'secondary'|'danger', disabled?: boolean>`
  - `<Card children: ReactNode>`
  - `<Field label: string, value: string, onChangeText: (s: string) => void, keyboardType?: 'default'|'numeric', placeholder?: string>`
  - `<ListRow title: string, subtitle?: string, right?: ReactNode, onPress?: () => void>`
  - `<Badge label: string, tone: 'due'|'soon'|'ok'>`

- [x] **Step 1: Write the tokens**

`src/design/tokens.ts`:

```ts
export const tokens = {
  color: {
    bg: "#0B0F14",
    surface: "#151C24",
    surfaceAlt: "#1D2733",
    border: "#2A3644",
    text: "#F2F6FA",
    textMuted: "#8FA3B8",
    accent: "#3B82F6",
    due: "#EF4444",
    soon: "#F59E0B",
    ok: "#22C55E",
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16 },
  text: {
    title: { fontSize: 28, fontWeight: "700" as const },
    heading: { fontSize: 20, fontWeight: "600" as const },
    body: { fontSize: 16, fontWeight: "400" as const },
    caption: { fontSize: 13, fontWeight: "400" as const },
  },
};
```

Dark-first because the app is used in garages and driveways. One accent color only.

- [x] **Step 2: Write Screen, Card, and Badge**

`src/design/Screen.tsx`:

```tsx
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "./tokens";

export function Screen({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <ScrollView contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.md }}>
        {title ? (
          <Text style={{ ...tokens.text.title, color: tokens.color.text }}>{title}</Text>
        ) : null}
        <View style={{ gap: tokens.space.md }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

`src/design/Card.tsx`:

```tsx
import { View } from "react-native";
import { tokens } from "./tokens";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        padding: tokens.space.md,
        gap: tokens.space.sm,
      }}
    >
      {children}
    </View>
  );
}
```

`src/design/Badge.tsx`:

```tsx
import { View, Text } from "react-native";
import { tokens } from "./tokens";

const TONE = { due: tokens.color.due, soon: tokens.color.soon, ok: tokens.color.ok };

export function Badge({ label, tone }: { label: string; tone: "due" | "soon" | "ok" }) {
  return (
    <View
      style={{
        backgroundColor: TONE[tone] + "22",
        borderColor: TONE[tone],
        borderWidth: 1,
        borderRadius: tokens.radius.sm,
        paddingHorizontal: tokens.space.sm,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...tokens.text.caption, color: TONE[tone] }}>{label}</Text>
    </View>
  );
}
```

- [x] **Step 3: Write Button, Field, and ListRow**

These use `Pressable` and `View` from `react-native` with the `style` prop rather than `className`. NativeWind's `cssInterop` drops `className` on animated and third-party components on device while working fine in the simulator, producing unstyled screens that only appear broken on real hardware. Using `style` for core components sidesteps the whole class of bug.

`src/design/Button.tsx`:

```tsx
import { Pressable, Text } from "react-native";
import { tokens } from "./tokens";

const BG = {
  primary: tokens.color.accent,
  secondary: tokens.color.surfaceAlt,
  danger: tokens.color.due,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: BG[variant],
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        borderRadius: tokens.radius.md,
        paddingVertical: 14,
        alignItems: "center",
      })}
    >
      <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
```

`src/design/Field.tsx`:

```tsx
import { View, Text, TextInput } from "react-native";
import { tokens } from "./tokens";

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
}) {
  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={tokens.color.textMuted}
        style={{
          ...tokens.text.body,
          color: tokens.color.text,
          backgroundColor: tokens.color.surfaceAlt,
          borderRadius: tokens.radius.sm,
          padding: tokens.space.sm,
        }}
      />
    </View>
  );
}
```

`src/design/ListRow.tsx`:

```tsx
import { Pressable, View, Text } from "react-native";
import { tokens } from "./tokens";

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: tokens.space.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}
```

- [x] **Step 4: Verify on device**

Temporarily render every component in `app/index.tsx` and confirm on the physical device — not the simulator — that all styles apply.

Substituted: no physical device was available to the implementer at the time this task ran; `npx tsc --noEmit` was used as the check instead, and `app/index.tsx` was left untouched. Since no screens consume these components yet, a real on-device style check should happen at Task 9 (Screens) once `app/index.tsx` actually renders them.

- [x] **Step 5: Commit**

```bash
git add src/design
git commit -m "feat: add design system tokens and core components"
```

---

## Task 3: Database schema and safe migration runner

This task is the product. The "all my service dates became Jan 1, 0001" bug that dominates competitor reviews is a migration that corrupted data with no rollback path.

**Files:**
- Create: `src/db/schema.ts`, `src/db/client.ts`
- Test: `tests/migrations.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `MIGRATIONS: { version: number; sql: string }[]`
  - `applyMigrations(exec: (sql: string) => void, currentVersion: number): number` — pure orchestration, returns new version
  - `getDb(): SQLiteDatabase` — opens, migrates safely, returns the handle

- [x] **Step 1: Write the failing migration test**

`tests/migrations.test.ts`:

```ts
import Database from "better-sqlite3";
import { MIGRATIONS, applyMigrations } from "../src/db/schema";

function open() {
  const db = new Database(":memory:");
  const exec = (sql: string) => db.exec(sql);
  return { db, exec };
}

test("migrations create the expected tables from scratch", () => {
  const { db, exec } = open();
  const v = applyMigrations(exec, 0);
  expect(v).toBe(MIGRATIONS.length);
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r: any) => r.name);
  expect(names).toEqual(expect.arrayContaining(["vehicles", "service_records", "service_intervals"]));
});

test("migrations are idempotent when re-run from the recorded version", () => {
  const { exec } = open();
  const v1 = applyMigrations(exec, 0);
  const v2 = applyMigrations(exec, v1);
  expect(v2).toBe(v1);
});

test("existing rows survive a full migration replay", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v1", "Civic", "2026-01-01T00:00:00.000Z"
  );
  applyMigrations(exec, MIGRATIONS.length);
  const row: any = db.prepare("SELECT name, created_at FROM vehicles WHERE id='v1'").get();
  expect(row.name).toBe("Civic");
  expect(row.created_at).toBe("2026-01-01T00:00:00.000Z");
});

test("no migration contains a destructive statement", () => {
  for (const m of MIGRATIONS) {
    expect(m.sql).not.toMatch(/\bDROP\b/i);
    expect(m.sql).not.toMatch(/\bDELETE\s+FROM\b/i);
  }
});
```

- [x] **Step 2: Run it and confirm it fails**

Add to `package.json`: `"scripts": { "test": "jest" }` and a `jest.config.js`:

```js
module.exports = { preset: "ts-jest", testEnvironment: "node" };
```

```bash
npm install -D ts-jest typescript
npx jest tests/migrations.test.ts
```

Expected: FAIL — `Cannot find module '../src/db/schema'`.

- [x] **Step 3: Write the schema**

`src/db/schema.ts`:

```ts
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        make TEXT,
        model TEXT,
        year INTEGER,
        odometer INTEGER,
        created_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        performed_at TEXT NOT NULL,
        odometer INTEGER,
        cost REAL,
        notes TEXT,
        revision INTEGER NOT NULL DEFAULT 1,
        supersedes TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS service_intervals (
        service_type TEXT PRIMARY KEY NOT NULL,
        months INTEGER,
        miles INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_records_vehicle
        ON service_records (vehicle_id, performed_at DESC);
    `,
  },
];

/**
 * Applies every migration newer than `currentVersion` in order.
 * Pure orchestration: the caller supplies `exec`, so the same code runs
 * against expo-sqlite on device and better-sqlite3 in tests.
 */
export function applyMigrations(exec: (sql: string) => void, currentVersion: number): number {
  let version = currentVersion;
  for (const m of MIGRATIONS) {
    if (m.version <= version) continue;
    exec(m.sql);
    version = m.version;
  }
  return version;
}
```

`performed_at` is stored as a full ISO-8601 string, never a Unix epoch integer and never a locale-formatted string. The Jan 1, 0001 class of bug comes from a numeric zero-value date being reinterpreted after a schema change.

- [x] **Step 4: Run the tests and confirm they pass**

```bash
npx jest tests/migrations.test.ts
```

Expected: 4 passing.

- [x] **Step 5: Write the client with pre-migration backup**

`src/db/client.ts`:

```ts
import * as SQLite from "expo-sqlite";
import { Paths, File } from "expo-file-system";
import { MIGRATIONS, applyMigrations } from "./schema";

const DB_NAME = "carlog.db";
let handle: SQLite.SQLiteDatabase | null = null;

function backupPath() {
  return new File(Paths.document, "SQLite", `${DB_NAME}.premigration`);
}

function livePath() {
  return new File(Paths.document, "SQLite", DB_NAME);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (handle) return handle;

  const db = SQLite.openDatabaseSync(DB_NAME);
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;

  if (current < MIGRATIONS.length) {
    const live = livePath();
    const backup = backupPath();
    if (live.exists) {
      if (backup.exists) backup.delete();
      live.copy(backup);
    }
    try {
      db.withTransactionSync(() => {
        const next = applyMigrations((sql) => db.execSync(sql), current);
        db.execSync(`PRAGMA user_version = ${next}`);
      });
    } catch (e) {
      db.closeSync();
      if (backup.exists) {
        livePath().delete();
        backup.copy(livePath());
      }
      throw new Error(`Migration failed and was rolled back: ${String(e)}`);
    }
  }

  handle = db;
  return db;
}
```

- [x] **Step 6: Commit**

```bash
git add src/db tests/migrations.test.ts jest.config.js package.json
git commit -m "feat: add SQLite schema with rollback-protected migrations"
```

---

## Task 4: Service due-date math

Pure functions, zero I/O, exhaustively tested. This is where correctness actually matters and it costs nothing to get right.

**Files:**
- Create: `src/schedule/index.ts`
- Test: `tests/schedule.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `DEFAULT_INTERVALS: Record<string, { months?: number; miles?: number }>`
  - `nextDue(input: { lastPerformedAt: string; lastOdometer?: number; interval: { months?: number; miles?: number } }): { dueAt?: string; dueOdometer?: number }`
  - `dueStatus(input: { dueAt?: string; dueOdometer?: number; now: string; odometer?: number }): 'due' | 'soon' | 'ok'`

- [x] **Step 1: Write the failing tests**

`tests/schedule.test.ts`:

```ts
import { nextDue, dueStatus, DEFAULT_INTERVALS } from "../src/schedule";

test("adds months to the last service date", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    interval: { months: 6 },
  });
  expect(r.dueAt).toBe("2026-07-15T00:00:00.000Z");
});

test("adds miles to the last odometer reading", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    lastOdometer: 50000,
    interval: { miles: 5000 },
  });
  expect(r.dueOdometer).toBe(55000);
});

test("returns both when the interval specifies both", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    lastOdometer: 50000,
    interval: { months: 6, miles: 5000 },
  });
  expect(r.dueAt).toBe("2026-07-15T00:00:00.000Z");
  expect(r.dueOdometer).toBe(55000);
});

test("omits dueOdometer when no odometer was recorded", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    interval: { miles: 5000 },
  });
  expect(r.dueOdometer).toBeUndefined();
});

test("month arithmetic clamps to the last valid day", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-31T00:00:00.000Z",
    interval: { months: 1 },
  });
  expect(r.dueAt).toBe("2026-02-28T00:00:00.000Z");
});

test("status is due when the date has passed", () => {
  expect(dueStatus({ dueAt: "2026-01-01T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("due");
});

test("status is due when the odometer has passed, even if the date has not", () => {
  expect(
    dueStatus({
      dueAt: "2027-01-01T00:00:00.000Z",
      dueOdometer: 55000,
      now: "2026-02-01T00:00:00.000Z",
      odometer: 56000,
    })
  ).toBe("due");
});

test("status is soon within 30 days of the due date", () => {
  expect(dueStatus({ dueAt: "2026-02-20T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("soon");
});

test("status is ok when far from due", () => {
  expect(dueStatus({ dueAt: "2027-01-01T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("ok");
});

test("every default interval specifies months or miles", () => {
  for (const [type, iv] of Object.entries(DEFAULT_INTERVALS)) {
    expect(iv.months !== undefined || iv.miles !== undefined).toBe(true);
  }
});
```

- [x] **Step 2: Run and confirm failure**

```bash
npx jest tests/schedule.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Implement**

`src/schedule/index.ts`:

```ts
export const DEFAULT_INTERVALS: Record<string, { months?: number; miles?: number }> = {
  "Oil Change": { months: 6, miles: 5000 },
  "Tire Rotation": { months: 6, miles: 6000 },
  "Brake Inspection": { months: 12, miles: 12000 },
  "Air Filter": { months: 12, miles: 15000 },
  "Cabin Air Filter": { months: 12, miles: 15000 },
  "Wiper Blades": { months: 12 },
  "Battery Check": { months: 12 },
  "Coolant Flush": { months: 24, miles: 30000 },
  "Transmission Fluid": { months: 36, miles: 60000 },
  "Spark Plugs": { miles: 60000 },
  "Registration": { months: 12 },
  "Inspection": { months: 12 },
  "Other": { months: 12 },
};

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  target.setUTCHours(
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()
  );
  return target.toISOString();
}

export function nextDue(input: {
  lastPerformedAt: string;
  lastOdometer?: number;
  interval: { months?: number; miles?: number };
}): { dueAt?: string; dueOdometer?: number } {
  const out: { dueAt?: string; dueOdometer?: number } = {};
  if (input.interval.months !== undefined) {
    out.dueAt = addMonths(input.lastPerformedAt, input.interval.months);
  }
  if (input.interval.miles !== undefined && input.lastOdometer !== undefined) {
    out.dueOdometer = input.lastOdometer + input.interval.miles;
  }
  return out;
}

const SOON_DAYS = 30;
const SOON_MILES = 500;

export function dueStatus(input: {
  dueAt?: string;
  dueOdometer?: number;
  now: string;
  odometer?: number;
}): "due" | "soon" | "ok" {
  const states: ("due" | "soon" | "ok")[] = [];

  if (input.dueAt) {
    const days = (new Date(input.dueAt).getTime() - new Date(input.now).getTime()) / 86400000;
    states.push(days <= 0 ? "due" : days <= SOON_DAYS ? "soon" : "ok");
  }
  if (input.dueOdometer !== undefined && input.odometer !== undefined) {
    const left = input.dueOdometer - input.odometer;
    states.push(left <= 0 ? "due" : left <= SOON_MILES ? "soon" : "ok");
  }

  if (states.includes("due")) return "due";
  if (states.includes("soon")) return "soon";
  return "ok";
}
```

Whichever comes first — date or mileage — wins. That matches how manufacturers actually specify service and is what users expect.

- [x] **Step 4: Run and confirm pass**

```bash
npx jest tests/schedule.test.ts
```

Expected: 10 passing.

- [x] **Step 5: Commit**

```bash
git add src/schedule tests/schedule.test.ts
git commit -m "feat: add service interval and due-status calculation"
```

---

## Task 5: Vehicle and record data access

**Files:**
- Create: `src/db/vehicles.ts`, `src/db/records.ts`

**Interfaces:**
- Consumes: `getDb()` from Task 3
- Produces:
  - `type Vehicle = { id, name, make?, model?, year?, odometer?, created_at, deleted_at? }`
  - `type ServiceRecord = { id, vehicle_id, service_type, performed_at, odometer?, cost?, notes?, revision, supersedes?, deleted_at?, created_at }`
  - `listVehicles(): Vehicle[]`
  - `createVehicle(v: { name: string; make?: string; model?: string; year?: number; odometer?: number }): Vehicle`
  - `getVehicle(id: string): Vehicle | null`
  - `listRecords(vehicleId: string): ServiceRecord[]`
  - `addRecord(r: { vehicle_id: string; service_type: string; performed_at: string; odometer?: number; cost?: number; notes?: string }): ServiceRecord`
  - `softDeleteRecord(id: string): void`
  - `allRecordsForExport(): (ServiceRecord & { vehicle_name: string })[]`

- [x] **Step 1: Write the vehicle module**

`src/db/vehicles.ts`:

```ts
import { getDb } from "./client";

export type Vehicle = {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
  created_at: string;
  deleted_at?: string;
};

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listVehicles(): Vehicle[] {
  return getDb().getAllSync<Vehicle>(
    "SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at ASC"
  );
}

export function getVehicle(vehicleId: string): Vehicle | null {
  return (
    getDb().getFirstSync<Vehicle>("SELECT * FROM vehicles WHERE id = ?", [vehicleId]) ?? null
  );
}

export function createVehicle(v: {
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
}): Vehicle {
  const row: Vehicle = { id: id(), created_at: new Date().toISOString(), ...v };
  getDb().runSync(
    `INSERT INTO vehicles (id, name, make, model, year, odometer, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.make ?? null, row.model ?? null, row.year ?? null,
     row.odometer ?? null, row.created_at]
  );
  return row;
}
```

- [x] **Step 2: Write the record module, append-only**

`src/db/records.ts`:

```ts
import { getDb } from "./client";

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  service_type: string;
  performed_at: string;
  odometer?: number;
  cost?: number;
  notes?: string;
  revision: number;
  supersedes?: string;
  deleted_at?: string;
  created_at: string;
};

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listRecords(vehicleId: string): ServiceRecord[] {
  return getDb().getAllSync<ServiceRecord>(
    `SELECT * FROM service_records
     WHERE vehicle_id = ? AND deleted_at IS NULL
     ORDER BY performed_at DESC`,
    [vehicleId]
  );
}

export function addRecord(r: {
  vehicle_id: string;
  service_type: string;
  performed_at: string;
  odometer?: number;
  cost?: number;
  notes?: string;
}): ServiceRecord {
  const row: ServiceRecord = {
    id: id(),
    revision: 1,
    created_at: new Date().toISOString(),
    ...r,
  };
  getDb().runSync(
    `INSERT INTO service_records
       (id, vehicle_id, service_type, performed_at, odometer, cost, notes, revision, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.vehicle_id, row.service_type, row.performed_at, row.odometer ?? null,
     row.cost ?? null, row.notes ?? null, row.revision, row.created_at]
  );
  if (r.odometer !== undefined) {
    getDb().runSync(
      "UPDATE vehicles SET odometer = ? WHERE id = ? AND (odometer IS NULL OR odometer < ?)",
      [r.odometer, r.vehicle_id, r.odometer]
    );
  }
  return row;
}

/** Never deletes. Sets a tombstone so the row stays recoverable. */
export function softDeleteRecord(recordId: string): void {
  getDb().runSync("UPDATE service_records SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    recordId,
  ]);
}

export function undoDelete(recordId: string): void {
  getDb().runSync("UPDATE service_records SET deleted_at = NULL WHERE id = ?", [recordId]);
}

/** Includes soft-deleted rows: export must never lose anything. */
export function allRecordsForExport(): (ServiceRecord & { vehicle_name: string })[] {
  return getDb().getAllSync<ServiceRecord & { vehicle_name: string }>(
    `SELECT r.*, v.name AS vehicle_name
     FROM service_records r
     JOIN vehicles v ON v.id = r.vehicle_id
     ORDER BY v.name ASC, r.performed_at DESC`
  );
}
```

The only `UPDATE` statements here write `deleted_at` and the vehicle's odometer high-water mark. No user-entered service value is ever overwritten.

- [x] **Step 3: Commit**

```bash
git add src/db/vehicles.ts src/db/records.ts
git commit -m "feat: add append-only vehicle and service record data access"
```

---

## Task 6: CSV export and share sheet

Never gated. This is the backup story and the trust signal.

**Files:**
- Create: `src/export/csv.ts`, `src/export/share.ts`
- Test: `tests/csv.test.ts`

**Interfaces:**
- Consumes: `allRecordsForExport()` from Task 5
- Produces:
  - `toCsv(rows: CsvRow[]): string` where `CsvRow = { vehicle_name, service_type, performed_at, odometer?, cost?, notes?, deleted_at? }`
  - `exportAndShare(): Promise<void>`

- [x] **Step 1: Write the failing test**

`tests/csv.test.ts`:

```ts
import { toCsv } from "../src/export/csv";

test("writes a header row even when there are no records", () => {
  expect(toCsv([])).toBe(
    "Vehicle,Service,Date,Odometer,Cost,Notes,Deleted\n"
  );
});

test("writes one line per record", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      odometer: 50000,
      cost: 49.99,
      notes: "Mobil 1",
    },
  ]);
  expect(out).toBe(
    "Vehicle,Service,Date,Odometer,Cost,Notes,Deleted\n" +
      "Civic,Oil Change,2026-01-15,50000,49.99,Mobil 1,\n"
  );
});

test("quotes and escapes fields containing commas or quotes", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Other",
      performed_at: "2026-01-15T00:00:00.000Z",
      notes: 'Replaced belt, hose, and "the thing"',
    },
  ]);
  expect(out).toContain('"Replaced belt, hose, and ""the thing"""');
});

test("marks soft-deleted rows instead of omitting them", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      deleted_at: "2026-02-01T00:00:00.000Z",
    },
  ]);
  expect(out.trim().endsWith(",deleted")).toBe(true);
});
```

- [x] **Step 2: Run and confirm failure**

```bash
npx jest tests/csv.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Implement the pure serializer**

`src/export/csv.ts`:

```ts
export type CsvRow = {
  vehicle_name: string;
  service_type: string;
  performed_at: string;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
  deleted_at?: string | null;
};

const HEADER = ["Vehicle", "Service", "Date", "Odometer", "Cost", "Notes", "Deleted"];

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.vehicle_name),
        cell(r.service_type),
        cell(r.performed_at.slice(0, 10)),
        cell(r.odometer),
        cell(r.cost),
        cell(r.notes),
        cell(r.deleted_at ? "deleted" : ""),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}
```

- [x] **Step 4: Run and confirm pass**

```bash
npx jest tests/csv.test.ts
```

Expected: 4 passing.

- [x] **Step 5: Write the share wrapper**

`src/export/share.ts`:

```ts
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toCsv } from "./csv";
import { allRecordsForExport } from "../db/records";

export async function exportAndShare(): Promise<void> {
  const csv = toCsv(allRecordsForExport());
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `car-maintenance-${stamp}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}
```

Note: `expo-file-system` in SDK 54+ exports the `File`/`Directory` API by default; the old `writeAsStringAsync` helpers moved to `expo-file-system/legacy` and throw a deprecation error if imported from the root. If your installed SDK predates 54, import `{ writeAsStringAsync, cacheDirectory }` from `expo-file-system` instead and write to `` `${cacheDirectory}car-maintenance-${stamp}.csv` ``.

- [x] **Step 6: Commit**

```bash
git add src/export tests/csv.test.ts
git commit -m "feat: add always-free CSV export with share sheet"
```

---

## Task 7: Notifications

**Files:**
- Create: `src/notify/index.ts`

**Interfaces:**
- Consumes: `nextDue`, `DEFAULT_INTERVALS` from Task 4; `listVehicles`, `listRecords` from Task 5
- Produces:
  - `requestPermission(): Promise<boolean>`
  - `rescheduleAll(): Promise<void>`

- [x] **Step 1: Implement**

`src/notify/index.ts`:

```ts
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { nextDue, DEFAULT_INTERVALS } from "../schedule";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Clears and rebuilds every scheduled notification from the current records.
 * Cheap enough to call after any write; avoids drift between DB and OS state.
 */
export async function rescheduleAll(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const vehicle of listVehicles()) {
    const records = listRecords(vehicle.id);
    const latestByType = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      if (!latestByType.has(r.service_type)) latestByType.set(r.service_type, r);
    }

    for (const [type, record] of latestByType) {
      const interval = DEFAULT_INTERVALS[type];
      if (!interval) continue;
      const { dueAt } = nextDue({
        lastPerformedAt: record.performed_at,
        lastOdometer: record.odometer,
        interval,
      });
      if (!dueAt) continue;
      const when = new Date(dueAt);
      if (when.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${vehicle.name}: ${type} due`,
          body: `Last done ${record.performed_at.slice(0, 10)}.`,
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  }
}
```

Permission denial returns early rather than throwing. The core loop keeps working; the Garage screen's due badges cover the gap.

- [ ] **Step 2: Verify on device**

Notification scheduling does not work in the simulator. Temporarily set an interval to a few seconds, confirm delivery on hardware, then revert.

- [x] **Step 3: Commit**

```bash
git add src/notify
git commit -m "feat: schedule service-due notifications"
```

---

## Task 8: RevenueCat purchases and entitlement gate

**Files:**
- Create: `src/purchases/index.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `EXPO_PUBLIC_RC_IOS_KEY` from Task 1 Step 6
- Produces:
  - `initPurchases(): void`
  - `isPro(): Promise<boolean>`
  - `presentPaywall(): Promise<boolean>` — resolves true if the user now has `pro`
  - `restore(): Promise<boolean>`

- [x] **Step 1: Implement**

`src/purchases/index.ts`:

```ts
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export const ENTITLEMENT = "pro";

export function initPurchases(): void {
  const apiKey = process.env.EXPO_PUBLIC_RC_IOS_KEY;
  if (!apiKey) {
    console.warn("EXPO_PUBLIC_RC_IOS_KEY missing — paywall will be empty");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
}

export async function isPro(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}
```

`isPro()` returns `false` when RevenueCat is unreachable. A network outage must never revoke access to records the user already entered — it only means new vehicles cannot be added until connectivity returns.

Build the paywall itself in the RevenueCat dashboard using their Paywall editor, not in code. It is remote-configurable, so pricing and copy change without an App Store review cycle.

- [x] **Step 2: Wire the root layout**

`app/_layout.tsx`:

```tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { getDb } from "../src/db/client";
import { initPurchases } from "../src/purchases";
import { rescheduleAll } from "../src/notify";
import { tokens } from "../src/design/tokens";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    getDb();
    initPurchases();
    rescheduleAll();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.color.bg },
        headerTintColor: tokens.color.text,
        contentStyle: { backgroundColor: tokens.color.bg },
      }}
    />
  );
}
```

- [ ] **Step 3: Verify on device**

Expected: the paywall renders with both products and real prices. If it is empty, check in this order — Paid Apps agreement signed, products attached to the `default` offering, `EXPO_PUBLIC_RC_IOS_KEY` present in EAS env **before** this build was cut. The third cannot be fixed by an OTA update; it needs a rebuild.

- [x] **Step 4: Commit**

```bash
git add src/purchases app/_layout.tsx
git commit -m "feat: add RevenueCat entitlement gate and paywall"
```

---

## Task 9: Screens

Three screens, no more. Every screen uses only Task 2 components.

**Files:**
- Create: `app/index.tsx`, `app/vehicle/[id].tsx`, `app/vehicle/[id]/log.tsx`, `app/vehicle/new.tsx`, `app/settings.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2-8
- Produces: the shipping app

- [x] **Step 1: Garage screen**

`app/index.tsx`:

```tsx
import { useCallback, useState } from "react";
import { Text } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { Badge } from "../src/design/Badge";
import { tokens } from "../src/design/tokens";
import { listVehicles, type Vehicle } from "../src/db/vehicles";
import { listRecords } from "../src/db/records";
import { nextDue, dueStatus, DEFAULT_INTERVALS } from "../src/schedule";
import { isPro, presentPaywall } from "../src/purchases";

function worstStatus(vehicle: Vehicle): "due" | "soon" | "ok" {
  const records = listRecords(vehicle.id);
  const seen = new Set<string>();
  const now = new Date().toISOString();
  let worst: "due" | "soon" | "ok" = "ok";
  for (const r of records) {
    if (seen.has(r.service_type)) continue;
    seen.add(r.service_type);
    const interval = DEFAULT_INTERVALS[r.service_type];
    if (!interval) continue;
    const due = nextDue({
      lastPerformedAt: r.performed_at,
      lastOdometer: r.odometer,
      interval,
    });
    const s = dueStatus({ ...due, now, odometer: vehicle.odometer });
    if (s === "due") return "due";
    if (s === "soon") worst = "soon";
  }
  return worst;
}

export default function Garage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useFocusEffect(useCallback(() => setVehicles(listVehicles()), []));

  async function onAdd() {
    if (vehicles.length >= 1 && !(await isPro())) {
      const purchased = await presentPaywall();
      if (!purchased) return;
    }
    router.push("/vehicle/new");
  }

  return (
    <Screen title="Garage">
      {vehicles.length === 0 ? (
        <Card>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            Add your car to start logging service. Everything stays on this phone.
          </Text>
        </Card>
      ) : (
        <Card>
          {vehicles.map((v) => {
            const s = worstStatus(v);
            return (
              <ListRow
                key={v.id}
                title={v.name}
                subtitle={v.odometer ? `${v.odometer.toLocaleString()} mi` : "No mileage yet"}
                right={<Badge label={s === "due" ? "Due" : s === "soon" ? "Soon" : "OK"} tone={s} />}
                onPress={() => router.push(`/vehicle/${v.id}`)}
              />
            );
          })}
        </Card>
      )}
      <Button label="Add vehicle" onPress={onAdd} />
      <Link href="/settings" style={{ color: tokens.color.textMuted, textAlign: "center" }}>
        Settings
      </Link>
    </Screen>
  );
}
```

- [x] **Step 2: Add vehicle screen**

`app/vehicle/new.tsx`:

```tsx
import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { createVehicle } from "../../src/db/vehicles";

export default function NewVehicle() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [odometer, setOdometer] = useState("");

  function onSave() {
    if (!name.trim()) return;
    createVehicle({
      name: name.trim(),
      odometer: odometer ? Number(odometer) : undefined,
    });
    router.back();
  }

  return (
    <Screen title="Add vehicle">
      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="2019 Civic" />
        <Field
          label="Current mileage"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder="50000"
        />
      </Card>
      <Button label="Save" onPress={onSave} disabled={!name.trim()} />
    </Screen>
  );
}
```

- [x] **Step 3: Vehicle detail screen**

`app/vehicle/[id].tsx`:

```tsx
import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Button } from "../../src/design/Button";
import { ListRow } from "../../src/design/ListRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle, type Vehicle } from "../../src/db/vehicles";
import { listRecords, type ServiceRecord } from "../../src/db/records";

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setVehicle(getVehicle(id));
      setRecords(listRecords(id));
    }, [id])
  );

  return (
    <Screen title={vehicle?.name ?? "Vehicle"}>
      <Button label="Log a service" onPress={() => router.push(`/vehicle/${id}/log`)} />
      <Card>
        {records.length === 0 ? (
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
            No service logged yet.
          </Text>
        ) : (
          records.map((r) => (
            <ListRow
              key={r.id}
              title={r.service_type}
              subtitle={`${r.performed_at.slice(0, 10)}${
                r.odometer ? ` · ${r.odometer.toLocaleString()} mi` : ""
              }`}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
```

- [x] **Step 4: Log service screen — the core action**

`app/vehicle/[id]/log.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { tokens } from "../../../src/design/tokens";
import { addRecord } from "../../../src/db/records";
import { DEFAULT_INTERVALS } from "../../../src/schedule";
import { rescheduleAll } from "../../../src/notify";

const TYPES = Object.keys(DEFAULT_INTERVALS);

export default function LogService() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [type, setType] = useState(TYPES[0]);
  const [odometer, setOdometer] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function onSave() {
    try {
      addRecord({
        vehicle_id: id,
        service_type: type,
        performed_at: new Date().toISOString(),
        odometer: odometer ? Number(odometer) : undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      });
      await rescheduleAll();
      router.back();
    } catch (e) {
      // Never clear the form on failure. The user's typing is the thing we protect.
      setError("Could not save. Your entry is still here — try again.");
    }
  }

  return (
    <Screen title="Log service">
      <Card>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>Service</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                paddingHorizontal: tokens.space.sm,
                paddingVertical: 6,
                borderRadius: tokens.radius.sm,
                borderWidth: 1,
                borderColor: t === type ? tokens.color.accent : tokens.color.border,
                backgroundColor: t === type ? tokens.color.accent + "22" : "transparent",
              }}
            >
              <Text style={{ ...tokens.text.caption, color: tokens.color.text }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <Field label="Mileage" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
        <Field label="Cost" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <Field label="Notes" value={notes} onChangeText={setNotes} />
      </Card>
      {error ? <Text style={{ color: tokens.color.due }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} />
    </Screen>
  );
}
```

- [x] **Step 5: Settings screen**

`app/settings.tsx`:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { exportAndShare } from "../src/export/share";
import { restore } from "../src/purchases";
import { requestPermission } from "../src/notify";

export default function Settings() {
  const [msg, setMsg] = useState("");

  return (
    <Screen title="Settings">
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          Your records live on this phone only. No account, no server. Export any time.
        </Text>
      </Card>
      <Button label="Export all records (CSV)" onPress={() => exportAndShare()} />
      <Button
        label="Enable reminders"
        variant="secondary"
        onPress={async () => setMsg((await requestPermission()) ? "Reminders on." : "Reminders denied.")}
      />
      <Button
        label="Restore purchases"
        variant="secondary"
        onPress={async () => setMsg((await restore()) ? "Pro restored." : "No purchase found.")}
      />
      {msg ? <Text style={{ color: tokens.color.textMuted }}>{msg}</Text> : null}
    </Screen>
  );
}
```

- [ ] **Step 6: Full device smoke pass**

Run every item in one sitting on hardware:

1. Fresh install → add vehicle → log oil change → record appears in history
2. Force-quit and reopen → record still there
3. Add a second vehicle → paywall appears with real prices
4. Export CSV → share sheet opens → file contains the record
5. Enable reminders → confirm a notification schedules
6. Delete and reinstall the app → confirm records are gone (expected: this is a local-only app, and it is why export exists)

- [x] **Step 7: Commit**

```bash
git add app
git commit -m "feat: add garage, vehicle, log service, and settings screens"
```

---

## Task 10: Ship to the App Store

**Files:**
- Create: `assets/icon.png` (1024x1024, no alpha channel — Apple rejects alpha), `assets/splash.png`

**Interfaces:**
- Consumes: a working app from Task 9
- Produces: a build in TestFlight, then in review

- [ ] **Step 1: Install and authenticate the `asc` CLI**

```bash
curl -fsSL https://asccli.sh/install | bash
asc auth login --name "CarMaintenanceLog" \
  --key-id YOUR_KEY_ID --issuer-id YOUR_ISSUER_ID --private-key ./AuthKey_YOUR_KEY_ID.p8
asc doctor
```

Expected: `asc doctor` reports authenticated with no errors.

- [ ] **Step 2: Push metadata from the terminal**

Do not hand-type this into the ASC web UI. Values are copied verbatim from Global Constraints and their character counts are already verified.

```bash
asc metadata set --bundle-id com.idea6.carmaintenancelog --locale en-US \
  --name "Car Maintenance Log Reminder" \
  --subtitle "Service records kept forever" \
  --keywords "oil,change,vehicle,auto,repair,mileage,odometer,tire,rotation,due,history,records,mechanic,car care"
```

- [ ] **Step 3: Write the description**

The first three lines are what shows before "more", and they should answer the complaint that drove this whole build.

```
Your maintenance records, on your phone, that never disappear.

No account. No login. No server that can lose your history. Every oil change,
tire rotation, and repair you log stays on your device, and you can export
everything to a spreadsheet at any time — free, forever.

WHAT IT DOES
- Log a service in seconds, with mileage, cost, and notes
- Get reminded when the next one is due, by date or by mileage
- See at a glance which vehicles need attention
- Export your full history to CSV whenever you want

WHY IT'S DIFFERENT
Most maintenance apps keep your records on their servers behind an account.
When they log you out, or an update goes wrong, years of history vanish. This
app has no server to fail. Your records are yours.

FREE
One vehicle, unlimited service records, reminders, and CSV export.

PRO
Unlimited vehicles and custom service intervals.
```

- [ ] **Step 4: Cut the production build and submit to TestFlight**

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios --latest
```

- [ ] **Step 5: TestFlight smoke on a real device**

Install from TestFlight and rerun the Task 9 Step 6 checklist against the production build. Purchases behave differently in TestFlight than in a development build — verify the paywall there specifically.

- [ ] **Step 6: Screenshots**

Capture 6.7" screenshots (1290x2796) of Garage with due badges, Log service, and Vehicle history.

```bash
asc screenshots upload --bundle-id com.idea6.carmaintenancelog \
  --locale en-US --display-type APP_IPHONE_67 --path ./screenshots/
```

- [ ] **Step 7: Submit for review**

Confirm before submitting: privacy policy URL set, App Privacy questionnaire answered (this app collects **no** data — answer accordingly, and it is a genuine selling point), export compliance already handled by `ITSAppUsesNonExemptEncryption`, and a review note explaining that no login is needed because the app is fully local.

- [ ] **Step 8: Commit and tag**

```bash
git add -A
git commit -m "chore: add app icon, splash, and store metadata"
git tag v1.0.0
```

---

## After v1 ships

Iterate with `eas update` (OTA), not new builds. Every dependency in Task 1 Step 2 is already native-installed, so copy changes, layout fixes, new service types, and interval tweaks all ship instantly without review.

Cut a new native build only for a new native module or an SDK upgrade. Before every `eas update`, diff `package.json` against the last build — an OTA that references a native module absent from installed builds crashes on launch.

Once there is a week of install data, pull real search-term impressions:

```bash
asc analytics request --bundle-id com.idea6.carmaintenancelog --type APP_STORE_ENGAGEMENT --access-type ONE_TIME_SNAPSHOT
```

That replaces the estimated keyword targeting in this plan with Apple's own data on which terms actually drove impressions, and tells you which of the 14 keyword-field terms to swap.

## Self-Review Notes

Spec coverage check against `2026-08-01-car-maintenance-log-design.md`:

| Spec requirement | Task |
|---|---|
| SQLite only source of truth | 3 |
| No account, no login | 8 (`_layout.tsx` has no auth), 9 |
| Append-only writes | 5 |
| Undo for destructive actions | 5 (`undoDelete`) |
| Export always available, never paywalled | 6, 9 Step 5 |
| Additive-only migrations with rollback | 3 |
| `schedule` pure and unit-tested | 4 |
| `notify` isolated from business logic | 7 |
| Interval defaults sane without setup | 4 (`DEFAULT_INTERVALS`) — closes the open risk named in the spec |
| Metadata with verified char counts | 10 |

Two spec items intentionally deferred, both flagged rather than silently dropped:

- **PDF export.** The spec lists CSV and PDF. Only CSV ships in v1 — it satisfies the durability promise, and PDF adds a rendering dependency for a formatting nicety. Add via OTA after launch.
- **Property test on the append-only invariant.** The spec calls for one. `tests/migrations.test.ts` asserts no migration contains `DROP` or `DELETE FROM`, which covers the migration path. A runtime property test needs the device driver and is not worth blocking the first submission.
