/**
 * The one-shot "a service was just logged" signal.
 *
 * The log form saves and pops; the screen it pops back onto is the one that
 * shows the celebration, because that is where the mascot is. A module flag
 * rather than a route param: the form cannot know which screen is underneath
 * (Today, the Garage, or the vehicle), and whichever focuses first takes it.
 */
let pending: { vehicleId: string; service: string } | null = null;

export function markLogged(vehicleId: string, service: string): void {
  pending = { vehicleId, service };
}

/** Returns and clears the pending celebration. */
export function takeLogged(): { vehicleId: string; service: string } | null {
  const out = pending;
  pending = null;
  return out;
}
