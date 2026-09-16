const pushed: string[] = [];
jest.mock("expo-router", () => ({ router: { push: (to: string) => pushed.push(to) } }));

import { isPaywallOpen, openPaywall, settlePaywall } from "../src/paywall/present";

beforeEach(() => {
  pushed.length = 0;
  if (isPaywallOpen()) settlePaywall("dismissed");
});

test("opening pushes the route with its offering and source, and waits", async () => {
  const pending = openPaywall("discount", "winback");
  expect(pushed).toEqual(["/paywall?offering=discount&source=winback"]);
  expect(isPaywallOpen()).toBe(true);
  settlePaywall("purchased");
  await expect(pending).resolves.toBe("purchased");
  expect(isPaywallOpen()).toBe(false);
});

test("a second open while one is parked settles the first as dismissed", async () => {
  const first = openPaywall("default", "settings");
  const second = openPaywall("default", "garage");
  await expect(first).resolves.toBe("dismissed");
  settlePaywall("unavailable");
  await expect(second).resolves.toBe("unavailable");
  expect(pushed).toHaveLength(2);
});

test("settling with nothing parked is a no-op", () => {
  expect(() => settlePaywall("purchased")).not.toThrow();
  expect(isPaywallOpen()).toBe(false);
});
