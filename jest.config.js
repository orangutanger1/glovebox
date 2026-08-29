// Due dates are computed on the local calendar and pinned to a local hour, so
// the suite has to run in a known timezone or those assertions mean nothing.
// New York is deliberately not UTC: it catches the case where UTC arithmetic
// and a local read disagree about which day it is.
process.env.TZ = "America/New_York";

// A `production` NODE_ENV inherited from the shell loads React's production
// build inside the workers, where `act` does not exist, and every component
// test dies on it. The suite runs against the development builds or not at all.
process.env.NODE_ENV = "test";

/**
 * Two projects, because the suite tests two different things.
 *
 * `logic` is everything pure: schedules, formatting, migrations, the plan.
 * ts-jest in Node, no React, no native modules, and it stays fast.
 *
 * `screens` renders the actual screen components, which needs Expo's preset to
 * transform react-native and the expo packages. It is the only way to assert
 * what a screen puts on the glass, and the onboarding flow has bugs that live
 * exactly there: a field that comes back empty, a button that is live before
 * its content has been read.
 */
module.exports = {
  projects: [
    {
      displayName: "logic",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/**/*.test.ts"],
      // Both projects run with the device's Intl surface, not Node's. See
      // tests/hermes-runtime.js: the gap between the two is what got 1.0(11)
      // rejected. `setupFilesAfterEnv` rather than `setupFiles` so it adds to
      // what jest-expo's preset already installs instead of replacing it.
      setupFilesAfterEnv: ["<rootDir>/tests/hermes-runtime.js"],
    },
    {
      displayName: "screens",
      preset: "jest-expo",
      testMatch: ["<rootDir>/tests/**/*.test.tsx"],
      setupFilesAfterEnv: ["<rootDir>/tests/hermes-runtime.js"],
    },
  ],
};
