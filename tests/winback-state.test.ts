import { shouldOfferWinback, AWAY_DAYS, COOLDOWN_DAYS } from "../src/winback/state";

const NOW = new Date("2026-08-03T12:00:00");

function daysBefore(n: number): string {
  return new Date(NOW.getTime() - n * 86400000).toISOString();
}

function ask(over: Partial<Parameters<typeof shouldOfferWinback>[0]> = {}) {
  return shouldOfferWinback({
    lastOpenAt: daysBefore(AWAY_DAYS + 1),
    lastShownAt: null,
    now: NOW,
    isPro: false,
    hasOffer: true,
    ...over,
  });
}

test("a long absence earns the screen", () => {
  expect(ask()).toBe(true);
});

test("someone who was here last week does not get it", () => {
  expect(ask({ lastOpenAt: daysBefore(AWAY_DAYS - 1) })).toBe(false);
});

test("the first launch after onboarding is not an absence", () => {
  expect(ask({ lastOpenAt: null })).toBe(false);
});

test("a subscriber is never interrupted with it", () => {
  // They have a real exit — the cancel flow, which carries its own survey and
  // its own offer.
  expect(ask({ isPro: true })).toBe(false);
});

test("no trial offering configured means no screen", () => {
  expect(ask({ hasOffer: false })).toBe(false);
});

test("asked once, then left alone", () => {
  expect(ask({ lastShownAt: daysBefore(COOLDOWN_DAYS - 1) })).toBe(false);
  expect(ask({ lastShownAt: daysBefore(COOLDOWN_DAYS) })).toBe(true);
});

test("a clock that moved backwards is not an enormous absence", () => {
  // Restored backup, timezone change, or a user resetting the date.
  expect(ask({ lastOpenAt: new Date(NOW.getTime() + 86400000).toISOString() })).toBe(false);
});

test("the boundary is inclusive so the window cannot be missed by a tick", () => {
  expect(ask({ lastOpenAt: daysBefore(AWAY_DAYS) })).toBe(true);
});
