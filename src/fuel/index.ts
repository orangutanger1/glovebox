import { spendByMonth, spendOf, type Spend, type SpendBucket } from "../insights";
import { efficiencyOf, type EfficiencyStyle } from "./units";

/**
 * What a tank of fuel cost and how far it went, derived from the log and
 * nothing else.
 *
 * Pure functions over rows with the query left to the caller, mirroring
 * src/insights, so the whole module runs in plain Node under tests/fuel.test.ts.
 *
 * The rule the module exists to enforce: a figure appears only between two
 * consecutive *full* tanks. Topping a tank back to full replaces precisely the
 * fuel burned since it was last full, so that interval is a measurement rather
 * than an estimate. A partial fill never produces its own figure and is never
 * discarded either — its volume folds into the next full tank, which is the
 * distance it was actually burned over.
 */
export type FuelEntry = {
  id: string;
  vehicle_id: string;
  filled_at: string;
  odometer: number;
  volume: number;
  cost?: number;
  /** SQLite has no boolean. 1 is a full tank, 0 a partial. */
  full: number;
};

export type TankFigure = {
  entryId: string;
  distance: number;
  volume: number;
  efficiency: number;
};

/** Odometer order, not date order: efficiency is computed over distance, so the
 *  odometer is the true sequence. Someone logging yesterday's fill this morning
 *  is placed correctly by mileage. Copied rather than sorted in place — callers
 *  hand us the array they are rendering from. */
function byOdometer(entries: readonly FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => a.odometer - b.odometer);
}

/** A row the arithmetic can stand on. `volume` and `odometer` are NOT NULL in
 *  the schema, so this only guards against a value that never parsed into a
 *  sane number. */
function usable(entry: FuelEntry): boolean {
  return Number.isFinite(entry.volume) && entry.volume > 0 && Number.isFinite(entry.odometer);
}

/** A cost that can be added up: present, finite, and not negative — the same
 *  test src/insights applies, because the two totals answer to the same rule. */
function priced(entry: FuelEntry): number | null {
  const c = entry.cost;
  if (c === undefined || c === null) return null;
  if (!Number.isFinite(c) || c < 0) return null;
  return c;
}

export function mpgSeries(
  entries: readonly FuelEntry[],
  style: EfficiencyStyle
): TankFigure[] {
  const sorted = byOdometer(entries).filter(usable);
  const figures: TankFigure[] = [];

  // The last full fill we trust, and the fuel put in since it — partials
  // included, because they went into the same distance.
  let previousFull: FuelEntry | null = null;
  let volumeSince = 0;

  for (const entry of sorted) {
    volumeSince += entry.volume;
    if (entry.full !== 1) continue;

    if (previousFull) {
      const distance = entry.odometer - previousFull.odometer;
      const efficiency = efficiencyOf(distance, volumeSince, style);
      // A non-advancing odometer — a typo, or another car's number — yields
      // nothing rather than a zero or a negative. The volume is not thrown
      // away: it stays in `volumeSince` for the next tank that does advance.
      if (efficiency !== null) {
        figures.push({ entryId: entry.id, distance, volume: volumeSince, efficiency });
        previousFull = entry;
        volumeSince = 0;
      }
      continue;
    }

    // The first full fill anchors the series and yields nothing itself: nobody
    // knows how full the tank was before it, so any figure would be invented.
    previousFull = entry;
    volumeSince = 0;
  }

  return figures;
}

export function latestEfficiency(
  entries: readonly FuelEntry[],
  style: EfficiencyStyle
): number | null {
  const series = mpgSeries(entries, style);
  return series.length ? series[series.length - 1].efficiency : null;
}

/**
 * Total distance over total volume across the qualifying tanks — not the mean
 * of the per-tank figures. A 100-mile tank and a 500-mile tank do not weigh the
 * same, and averaging their figures pretends they do.
 */
export function averageEfficiency(
  entries: readonly FuelEntry[],
  style: EfficiencyStyle
): number | null {
  const series = mpgSeries(entries, style);
  if (!series.length) return null;
  let distance = 0;
  let volume = 0;
  for (const f of series) {
    distance += f.distance;
    volume += f.volume;
  }
  return efficiencyOf(distance, volume, style);
}

/** Fuel rows in the shape the spend arithmetic reads. `service_type` is a
 *  constant here: fuel is one category by definition, and the field exists only
 *  because `Spend` is shared with the service totals. */
function costed(entries: readonly FuelEntry[]) {
  return entries.map((e) => ({
    vehicle_id: e.vehicle_id,
    service_type: "fuel",
    performed_at: e.filled_at,
    cost: e.cost,
  }));
}

/** The same `Spend` the costs screen is built on, so the fuel card inherits its
 *  provenance discipline and can caption "from 9 of 11 fills". */
export function fuelSpend(entries: readonly FuelEntry[]): Spend {
  return spendOf(costed(entries));
}

export function fuelSpendByMonth(
  entries: readonly FuelEntry[],
  months: number,
  now: Date = new Date()
): SpendBucket[] {
  return spendByMonth(costed(entries), months, now);
}

/**
 * Fuel cost per unit of distance, over the tanks that are both priced and
 * measurable.
 *
 * A tank counts only when every fill that made it up carries a cost. An
 * unpriced fill inside a tank would otherwise understate that tank's cost while
 * keeping its whole distance, which is worse than leaving the tank out: it is a
 * wrong number rather than a missing one.
 */
export function costPerDistance(entries: readonly FuelEntry[]): number | null {
  const sorted = byOdometer(entries).filter(usable);
  let previousFull: FuelEntry | null = null;
  let costSince = 0;
  let pricedSince = true;
  let distance = 0;
  let cost = 0;

  for (const entry of sorted) {
    const c = priced(entry);
    if (c === null) pricedSince = false;
    else costSince += c;

    if (entry.full !== 1) continue;

    if (previousFull) {
      const d = entry.odometer - previousFull.odometer;
      if (d > 0) {
        if (pricedSince) {
          distance += d;
          cost += costSince;
        }
        previousFull = entry;
        costSince = 0;
        pricedSince = true;
      }
      continue;
    }
    previousFull = entry;
    costSince = 0;
    pricedSince = true;
  }

  if (distance <= 0) return null;
  return cost / distance;
}
