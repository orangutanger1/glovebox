const state = new Map<string, string>();
jest.mock("../src/db/state", () => ({ getState: (k: string) => state.get(k) ?? null }));

/** A fresh copy of the theme module under the given build env. */
function load(env: Record<string, string | undefined>) {
  jest.resetModules();
  const prev = { ...process.env };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const mod = require("../src/design/theme") as typeof import("../src/design/theme");
  process.env = prev;
  return mod;
}

test("on in arm A, with no build pin", () => {
  state.set("experiment.app_design", "redesign");
  expect(load({ EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(true);
});

test("never in arm B, pin or not", () => {
  state.set("experiment.app_design", "classic");
  expect(load({ EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(false);
});

test("never before the arm is assigned", () => {
  state.clear();
  expect(load({ EXPO_PUBLIC_APP_DESIGN: undefined }).isDesignV2()).toBe(false);
});

test("arm A gets the warm page", () => {
  state.set("experiment.app_design", "redesign");
  load({ EXPO_PUBLIC_APP_DESIGN: undefined });
  const { tokens } = require("../src/design/tokens");
  expect(tokens.color.housing).toBe("#F6F3EE");
});

test("v2 never reaches arm B's page", () => {
  state.set("experiment.app_design", "classic");
  load({ EXPO_PUBLIC_APP_DESIGN: undefined });
  const { tokens } = require("../src/design/tokens");
  expect(tokens.color.housing).toBe("#0A0B0D");
});
